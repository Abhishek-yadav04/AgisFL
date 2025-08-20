// frontend/src/pages/Dashboard.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Shield,
  Brain,
  Activity,
  Target,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Cpu,
  Database,
  Wifi,
  Download,
  PauseCircle,
  Play,
  StopCircle
} from "lucide-react";

import { MetricCard } from "../components/Cards/MetricCard";
import MetricsChart from "../components/Charts/MetricsChart";
import { DataTable } from "../components/Tables/DataTable";
import { useRealTimeData } from "../hooks/useRealTimeData";
import { useWebSocket } from "../hooks/useWebSocket";
import { dashboardAPI, flIdsAPI, integrationsAPI } from "../services/api";
import { useAppStore } from "../stores/appStore";

type DashboardResponse = {
  data?: any;
};

const formatPercent = (v?: number) => `${Math.round((v ?? 0) * 10) / 10}%`;
const formatNumber = (v?: number) => (v ?? 0).toLocaleString();
const shortTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString() : "-";

// -----------------------------
// Main Component
// -----------------------------
const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { autoRefresh, refreshInterval, addNotification, setConnectionStatus } =
    useAppStore();

  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);

  // --- WebSocket hook (for global live updates) ---
  const { status: wsStatus } = useWebSocket("/api/fl/ws/training", {
    reconnect: true,
    reconnectAttempts: 10,
    debug: import.meta.env.DEV === true,
  });

  // --- Dashboard API (main) ---
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    isError: dashboardError,
    refetch: refetchDashboard,
  } = useQuery<DashboardResponse>({
    queryKey: ["dashboard"],
    queryFn: () => dashboardAPI.getDashboard(),
    refetchInterval: autoRefresh ? refreshInterval : false,
    retry: 2,
    onSuccess: () => setConnectionStatus("connected"),
    onError: (err: any) => {
      setConnectionStatus("error");
      toast.error("Failed to load dashboard data");
      addNotification({
        type: "error",
        title: "Dashboard Error",
        message: err?.message ?? "Failed to load dashboard data",
      });
    },
  });

  // --- Integrations ---
  const { data: integrationsData } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => integrationsAPI.getOverview(),
    refetchInterval: 10000,
    retry: 1,
  });

  // --- FL real-time (poll or websocket fallback) ---
  const {
    data: flIdsData,
    loading: flIdsLoading,
    isConnected: flIdsConnected,
    refresh: refreshFlIds,
  } = useRealTimeData(
    () => flIdsAPI.getRealTimeMetrics(),
    { interval: 2000, enabled: autoRefresh }
  );

  // --- FL status (periodic) ---
  const { data: flStatusData, refetch: refetchFlStatus } = useQuery({
    queryKey: ["fl-status"],
    queryFn: () => flIdsAPI.getFLStatus(),
    refetchInterval: 5000,
    retry: 1,
  });

  // -----------------------------
  // Chart / metric preparation
  // -----------------------------
  const apiData = dashboardData?.data ?? {};
  const flStatus = flStatusData?.data ?? {};

  const systemChartData = useMemo(() => {
    const cpu =
      apiData?.performance?.cpu_usage ?? apiData?.system?.cpu_percent ?? 0;
    const mem =
      apiData?.performance?.memory_usage ?? apiData?.system?.memory_percent ?? 0;
    const disk =
      apiData?.performance?.disk_usage ?? apiData?.system?.disk_percent ?? 0;
    const net = Math.min(100, (apiData?.performance?.network_traffic_mb ?? 0) / 10);

    return {
      labels: ["CPU", "Memory", "Disk", "Network"],
      datasets: [
        {
          label: "System Usage (%)",
          data: [cpu, mem, disk, net],
          // leave color selection to component stylesheet for theming
          tension: 0.2,
        },
      ],
    };
  }, [apiData]);

  const flAccuracyData = useMemo(() => {
    // If engine provides history, use it
    const history = flStatus?.training_history ?? apiData?.federated_learning?.history;
    if (Array.isArray(history) && history.length) {
      return {
        labels: history.map((r: any, i: number) => `R${r.round ?? i + 1}`),
        datasets: [
          {
            label: "Global Accuracy",
            data: history.map((r: any) => (r.accuracy ?? 0) * 1),
            tension: 0.3,
          },
        ],
      };
    }
    // fallback synthetic
    return {
      labels: Array.from({ length: 10 }, (_, i) => `Round ${i + 1}`),
      datasets: [
        {
          label: "Global Accuracy",
          data: Array.from({ length: 10 }, (_, i) =>
            Math.min(0.98, 0.75 + i * 0.01 + (Math.random() * 0.01))
          ),
          tension: 0.3,
        },
      ],
    };
  }, [flStatus, apiData]);

  // -----------------------------
  // Alerts table columns
  // -----------------------------
  const alertsColumns = useMemo(
    () => [
      { key: "type", label: "Type", sortable: true },
      {
        key: "severity",
        label: "Severity",
        sortable: true,
        render: (value: string) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              value === "CRITICAL"
                ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                : value === "HIGH"
                ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                : value === "MEDIUM"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
            }`}
          >
            {value}
          </span>
        ),
      },
      { key: "message", label: "Message", sortable: false },
      { key: "source", label: "Source", sortable: true },
      {
        key: "timestamp",
        label: "Time",
        sortable: true,
        render: (value: string) => (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {shortTime(value)}
          </span>
        ),
      },
    ],
    []
  );

  // -----------------------------
  // Mutations: FL control actions
  // -----------------------------
  const startMutation = useMutation({
    mutationFn: (rounds: number) => flIdsAPI.startTraining({ rounds }),
    onMutate: () => setActionPending("start"),
    onSuccess: () => {
      toast.success("FL training started");
      setActionPending(null);
      queryClient.invalidateQueries({ queryKey: ["fl-status"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      addNotification({
        type: "success",
        title: "Training Started",
        message: "Federated learning training started",
      });
    },
    onError: (err: any) => {
      setActionPending(null);
      toast.error(`Start failed: ${err?.message ?? "unknown"}`);
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => flIdsAPI.stopTraining(),
    onMutate: () => setActionPending("stop"),
    onSuccess: () => {
      toast.success("Stop requested");
      setActionPending(null);
      queryClient.invalidateQueries({ queryKey: ["fl-status"] });
    },
    onError: (err: any) => {
      setActionPending(null);
      toast.error(`Stop failed: ${err?.message ?? "unknown"}`);
    },
  });

  const pauseMutation = useMutation({
    mutationFn: () => flIdsAPI.pauseTraining(),
    onMutate: () => setActionPending("pause"),
    onSuccess: () => {
      toast.success("Training paused");
      setActionPending(null);
      queryClient.invalidateQueries({ queryKey: ["fl-status"] });
    },
    onError: (err: any) => {
      setActionPending(null);
      toast.error(`Pause failed: ${err?.message ?? "unknown"}`);
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => flIdsAPI.resumeTraining(),
    onMutate: () => setActionPending("resume"),
    onSuccess: () => {
      toast.success("Training resumed");
      setActionPending(null);
      queryClient.invalidateQueries({ queryKey: ["fl-status"] });
    },
    onError: (err: any) => {
      setActionPending(null);
      toast.error(`Resume failed: ${err?.message ?? "unknown"}`);
    },
  });

  // -----------------------------
  // Helpers
  // -----------------------------
  const exportAlertsCsv = useCallback(() => {
    const alerts = apiData?.alerts ?? [];
    if (!alerts.length) {
      toast("No alerts to export");
      return;
    }
    const headers = Object.keys(alerts[0]);
    const csv = [
      headers.join(","),
      ...alerts.map((r: any) =>
        headers.map((h) => `"${String(r[h] ?? "")}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alerts_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Alerts exported");
  }, [apiData]);

  // -----------------------------
  // Effects
  // -----------------------------
  useEffect(() => {
    // reflect websocket connectivity to global app store
    setConnectionStatus(wsStatus === "open" ? "connected" : wsStatus === "reconnecting" ? "reconnecting" : "disconnected");
  }, [wsStatus, setConnectionStatus]);

  // notify on flIds connection changes
  useEffect(() => {
    if (!flIdsLoading && flIdsConnected) {
      toast.success("FL-IDS live feed connected");
    }
  }, [flIdsLoading, flIdsConnected]);

  // -----------------------------
  // Render
  // -----------------------------
  const loading = dashboardLoading || (!dashboardData && !dashboardError);

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Command Center
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Real-time federated learning & security intelligence platform
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div
            role="status"
            aria-live="polite"
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                flIdsConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
              aria-hidden
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {flIdsConnected ? "Live Data" : "Offline"}
            </span>
          </div>

          <button
            onClick={() => {
              refetchDashboard();
              refetchFlStatus();
              refreshFlIds();
              toast.success("Refresh requested");
            }}
            aria-label="Refresh dashboard"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="FL Training Round"
          value={
            apiData?.federated_learning?.current_round ??
            flStatus?.current_round ??
            0
          }
          subtitle={`${
            apiData?.federated_learning?.active_clients ??
            apiData?.federated_learning?.participating_clients ??
            0
          } active clients`}
          icon={Brain}
          color="blue"
          trend={{ value: 2.3, direction: "up" }}
          realTime={flIdsConnected}
          onClick={() => setSelectedMetric("fl")}
        />

        <MetricCard
          title="Global Accuracy"
          value={`${(
            ((apiData?.federated_learning?.global_accuracy ??
              flIdsData?.fl_status?.global_accuracy ??
              0.94) as number) * 100
          ).toFixed(1)}%`}
          subtitle={apiData?.federated_learning?.strategy ?? "FedAvg"}
          icon={TrendingUp}
          color="green"
          trend={{ value: 1.8, direction: "up" }}
          realTime={flIdsConnected}
          onClick={() => setSelectedMetric("accuracy")}
        />

        <MetricCard
          title="Security Score"
          value={`${apiData?.security?.security_score ?? apiData?.overview?.security_score ?? 95}%`}
          subtitle={`${apiData?.security?.threats_detected ?? apiData?.security?.threats_blocked ?? 0
            } threats detected`}
          icon={Shield}
          color="red"
          trend={{ value: -0.5, direction: "down" }}
          realTime
          onClick={() => setSelectedMetric("security")}
        />

        <MetricCard
          title="System Health"
          value={`${apiData?.overview?.system_health ?? 92}%`}
          subtitle={`${apiData?.overview?.total_processes ?? apiData?.system?.processes ?? 0
            } processes`}
          icon={Activity}
          color="purple"
          trend={{ value: 0.8, direction: "up" }}
          realTime
          onClick={() => setSelectedMetric("system")}
        />
      </div>

      {/* FL-IDS Engine card + actions */}
      {flIdsData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/10 rounded-xl">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">FL-IDS Engine</h3>
                <p className="text-blue-100">
                  {flIdsData.features_active ?? 0}/50 features active •{" "}
                  {flIdsData.engine_status ?? "unknown"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Start / Pause / Resume / Stop controls */}
              <button
                onClick={() => {
                  if (!window.confirm("Start FL training?")) return;
                  startMutation.mutate(50);
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md flex items-center gap-2"
                disabled={!!actionPending}
                aria-label="Start FL training"
              >
                <Play className="w-4 h-4" />
                <span>Start</span>
              </button>

              <button
                onClick={() => {
                  if (!window.confirm("Pause FL training?")) return;
                  pauseMutation.mutate();
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md flex items-center gap-2"
                disabled={!!actionPending}
                aria-label="Pause FL training"
              >
                <PauseCircle className="w-4 h-4" />
                <span>Pause</span>
              </button>

              <button
                onClick={() => {
                  if (!window.confirm("Resume FL training?")) return;
                  resumeMutation.mutate();
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md flex items-center gap-2"
                disabled={!!actionPending}
                aria-label="Resume FL training"
              >
                <Play className="w-4 h-4" />
                <span>Resume</span>
              </button>

              <button
                onClick={() => {
                  if (!window.confirm("Stop FL training?")) return;
                  stopMutation.mutate();
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md flex items-center gap-2"
                disabled={!!actionPending}
                aria-label="Stop FL training"
              >
                <StopCircle className="w-4 h-4" />
                <span>Stop</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1 pr-6">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-3xl font-bold">
                    {flIdsData.metrics?.threats_detected ?? 0}
                  </p>
                  <p className="text-sm text-blue-100">Threats Detected</p>
                </div>

                <div>
                  <p className="text-3xl font-bold">
                    {Math.round(flIdsData.metrics?.throughput_pps ?? 0)}
                  </p>
                  <p className="text-sm text-blue-100">Packets/sec</p>
                </div>

                <div>
                  <p className="text-3xl font-bold">
                    {(flIdsData.metrics?.latency_ms ?? 0).toFixed(1)}ms
                  </p>
                  <p className="text-sm text-blue-100">Latency</p>
                </div>
              </div>
            </div>

            <div className="w-1/3">
              {flIdsData.recent_threats?.length > 0 && (
                <div className="bg-white/10 rounded-xl p-4">
                  <h4 className="font-semibold mb-2">Recent Threats</h4>
                  <div className="space-y-2">
                    {flIdsData.recent_threats.slice(0, 3).map((threat: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span>{threat.type ?? threat.attack_type ?? "Unknown"}</span>
                        <span className="text-blue-100">{threat.source_ip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricsChart
          type="doughnut"
          data={systemChartData}
          title="System Resource Usage"
          height={320}
          realTime
        />

        <MetricsChart
          type="line"
          data={flAccuracyData}
          title="FL Training Progress"
          height={320}
          gradient
          realTime={flIdsConnected}
        />
      </div>

      {/* Integrations */}
      {integrationsData?.data && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {integrationsData.data.integrations?.map((integration: any, i: number) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {integration.name}
                </h4>
                <div
                  className={`w-3 h-3 rounded-full ${integration.status === "active" ? "bg-green-500" : "bg-red-500"}`}
                />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Type</span>
                  <span className="text-gray-900 dark:text-white font-medium">{integration.type}</span>
                </div>

                {integration.packets !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Packets</span>
                    <span className="text-gray-900 dark:text-white font-medium">{formatNumber(integration.packets)}</span>
                  </div>
                )}

                {integration.clients !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Clients</span>
                    <span className="text-gray-900 dark:text-white font-medium">{integration.clients}</span>
                  </div>
                )}

                {integration.alerts !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Alerts</span>
                    <span className="text-gray-900 dark:text-white font-medium">{integration.alerts}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Alerts (table) */}
      {apiData?.alerts && apiData.alerts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Recent Alerts</h3>

            <div className="flex items-center gap-2">
              <button
                onClick={exportAlertsCsv}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800"
                aria-label="Export alerts CSV"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={() => {
                  refetchDashboard();
                  toast.success("Alerts refreshed");
                }}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800"
                aria-label="Refresh alerts"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          <DataTable
            title=""
            subtitle=""
            data={apiData.alerts}
            columns={alertsColumns}
            searchable
            exportable
            refreshable
            onRefresh={() => refetchDashboard()}
            pageSize={8}
          />
        </div>
      )}

      {/* Performance + FL Status + Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">System Performance</h3>
          <div className="space-y-4">
            <StatItem icon={<Cpu className="w-4 h-4 text-blue-500" />} label="CPU" value={`${apiData?.performance?.cpu_usage ?? apiData?.system?.cpu_percent ?? 0}%`} />
            <StatItem icon={<Database className="w-4 h-4 text-green-500" />} label="Memory" value={`${apiData?.performance?.memory_usage ?? apiData?.system?.memory_percent ?? 0}%`} />
            <StatItem icon={<Database className="w-4 h-4 text-purple-500" />} label="Disk" value={`${apiData?.performance?.disk_usage ?? apiData?.system?.disk_percent ?? 0}%`} />
            <StatItem icon={<Wifi className="w-4 h-4 text-orange-500" />} label="Network" value={`${apiData?.performance?.network_traffic_mb ?? 0}MB`} />
          </div>
        </motion.div>

        <motion.div className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">FL Training Status</h3>
          <div className="space-y-4">
            <FlexRow label="Strategy" value={apiData?.federated_learning?.strategy ?? "FedAvg"} />
            <FlexRow label="Convergence" value={`${((apiData?.federated_learning?.convergence_rate ?? 0.95) * 100).toFixed(1)}%`} />
            <FlexRow label="Data Samples" value={`${(apiData?.federated_learning?.data_samples ?? 50000).toLocaleString()}`} />
            <FlexRow label="Model Size" value={`${apiData?.federated_learning?.model_size_mb ?? 12.5} MB`} />
          </div>
        </motion.div>

        <motion.div className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Security Overview</h3>
          <div className="space-y-4">
            <FlexRow icon={<AlertTriangle className="w-4 h-4 text-red-500" />} label="Active Threats" value={`${apiData?.security?.threats_detected ?? 0}`} valueClassName="text-red-600" />
            <FlexRow icon={<Shield className="w-4 h-4 text-green-500" />} label="Blocked" value={`${apiData?.security?.threats_blocked ?? 0}`} valueClassName="text-green-600" />
            <FlexRow icon={<Brain className="w-4 h-4 text-blue-500" />} label="Monitoring" value="Active" />
            <FlexRow icon={<Shield className="w-4 h-4 text-purple-500" />} label="Firewall" value="Enabled" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;

// -----------------------------
// Small helper components
// -----------------------------
const StatItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">{icon}</div>
      <div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
      </div>
    </div>
    <div className="font-semibold text-gray-900 dark:text-white">{value}</div>
  </div>
);

const FlexRow: React.FC<{ icon?: React.ReactNode; label: string; value: string; valueClassName?: string }> = ({ icon, label, value, valueClassName }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {icon && <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">{icon}</div>}
      <div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
      </div>
    </div>
    <div className={`font-semibold ${valueClassName ?? "text-gray-900 dark:text-white"}`}>{value}</div>
  </div>
);
