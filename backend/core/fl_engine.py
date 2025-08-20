"""
Enterprise-grade Federated Learning Engine (drop-in upgrade)
- Replace the previous FederatedLearningEngine content with this file.
- Designed to run inside your existing backend package.
- Requires: torch, numpy, scikit-learn, structlog, prometheus_client (optional)
"""

import asyncio
import csv
import os
import time
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Callable, Iterable, Tuple
import threading
import traceback
import json
import copy
import math
import random

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.datasets import make_classification
from typing import TYPE_CHECKING

import structlog

# Optional metrics (install prometheus_client to enable)
try:
    from prometheus_client import Counter, Gauge
    PROM_AVAILABLE = True
except Exception:
    PROM_AVAILABLE = False

logger = structlog.get_logger()

# Import your websocket manager (adjust path if needed)
try:
    # If this engine file sits in backend/core/
    from .websocket import ws_manager
except Exception:
    try:
        # Alternatively try sibling import
        from websocket import ws_manager
    except Exception:
        ws_manager = None
        logger.warning("ws_manager import failed; WebSocket callbacks disabled.")


# ---------------------------
# Optional Prometheus metrics
# ---------------------------
if PROM_AVAILABLE:
    PROM_FL_ROUNDS = Counter("agisfl_fl_rounds_total", "Federated learning rounds completed")
    PROM_FL_RUNNING = Gauge("agisfl_fl_running", "1 if FL is running, 0 otherwise")
    PROM_FL_CLIENTS = Gauge("agisfl_fl_clients", "Number of registered FL clients")
else:
    PROM_FL_ROUNDS = PROM_FL_RUNNING = PROM_FL_CLIENTS = None


# ---------------------------
# Utility helpers
# ---------------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def safe_call(cb: Optional[Callable], *args, **kwargs):
    if not cb:
        return
    try:
        if asyncio.iscoroutinefunction(cb):
            return asyncio.create_task(cb(*args, **kwargs))
        else:
            # run sync callback in thread to avoid blocking event loop
            return asyncio.get_event_loop().run_in_executor(None, lambda: cb(*args, **kwargs))
    except Exception:
        logger.exception("callback_failed", error=traceback.format_exc())


def set_seed(seed: Optional[int]):
    if seed is None:
        return
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


# ---------------------------
# Neural network model
# ---------------------------
class IDSModel(nn.Module):
    """Neural network model for intrusion detection"""

    def __init__(self, input_size: int = 41, hidden_size: int = 128, num_classes: int = 2):
        super().__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.fc2 = nn.Linear(hidden_size, 64)
        self.fc3 = nn.Linear(64, 32)
        self.fc4 = nn.Linear(32, num_classes)
        self.dropout = nn.Dropout(0.3)
        self.relu = nn.ReLU()

    def forward(self, x):
        x = self.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.relu(self.fc2(x))
        x = self.dropout(x)
        x = self.relu(self.fc3(x))
        x = self.fc4(x)
        return x


