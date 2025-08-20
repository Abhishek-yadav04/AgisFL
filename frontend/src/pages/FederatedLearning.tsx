// frontend/src/pages/FederatedLearning.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Brain,
  Users,
  TrendingUp,
  Play,
  Pause,
  Settings,
  BarChart3,
  Shield,
  Zap,
  Target,
  Activity,
  Download,
  ArrowUpRight,
  FileText,
} from "lucide-react";

import { MetricCard } from "../components/Cards/MetricCard";
import MetricsChart from "../components/Charts/MetricsChart";
import { DataTable } from "../components/Tables/DataTable";
import { useRealTimeData } from "../hooks/useRealTimeData";
import { useWebSocket } from "../hooks/useWebSocket";
import {
  federatedLearningAPI,
  flIdsAPI,
  researchAPI,
} from "../services/api";
import { useAppStore } from "../stores/appStore";

// -------------------------
// Types
// -------------------------
type Strategy = {
  name: string;
  description?: string;
  suitable_for?: string[];
  performance?: Record<string, number>;
  implementation_status?: "production" | "testing" | "experimental" | string;
};

type FLStatus = {
  current_round?: number;
  total_rounds?: number;
  global_accuracy?: number;
  active_clients?: number;
  convergence_rate?: number;
  strategy?: string;
  training_history?: Array<any>;
};

type Experiment = {
  id?: string;
  name: string;
  status: string;
  accuracy?: number;
  duration?: string;
  created_at?: string;
};

// -------------------------
// Helpers
// -------------------------
const formatPct = (v?: number) =>
  v === undefined || v === null ? "-" : `${(v * 100).toFixed(1)}%`;

const safeNumber = (v?: number, fallback = 0) =>
  typeof v === "number" ? v : fallback;

const exportToCSV = (rows: any[], filename = "experiments.csv") => {
  if (!rows?.length) {
    toast("No rows to export");
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const val = r[h];
          if (val === undefined || val === null) return '""';
          const s = String(val).replace(/"/g, '""');
          return `"${s}"`;
        })
        .join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Exported CSV");
};

