"""Simple Resource Registry for async clients (httpx, aiohttp, websockets).

Components can register resources (with an async close coroutine) and the
application will call them during shutdown to ensure clean cleanup.
"""
import asyncio
from typing import Callable, Dict, Any, List
import logging

logger = logging.getLogger(__name__)

# Each entry is a dict with keys: name, close_coro (callable returning coroutine), meta
_REGISTRY: List[Dict[str, Any]] = []


def register_resource(name: str, close_coro: Callable[[], Any], meta: Dict[str, Any] = None):
    """Register a resource with a callable that returns an awaitable to close it.

    Example:
        register_resource('sdk_httpx', lambda: client.aclose(), {'type': 'httpx'})
    """
    _REGISTRY.append({'name': name, 'close_coro': close_coro, 'meta': meta or {}})
    logger.debug("Registered resource for shutdown: %s", name)


async def shutdown_all_resources(timeout: float = 5.0):
    """Attempt to close all registered resources concurrently.

    Each close_coro is awaited. Failures are logged but do not stop other closes.
    """
    if not _REGISTRY:
        logger.debug("No resources registered for shutdown")
        return

    tasks = []
    for entry in _REGISTRY:
        try:
            coro = entry['close_coro']()
            tasks.append(asyncio.create_task(_safe_close(entry['name'], coro)))
        except Exception as e:
            logger.exception("Failed to create close task for %s: %s", entry['name'], e)

    if not tasks:
        return

    # Wait for all tasks to finish with a timeout
    done, pending = await asyncio.wait(tasks, timeout=timeout)
    for t in pending:
        t.cancel()
    logger.info("Resource registry shutdown complete: %d closed, %d cancelled", len(done), len(pending))


async def _safe_close(name: str, coro):
    try:
        await coro
        logger.info("Closed resource: %s", name)
    except Exception as e:
        logger.exception("Error closing resource %s: %s", name, e)