# ---------------------------
# Federated client
# ---------------------------
class FederatedClient:
    """Federated learning client (local trainer wrapper)"""

    def __init__(self, client_id: str, data: np.ndarray, labels: np.ndarray, device: Optional[torch.device] = None):
        self.client_id = client_id
        # store numpy arrays for efficient to-thread handling
        self._data_np = np.array(data, dtype=np.float32)
        self._labels_np = np.array(labels, dtype=np.int64)
        self.device = device or (torch.device("cuda") if torch.cuda.is_available() else torch.device("cpu"))
        # create local model instance (will be loaded with global params before train)
        self.model = IDSModel()
        self.criterion = nn.CrossEntropyLoss()
        self.optimizer = optim.Adam(self.model.parameters(), lr=0.001)
        # Move model to device only when training to avoid cross-device state issues
        # Lightweight metadata
        self.num_samples = int(len(self._data_np))

    def _to_device(self, model: nn.Module):
        model.to(self.device)

    def _from_numpy(self):
        return torch.from_numpy(self._data_np).to(self.device), torch.from_numpy(self._labels_np).to(self.device)

    def train(self, global_params: Optional[Dict[str, torch.Tensor]] = None, epochs: int = 5, batch_size: int = 32) -> Dict[str, Any]:
        """
        Synchronous local training. Designed to be run inside a thread via asyncio.to_thread().
        Returns a dict containing model parameters (state_dict), accuracy, loss, and num_samples.
        """
        try:
            # Load global params safely
            if global_params is not None:
                try:
                    # ensure we have a clean model copy
                    self.model.load_state_dict(copy.deepcopy(global_params))
                except Exception:
                    # Incompatible shapes or keys: ignore and continue
                    logger.warning("client_load_global_params_failed", client=self.client_id)

            # Move model to device
            self._to_device(self.model)
            self.model.train()
            data_t, labels_t = self._from_numpy()

            total_loss = 0.0
            correct = 0
            total = 0

            dataset_size = data_t.size(0)
            # Basic batching
            for epoch in range(max(1, epochs)):
                # shuffle indices each epoch for robustness
                perm = torch.randperm(dataset_size, device=self.device)
                for i in range(0, dataset_size, batch_size):
                    idx = perm[i:i + batch_size]
                    batch_x = data_t[idx]
                    batch_y = labels_t[idx]

                    self.optimizer.zero_grad()
                    outputs = self.model(batch_x)
                    loss = self.criterion(outputs, batch_y)
                    loss.backward()
                    self.optimizer.step()

                    total_loss += float(loss.item())
                    _, predicted = torch.max(outputs.data, 1)
                    total += batch_y.size(0)
                    correct += int((predicted == batch_y).sum().item())

            accuracy = (correct / total) if total > 0 else 0.0
            avg_loss = (total_loss / (epochs * math.ceil(dataset_size / batch_size))) if dataset_size > 0 else 0.0

            # Return CPU tensors for aggregation (state_dict may contain CUDA tensors otherwise)
            cpu_params = {k: v.detach().cpu() for k, v in self.model.state_dict().items()}

            return {
                "client_id": self.client_id,
                "parameters": cpu_params,
                "num_samples": self.num_samples,
                "loss": avg_loss,
                "accuracy": accuracy,
            }
        except Exception as e:
            logger.exception("client_train_failed", client=self.client_id, error=str(e))
            # In failure cases return minimal info to avoid halting the server
            return {
                "client_id": self.client_id,
                "parameters": {},
                "num_samples": self.num_samples,
                "loss": None,
                "accuracy": 0.0,
                "error": str(e)
            }


# ---------------------------
# Strategy base & implementations
# ---------------------------
class FLStrategy:
    """Base class for FL strategies"""

    name: str

    def aggregate(self, client_updates: List[Dict[str, Any]]) -> Dict[str, Any]:
        raise NotImplementedError