// -------------------------
// Component
// -------------------------
const FederatedLearning: React.FC = () => {
  const queryClient = useQueryClient();
  const { autoRefresh, refreshInterval } = useAppStore();

  const [selectedStrategy, setSelectedStrategy] = useState<string>("FedAvg");
  const [isTrainingLocal, setIsTrainingLocal] = useState<boolean>(false);
  const [actionPending, setActionPending] = useState<string | null>(null);

  // WebSocket for quick connectivity state (optional)
  const { status: wsStatus } = useWebSocket("/api/fl/ws/training", {
    reconnect: true,
    reconnectAttempts: 8,
    debug: import.meta.env.DEV === true,
  });

  // Get FL status (server)
  const {
    data: flStatusResp,
    isLoading: flStatusLoading,
    refetch: refetchFLStatus,
  } = useQuery(
    ["fl-status"],
    () => federatedLearningAPI.getStatus(),
    {
      refetchInterval: autoRefresh ? refreshInterval : false,
      retry: 2,
      onSuccess: (res) => {
        const strategyFromServer =
          res?.data?.federated_learning?.strategy ??
          res?.data?.strategy ??
          selectedStrategy;
        setSelectedStrategy(strategyFromServer);
        // reflect training state locally
        setIsTrainingLocal(Boolean(res?.data?.is_training));
      },
      onError: (err: any) => {
        toast.error("Failed to fetch FL status");
      },
    }
  );

  const flStatus: FLStatus = useMemo(
    () => flStatusResp?.data?.federated_learning ?? flStatusResp?.data ?? {},
    [flStatusResp]
  );

  // Strategies from API
  const { data: strategiesResp, isLoading: strategiesLoading } = useQuery(
    ["fl-strategies"],
    () => federatedLearningAPI.getStrategies(),
    { retry: 1 }
  );
  const strategies: Strategy[] =
    strategiesResp?.data?.strategies ?? [
      { name: "FedAvg", description: "Federated Averaging" },
      { name: "FedProx", description: "Federated Proximal" },
    ];

  // algorithms / research listing
  const { data: algorithmsResp } = useQuery(
    ["research-algorithms"],
    () => researchAPI.getEnterpriseAlgorithms(),
    { retry: 1 }
  );
  const algorithms = algorithmsResp?.data?.algorithms ?? [];

  // experiments
  const { data: experimentsResp, refetch: refetchExperiments } = useQuery(
    ["fl-experiments"],
    () => federatedLearningAPI.getExperiments(),
    { refetchInterval: 10000, retry: 1 }
  );
  const experiments: Experiment[] = experimentsResp?.data?.experiments ?? [];

  // Real-time FL-IDS metrics (poll + ws fallback via hook)
  const {
    data: flIdsData,
    loading: flIdsLoading,
    isConnected: flIdsConnected,
  } = useRealTimeData(() => flIdsAPI.getRealTimeMetrics(), {
    interval: 2000,
    enabled: true,
  });

  // -------------------------
  // Mutations: start/pause/resume/stop/set strategy
  // -------------------------
  const startMutation = useMutation({
    mutationFn: (rounds: number) => federatedLearningAPI.startTraining({ rounds }),
    onMutate: () => {
      setActionPending("start");
      setIsTrainingLocal(true);
    },
    onSuccess: () => {
      toast.success("Training started");
      setActionPending(null);
      queryClient.invalidateQueries({ queryKey: ["fl-status"] });
      queryClient.invalidateQueries({ queryKey: ["fl-experiments"] });
    },
    onError: (err: any) => {
      setActionPending(null);
      setIsTrainingLocal(false);
      toast.error(`Failed to start training: ${err?.message ?? "unknown"}`);
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => federatedLearningAPI.stopTraining(),
    onMutate: () => {
      setActionPending("stop");
    },
    onSuccess: () => {
      toast.success("Stop requested");
      setActionPending(null);
      setIsTrainingLocal(false);
      queryClient.invalidateQueries({ queryKey: ["fl-status"] });
    },
    onError: (err: any) => {
      setActionPending(null);
      toast.error(`Stop failed: ${err?.message ?? "unknown"}`);
    },
  });

  const pauseMutation = useMutation({
    mutationFn: () => federatedLearningAPI.pauseTraining(),
    onMutate: () => setActionPending("pause"),
    onSuccess: () => {
      toast.success("Training paused");
      setActionPending(null);
      setIsTrainingLocal(false);
      queryClient.invalidateQueries({ queryKey: ["fl-status"] });
    },
    onError: (err: any) => {
      setActionPending(null);
      toast.error(`Pause failed: ${err?.message ?? "unknown"}`);
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => federatedLearningAPI.resumeTraining(),
    onMutate: () => setActionPending("resume"),
    onSuccess: () => {
      toast.success("Training resumed");
      setActionPending(null);
      setIsTrainingLocal(true);
      queryClient.invalidateQueries({ queryKey: ["fl-status"] });
    },
    onError: (err: any) => {
      setActionPending(null);
      toast.error(`Resume failed: ${err?.message ?? "unknown"}`);
    },
  });

  const setStrategyMutation = useMutation({
    mutationFn: (strategyName: string) =>
      federatedLearningAPI.setStrategy(strategyName),
    onMutate: (strategyName) => {
      setActionPending("set_strategy");
      setSelectedStrategy(strategyName);
    },
    onSuccess: () => {
      toast.success("Strategy updated");
      setActionPending(null);
      queryClient.invalidateQueries({ queryKey: ["fl-status"] });
    },
    onError: (err: any) => {
      setActionPending(null);
      toast.error(`Failed to set strategy: ${err?.message ?? "unknown"}`);
      // revert fetch
      queryClient.invalidateQueries({ queryKey: ["fl-strategies"] });
      refetchFLStatus();
    },
  });

  // -------------------------
  // Actions
  // -------------------------
  const startTraining = useCallback(async () => {
    const rounds = Number(
      window.prompt("Enter number of rounds (1-10000):", "50") ?? "50"
    );
    if (!Number.isFinite(rounds) || rounds < 1 || rounds > 10000) {
      toast.error("Invalid rounds value");
      return;
    }
    if (!window.confirm(`Start training for ${rounds} rounds?`)) return;
    startMutation.mutate(rounds);
  }, [startMutation]);

  const stopTraining = useCallback(async () => {
    if (!window.confirm("Stop training immediately?")) return;
    stopMutation.mutate();
  }, [stopMutation]);

  const pauseTraining = useCallback(async () => {
    if (!window.confirm("Pause training?")) return;
    pauseMutation.mutate();
  }, [pauseMutation]);

  const resumeTraining = useCallback(async () => {
    resumeMutation.mutate();
  }, [resumeMutation]);

  const changeStrategy = useCallback(
    async (strategyName: string) => {
      if (strategyName === selectedStrategy) return;
      if (!window.confirm(`Change FL strategy to ${strategyName}?`)) {
        // revert selection
        refetchFLStatus();
        return;
      }
      setStrategyMutation.mutate(strategyName);
    },
    [selectedStrategy, setStrategyMutation, refetchFLStatus]
  );

  // CSV export for experiments
  const exportExperiments = useCallback(() => {
    exportToCSV(experiments || [], `fl_experiments_${Date.now()}.csv`);
  }, [experiments]);

  // -------------------------
  // Charts data
  // -------------------------
  const accuracyChart = useMemo(() => {
    const history = flStatus?.training_history ?? [];
    if (Array.isArray(history) && history.length > 0) {
      return {
        labels: history.map((r) => `R${r.round ?? "-"}`),
        datasets: [
          {
            label: "Global Accuracy",
            data: history.map((r) => safeNumber(r.accuracy, 0)),
            tension: 0.3,
          },
          {
            label: "Convergence",
            data: history.map((r) => safeNumber(r.convergence ?? r.accuracy ?? 0)),
            tension: 0.3,
          },
        ],
      };
    }
    // fallback synthetic preview
    return {
      labels: Array.from({ length: 12 }, (_, i) => `R${i + 1}`),
      datasets: [
        {
          label: "Global Accuracy",
          data: Array.from({ length: 12 }, (_, i) => Math.min(0.98, 0.7 + i * 0.01)),
          tension: 0.3,
        },
      ],
    };
  }, [flStatus]);

  const clientDist = useMemo(() => {
    const clients = flStatus?.active_clients ?? 6;
    return {
      labels: ["Participating", "Idle", "Offline"],
      datasets: [
        {
          data: [clients, Math.max(0, 12 - clients), Math.max(0, 40 - clients)],
        },
      ],
    };
  }, [flStatus]);

  // -------------------------
  // Columns for experiments table
  // -------------------------
  const experimentsColumns = useMemo(
    () => [
      { key: "name", label: "Experiment", sortable: true },
      {
        key: "status",
        label: "Status",
        sortable: true,
        render: (value: string) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              value === "running"
                ? "bg-blue-100 text-blue-800"
                : value === "completed"
                ? "bg-green-100 text-green-800"
                : value === "failed"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {value?.toUpperCase?.() ?? String(value)}
          </span>
        ),
      },
      {
        key: "accuracy",
        label: "Accuracy",
        sortable: true,
        render: (v: number) =>
          typeof v === "number" ? `${(v * 100).toFixed(2)}%` : "-",
      },
      { key: "duration", label: "Duration", sortable: true },
      {
        key: "created_at",
        label: "Created",
        sortable: true,
        render: (v: string) =>
          v ? new Date(v).toLocaleString() : "-",
      },
      {
        key: "actions",
        label: "Actions",
        sortable: false,
        render: (_: any, row: Experiment) => (
          <div className="flex items-center gap-2">
            <button
              className="text-sm px-2 py-1 rounded text-blue-600 hover:underline"
              onClick={() => federatedLearningAPI.getExperiment(row.id).then((r) => {
                // show details in toast or modal - simplest: toast
                toast.success(`Experiment: ${row.name} - status ${row.status}`);
              })}
            >
              Details
            </button>
            <button
              className="text-sm px-2 py-1 rounded text-red-600 hover:underline"
              onClick={() => {
                if (!window.confirm(`Delete experiment ${row.name}?`)) return;
                federatedLearningAPI.deleteExperiment(row.id).then(() => {
                  toast.success("Deleted");
                  refetchExperiments();
                }).catch((e) => toast.error("Delete failed"));
              }}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [refetchExperiments]
  );

  // -------------------------
  // Effects
  // -------------------------
  useEffect(() => {
    // keep local ui in sync when server status changes
    if (flStatus?.is_training !== undefined) {
      setIsTrainingLocal(Boolean(flStatus.is_training));
    }
  }, [flStatus?.is_training]);

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600">
            Federated Learning Control
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage strategies, monitor progress and run experiments across your fleet
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
            <span className={`w-2 h-2 rounded-full ${flIdsConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm font-medium text-gray-700">
              {flIdsConnected ? "Live" : "Offline"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Select FL strategy"
              value={selectedStrategy}
              onChange={(e) => changeStrategy(e.target.value)}
              className="px-3 py-2 rounded-lg border bg-white dark:bg-gray-800"
              disabled={!!actionPending}
            >
              {strategies.map((s) => (
                <option value={s.name} key={s.name}>
                  {s.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => (isTrainingLocal ? pauseTraining() : startTraining())}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                isTrainingLocal ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
              }`}
              aria-pressed={isTrainingLocal}
            >
              {isTrainingLocal ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isTrainingLocal ? "Pause" : "Start"}</span>
            </button>

            <button
              onClick={stopTraining}
              className="px-3 py-2 rounded-lg bg-gray-100"
              disabled={actionPending === "stop"}
            >
              <StopIcon />
              Stop
            </button>

            <button
              onClick={resumeTraining}
              className="px-3 py-2 rounded-lg bg-gray-100"
            >
              <Play className="w-4 h-4 inline-block" /> Resume
            </button>

            <button
              title="Export experiments CSV"
              onClick={exportExperiments}
              className="px-3 py-2 rounded-lg bg-white border"
            >
              <Download className="w-4 h-4 inline-block mr-2" />
              Export
            </button>
          </div>
        </div>
      </motion.div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Current Round"
          value={String(flStatus?.current_round ?? 0)}
          subtitle={`${flStatus?.active_clients ?? 0} active clients`}
          icon={Brain}
          color="blue"
          realTime={Boolean(flIdsConnected)}
        />
        <MetricCard
          title="Global Accuracy"
          value={formatPct(flStatus?.global_accuracy)}
          subtitle={flStatus?.strategy ?? selectedStrategy}
          icon={TrendingUp}
          color="green"
          realTime={Boolean(flIdsConnected)}
        />
        <MetricCard
          title="Active Clients"
          value={String(flStatus?.active_clients ?? 0)}
          subtitle="Participating nodes"
          icon={Users}
          color="purple"
          realTime={Boolean(flIdsConnected)}
        />
        <MetricCard
          title="Convergence"
          value={formatPct(flStatus?.convergence_rate)}
          subtitle="Model stability"
          icon={Target}
          color="cyan"
        />
      </div>

      {/* Real-time Engine panel */}
      <motion.div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">FL-IDS Real-time Engine</h3>
              <p className="text-sm opacity-90">
                Real-time federated learning + intrusion detection telemetry
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-right">
              <div className="text-2xl font-bold">{safeNumber(flIdsData?.metrics?.packets_processed)}</div>
              <div className="text-xs opacity-90">Packets processed</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{Math.round(safeNumber(flIdsData?.metrics?.throughput_pps))}</div>
              <div className="text-xs opacity-90">Throughput (pps)</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{(safeNumber(flIdsData?.metrics?.latency_ms)).toFixed(1)}ms</div>
              <div className="text-xs opacity-90">Latency</div>
            </div>
          </div>
        </div>

        {/* Recent threats preview */}
        <div className="bg-white/10 rounded-xl p-4">
          <h4 className="font-semibold mb-2">Recent Threats</h4>
          <div className="space-y-2 text-sm">
            {(flIdsData?.recent_threats ?? []).slice(0, 4).map((t: any, i: number) => (
              <div key={i} className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium">{t?.type ?? t?.attack_type ?? "Unknown"}</div>
                  <div className="text-xs opacity-90">{t?.source_ip ?? t?.source ?? "-"}</div>
                </div>
                <div className="text-xs opacity-80">{t?.severity ?? "N/A"}</div>
              </div>
            ))}
            {!(flIdsData?.recent_threats?.length) && <div className="text-xs opacity-80">No recent threats</div>}
          </div>
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricsChart type="line" data={accuracyChart} title="Training Progress" height={360} realTime={Boolean(flIdsConnected)} />
        <MetricsChart type="doughnut" data={clientDist} title="Client Distribution" height={360} />
      </div>

      {/* Algorithms */}
      {algorithms?.length > 0 && (
        <motion.div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Available FL Algorithms</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {algorithms.map((alg: any, idx: number) => (
              <motion.div key={alg.name || idx} className="p-4 rounded-xl border hover:shadow-md cursor-pointer" onClick={() => setSelectedStrategy(alg.name)}>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="text-sm font-semibold">{alg.name}</div>
                    <div className="text-xs text-gray-500">{alg.implementation_status}</div>
                  </div>
                  <div className="text-xs text-gray-400">{alg.performance_metrics ? `${Math.round((alg.performance_metrics.convergence_rate||0)*100)}%` : ""}</div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{alg.description}</p>
                <div className="flex gap-2 text-xs">
                  <div className="flex-1">Convergence: {(alg.performance_metrics?.convergence_rate ?? 0).toFixed(2)}</div>
                  <div className="flex-1">Efficiency: {(alg.performance_metrics?.communication_efficiency ?? 0).toFixed(2)}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Experiments table */}
      <DataTable
        title="FL Experiments"
        subtitle="Recent experiments & results"
        data={experiments}
        columns={experimentsColumns}
        searchable
        exportable
        refreshable
        onRefresh={() => {
          refetchExperiments();
          refetchFLStatus();
        }}
        pageSize={8}
      />

      {/* Advanced features */}
      <motion.div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Advanced Features</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 rounded-xl border hover:bg-gray-50">
            <Brain className="w-6 h-6 mb-2" />
            <div className="text-sm">Differential Privacy</div>
          </button>
          <button className="flex flex-col items-center p-4 rounded-xl border hover:bg-gray-50">
            <Shield className="w-6 h-6 mb-2" />
            <div className="text-sm">Secure Aggregation</div>
          </button>
          <button className="flex flex-col items-center p-4 rounded-xl border hover:bg-gray-50">
            <Users className="w-6 h-6 mb-2" />
            <div className="text-sm">Client Management</div>
          </button>
          <button className="flex flex-col items-center p-4 rounded-xl border hover:bg-gray-50">
            <BarChart3 className="w-6 h-6 mb-2" />
            <div className="text-sm">Performance Analytics</div>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// small inline icon since lucide Stop circle wasn't imported earlier
const StopIcon = () => (
  <svg className="w-4 h-4 inline-block mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <rect x="5" y="5" width="14" height="14" rx="2" />
  </svg>
);

export default FederatedLearning;