class FedAvgStrategy(FLStrategy):
    """Federated Averaging strategy"""

    def __init__(self):
        self.name = "FedAvg"

    def aggregate(self, client_updates: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not client_updates:
            return {}

        total_samples = sum(int(u.get("num_samples", 0)) for u in client_updates if u.get("parameters"))
        if total_samples <= 0:
            # fallback: simple param average
            valid_updates = [u for u in client_updates if u.get("parameters")]
            if not valid_updates:
                return {}
            aggregated_params = {}
            for key in valid_updates[0]["parameters"].keys():
                vals = [u["parameters"][key] for u in valid_updates if key in u["parameters"]]
                # average tensors
                aggregated_params[key] = sum(vals) / len(vals)
            accuracy = float(np.mean([u.get("accuracy", 0.0) for u in valid_updates]))
            return {"parameters": aggregated_params, "num_samples": sum(u.get("num_samples", 0) for u in valid_updates), "accuracy": accuracy}

        # Weighted averaging by sample counts
        aggregated_params: Dict[str, torch.Tensor] = {}
        first = next((u for u in client_updates if u.get("parameters")), None)
        if first is None:
            return {}

        for key in first["parameters"].keys():
            weighted = None
            for u in client_updates:
                params = u.get("parameters")
                if not params or key not in params:
                    continue
                weight = float(u.get("num_samples", 0)) / float(total_samples)
                if weighted is None:
                    weighted = params[key].float() * weight
                else:
                    weighted = weighted + params[key].float() * weight
            aggregated_params[key] = weighted

        accuracy = float(np.mean([u.get("accuracy", 0.0) for u in client_updates]))
        return {"parameters": aggregated_params, "num_samples": total_samples, "accuracy": accuracy}


class FedProxStrategy(FLStrategy):
    """Federated Proximal strategy (simplified)"""

    def __init__(self, mu: float = 0.1):
        self.name = "FedProx"
        self.mu = mu

    def aggregate(self, client_updates: List[Dict[str, Any]]) -> Dict[str, Any]:
        # Reuse FedAvg behavior then apply a small proximal-like shrinkage towards first client
        base = FedAvgStrategy().aggregate(client_updates)
        if not base or "parameters" not in base:
            return base

        first_params = client_updates[0].get("parameters", {})
        prox_params = {}
        for k, v in base["parameters"].items():
            prox_params[k] = v * (1 - self.mu) + first_params.get(k, v) * self.mu
        base["parameters"] = prox_params
        return base


# ---------------------------
# FederatedLearningEngine
# ---------------------------
class FederatedLearningEngine:
    """
    Unified, production-oriented Federated Learning Engine.

    Features:
    - Async training orchestration
    - WS callbacks integration (ws_manager)
    - Pause / resume / stop / graceful shutdown
    - Checkpointing (save/load model + history)
    - Evaluation support
    - Strategy switching
    - Prometheus metrics hooks (optional)
    - Reproducibility options (seed)
    """

    def __init__(self, device: Optional[torch.device] = None, seed: Optional[int] = None, checkpoint_dir: str = "checkpoints"):
        self.clients: List[FederatedClient] = []
        self.global_model = IDSModel()
        self.strategies: Dict[str, FLStrategy] = {
            "FedAvg": FedAvgStrategy(),
            "FedProx": FedProxStrategy()
        }
        self.current_strategy: str = "FedAvg"

        self.current_round: int = 0
        self.global_accuracy: float = 0.0
        self.is_training: bool = False
        self.is_ready: bool = False
        self.training_history: List[Dict[str, Any]] = []
        self._stop_event: asyncio.Event = asyncio.Event()
        self._pause_event: asyncio.Event = asyncio.Event()
        self._pause_event.set()  # set when not paused; clear to pause
        self._ws_callback: Optional[Callable[[Dict[str, Any]], Any]] = None
        self._progress_callback: Optional[Callable[[Dict[str, Any]], Any]] = None
        self._lock = asyncio.Lock()
        self.device = device or (torch.device("cuda") if torch.cuda.is_available() else torch.device("cpu"))
        self.checkpoint_dir = checkpoint_dir
        os.makedirs(self.checkpoint_dir, exist_ok=True)
        self.seed = seed
        set_seed(seed)
        # track last exception for diagnostics
        self.last_exception: Optional[str] = None

    # -----------------------
    # Initialization / clients
    # -----------------------
    async def initialize(self, num_clients: int = 5, samples: int = 10000, features: int = 41, **kwargs):
        """Create synthetic dataset and initialize FederatedClient instances."""
        try:
            X, y = make_classification(n_samples=samples, n_features=features, n_classes=2, n_redundant=0, n_informative=min(features, 20), random_state=self.seed or 42)
            client_data = self._create_non_iid_split(X, y, num_clients=num_clients)
            self.clients.clear()
            for i, (cx, cy) in enumerate(client_data):
                client = FederatedClient(f"client_{i}", cx, cy, device=self.device)
                self.clients.append(client)
            self.is_ready = True
            if PROM_AVAILABLE:
                PROM_FL_CLIENTS.set(len(self.clients))
            logger.info("FL engine initialized", num_clients=len(self.clients), device=str(self.device))
        except Exception as e:
            self.last_exception = str(e)
            logger.exception("fl_engine_initialize_failed", error=str(e))
            raise

    def register_client(self, client: FederatedClient):
        """Externally register a pre-configured client (for real-world nodes)."""
        self.clients.append(client)
        if PROM_AVAILABLE:
            PROM_FL_CLIENTS.set(len(self.clients))
        logger.info("client_registered", client_id=client.client_id)

    # -----------------------
    # Training control
    # -----------------------
    async def start_training(self, rounds: int = 50, callback: Optional[Callable] = None, progress_callback: Optional[Callable] = None):
        """
        Start FL training. callback is optional function that will be called with dicts to broadcast (e.g. ws_manager.broadcast).
        progress_callback is used for internal progress events.
        """
        async with self._lock:
            if self.is_training:
                logger.warning("start_training_ignored_already_running")
                return
            if not self.is_ready:
                logger.warning("start_training_ignored_not_ready")
                return
            self.is_training = True
            self._stop_event.clear()
            self._pause_event.set()
            self._ws_callback = callback
            self._progress_callback = progress_callback
            if PROM_AVAILABLE:
                PROM_FL_RUNNING.set(1)
            logger.info("start_training", rounds=rounds, strategy=self.current_strategy)
            # dispatch an async task
            asyncio.create_task(self._training_loop(rounds))

    async def pause_training(self):
        """Pause training (non-destructive)."""
        if not self.is_training:
            return
        self._pause_event.clear()
        logger.info("training_paused")
        safe_call(self._ws_cb, {"event": "paused", "timestamp": now_iso()})

    async def resume_training(self):
        """Resume training."""
        if not self.is_training:
            return
        self._pause_event.set()
        logger.info("training_resumed")
        safe_call(self._ws_cb, {"event": "resumed", "timestamp": now_iso()})

    async def stop_training(self):
        """Request a graceful stop of the training loop."""
        self._stop_event.set()
        self._pause_event.set()  # unpause to allow shutdown
        self.is_training = False
        logger.info("stop_requested")
        safe_call(self._ws_cb, {"event": "stop_requested", "timestamp": now_iso()})
        if PROM_AVAILABLE:
            PROM_FL_RUNNING.set(0)

    # convenience alias for older code that calls sync stop
    def stop_training_sync(self):
        asyncio.create_task(self.stop_training())

    # -----------------------
    # Core training loop
    # -----------------------
    async def _training_loop(self, rounds: int):
        try:
            # Broadcast training started
            self.current_round = 0
            event = {"event": "training_started", "rounds": rounds, "timestamp": now_iso(), "strategy": self.current_strategy}
            await self._emit_event(event)

            for r in range(1, rounds + 1):
                # handle stop
                if self._stop_event.is_set():
                    logger.info("training_loop_stopping")
                    break

                # handle pause
                await self._pause_event.wait()

                self.current_round = r
                logger.debug("starting_round", round=r, strategy=self.current_strategy)

                # client selection (simple random sampling, replaceable)
                selected_clients = self._select_clients(sample_size=min(3, len(self.clients)))
                global_params = self.global_model.state_dict()

                # Run local training on clients in parallel using threads to avoid blocking
                client_futures: List[asyncio.Future] = []
                for client in selected_clients:
                    # run synchronous client.train in a thread
                    fut = asyncio.to_thread(client.train, global_params, 5, 32)
                    client_futures.append(fut)

                # wait for all client trainings to complete with timeout
                client_updates = []
                try:
                    updates = await asyncio.wait_for(asyncio.gather(*client_futures, return_exceptions=True), timeout=600.0)
                    for u in updates:
                        if isinstance(u, Exception):
                            logger.exception("client_train_exception", error=str(u))
                        else:
                            client_updates.append(u)
                except asyncio.TimeoutError:
                    logger.error("client_training_timeout", round=r)
                    # continue with whatever updates arrived
                    # try to cancel any remaining (best-effort)
                    for fut in client_futures:
                        if not fut.done():
                            fut.cancel()

                # aggregate
                strategy = self.strategies.get(self.current_strategy, FedAvgStrategy())
                aggregated = strategy.aggregate(client_updates)

                round_metrics = {
                    "round": r,
                    "participating_clients": len(selected_clients),
                    "timestamp": now_iso(),
                }

                if aggregated and aggregated.get("parameters"):
                    # apply aggregated params to global model
                    try:
                        # aggregated parameters may be tensors on CPU
                        self.global_model.load_state_dict(aggregated["parameters"])
                        self.global_accuracy = float(aggregated.get("accuracy", self.global_accuracy))
                        round_metrics.update({"accuracy": self.global_accuracy})
                        self.training_history.append(round_metrics)
                        if PROM_AVAILABLE:
                            PROM_FL_ROUNDS.inc()
                        logger.info("round_aggregated", round=r, accuracy=self.global_accuracy, clients=len(selected_clients))
                    except Exception as e:
                        logger.exception("apply_aggregated_params_failed", round=r, error=str(e))
                        self.last_exception = str(e)
                else:
                    logger.warning("no_aggregated_update", round=r)

                # send progress via ws and progress callbacks
                await self._emit_event({"event": "round_completed", "round": r, "metrics": round_metrics, "timestamp": now_iso()})
                safe_call(self._progress_cb, {"round": r, "metrics": round_metrics})

                # small backoff to avoid starving event loop; also simulate training time
                await asyncio.sleep(1)

            # finished / stopped
            self.is_training = False
            await self._emit_event({"event": "training_completed", "completed_rounds": self.current_round, "timestamp": now_iso()})
            logger.info("training_loop_finished", completed_rounds=self.current_round, final_accuracy=self.global_accuracy)
            if PROM_AVAILABLE:
                PROM_FL_RUNNING.set(0)
        except Exception as e:
            self.is_training = False
            self.last_exception = str(e)
            logger.exception("training_loop_failed", error=str(e))
            await self._emit_event({"event": "training_failed", "error": str(e), "timestamp": now_iso()})

    # -----------------------
    # Helpers & utilities
    # -----------------------
    def _select_clients(self, sample_size: int = 3) -> List[FederatedClient]:
        """Random client sampling (no replacement). Replace with stratified/weighted sampling if needed."""
        if not self.clients:
            return []
        n = min(sample_size, len(self.clients))
        return list(np.random.choice(self.clients, size=n, replace=False))

    async def _emit_event(self, payload: Dict[str, Any]):
        """Emit event to ws_manager and/or callback. Uses ws_manager if available else _ws_callback."""
        payload_copy = copy.deepcopy(payload)
        # send to ws_manager if available
        try:
            if ws_manager is not None:
                # ws_manager.broadcast may be async; if so schedule it
                if asyncio.iscoroutinefunction(ws_manager.broadcast):
                    await ws_manager.broadcast(payload_copy)
                else:
                    safe_call(ws_manager.broadcast, payload_copy)
            elif self._ws_callback:
                # fallback to provided callback
                if asyncio.iscoroutinefunction(self._ws_callback):
                    await self._ws_callback(payload_copy)
                else:
                    safe_call(self._ws_callback, payload_copy)
        except Exception as e:
            logger.exception("emit_event_failed", error=str(e))
            # ensure errors do not stop training

    def set_strategy(self, strategy_name: str):
        """Set strategy by name."""
        if strategy_name not in self.strategies:
            raise ValueError(f"Unknown strategy: {strategy_name}")
        self.current_strategy = strategy_name
        logger.info("strategy_set", strategy=strategy_name)
        # notify via websocket
        asyncio.create_task(self._emit_event({"event": "strategy_changed", "strategy": strategy_name, "timestamp": now_iso()}))

    def list_strategies(self) -> List[Dict[str, Any]]:
        """Return available strategies with metadata (same shape used by API)."""
        return [
            {
                "name": name,
                "description": getattr(s, "name", name),
                "suitable_for": ["IID data", "non-IID data"] if name == "FedProx" else ["IID data"],
                "performance": {"convergence": 0.85, "communication": 0.9} if name == "FedAvg" else {"convergence": 0.88, "communication": 0.85}
            }
            for name, s in self.strategies.items()
        ]

    async def get_current_metrics(self) -> Dict[str, Any]:
        """Return API-friendly metrics (keeps consistency with your StatusResponse)."""
        return {
            "current_round": self.current_round,
            "total_rounds": len(self.training_history),
            "metrics": {
                "accuracy": self.global_accuracy,
                "loss": (1.0 - self.global_accuracy) if self.global_accuracy is not None else None,
                "active_clients": len(self.clients),
            },
            "training_history": self.training_history[-10:],
            "is_training": self.is_training,
            "strategy": self.current_strategy,
            "last_exception": self.last_exception,
        }

    # -----------------------
    # Persistence & export
    # -----------------------
    def save_checkpoint(self, name: Optional[str] = None):
        """Save model + metadata to checkpoint directory."""
        try:
            stamp = int(time.time()) if name is None else name
            path = os.path.join(self.checkpoint_dir, f"global_model_{stamp}.pt")
            torch.save(self.global_model.state_dict(), path)
            # export metadata
            meta = {
                "timestamp": now_iso(),
                "round": self.current_round,
                "accuracy": self.global_accuracy,
                "strategy": self.current_strategy,
                "history_len": len(self.training_history)
            }
            meta_path = os.path.join(self.checkpoint_dir, f"meta_{stamp}.json")
            with open(meta_path, "w") as f:
                json.dump(meta, f, indent=2)
            logger.info("checkpoint_saved", path=path, meta=meta)
            return path
        except Exception as e:
            logger.exception("save_checkpoint_failed", error=str(e))
            return None

    def load_checkpoint(self, path: str):
        """Load model from checkpoint path (state_dict)."""
        try:
            state = torch.load(path, map_location="cpu")
            self.global_model.load_state_dict(state)
            logger.info("checkpoint_loaded", path=path)
            return True
        except Exception as e:
            logger.exception("load_checkpoint_failed", error=str(e))
            return False

    def export_history_csv(self, filename: Optional[str] = None) -> str:
        """Export training_history to CSV and return filepath."""
        try:
            filename = filename or f"training_history_{int(time.time())}.csv"
            path = os.path.join(self.checkpoint_dir, filename)
            with open(path, "w", newline="") as csvfile:
                if not self.training_history:
                    csvfile.write("no_history\n")
                    return path
                fieldnames = sorted({k for d in self.training_history for k in d.keys()})
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                for row in self.training_history:
                    writer.writerow(row)
            logger.info("history_exported", path=path)
            return path
        except Exception as e:
            logger.exception("export_history_failed", error=str(e))
            raise

    # -----------------------
    # Evaluation helpers
    # -----------------------
    def evaluate_on_client(self, client: FederatedClient) -> Dict[str, Any]:
        """Synchronous evaluation on a client (fast accuracy check)."""
        try:
            self.global_model.eval()
            # move model to client's device
            model_copy = copy.deepcopy(self.global_model)
            model_copy.to(client.device)
            data, labels = torch.from_numpy(client._data_np).to(client.device), torch.from_numpy(client._labels_np).to(client.device)
            with torch.no_grad():
                outputs = model_copy(data)
                _, predicted = torch.max(outputs, 1)
                correct = int((predicted == labels).sum().item())
                total = labels.size(0)
            return {"client_id": client.client_id, "correct": correct, "total": total, "accuracy": correct / total if total > 0 else 0.0}
        except Exception as e:
            logger.exception("evaluate_on_client_failed", client=client.client_id, error=str(e))
            return {"client_id": client.client_id, "error": str(e)}

    async def evaluate_aggregate(self) -> Dict[str, Any]:
        """Evaluate global model on all clients (async wrapper)."""
        results = []
        for c in self.clients:
            res = await asyncio.to_thread(self.evaluate_on_client, c)
            results.append(res)
        # compute average accuracy where available
        accuracies = [r["accuracy"] for r in results if "accuracy" in r and isinstance(r["accuracy"], (int, float))]
        avg_acc = float(np.mean(accuracies)) if accuracies else 0.0
        return {"average_accuracy": avg_acc, "per_client": results}

    # -----------------------
    # Internal callback shims
    # -----------------------
    @property
    def _ws_cb(self):
        return self._ws_callback

    @property
    def _progress_cb(self):
        return self._progress_callback

    # -----------------------
    # Debug / diagnostics
    # -----------------------
    def debug_state(self) -> Dict[str, Any]:
        return {
            "current_round": self.current_round,
            "is_training": self.is_training,
            "is_ready": self.is_ready,
            "num_clients": len(self.clients),
            "strategy": self.current_strategy,
            "last_exception": self.last_exception,
            "device": str(self.device),
        }
