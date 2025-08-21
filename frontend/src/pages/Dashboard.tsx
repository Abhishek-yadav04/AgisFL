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
  StopCircle,
  Users,
  Zap
} from "lucide-react";

import { MetricCard } from "../components/Cards/MetricCard";
import MetricsChart from "../components/Charts/MetricsChart";
import { DataTable } from "../components/Tables/DataTable";
import { useRealTimeData } from "../hooks/useRealTimeData";
import { dashboardAPI, federatedLearningAPI, flIdsAPI } from "../services/api";
import { useAppStore } from "../stores/appStore";

const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { autoRefresh, refreshInterval, addNotification, setConnectionStatus } = useAppStore();

  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);

  // Dashboard data
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    isError: dashboardError,
    refetch: refetchDashboard,
  } = useQuery({
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

  // FL status
  const { data: flStatusData, refetch: refetchFlStatus } = useQuery({
    queryKey: ["fl-status"],
    queryFn: () => federatedLearningAPI.getStatus(),
    refetchInterval: 5000,
    retry: 1,
  });

  // Real-time FL-IDS data
  const {
    data: flIdsData,
    loading: flIdsLoading,
    isConnected: flIdsConnected,
    refresh: refreshFlIds,
  } = useRealTimeData(
    () => flIdsAPI.getRealTimeMetrics(),
    { 
      interval: 2000, 
      enabled: autoRefresh,
      onError: () => setConnectionStatus('error'),
      onSuccess: () => setConnectionStatus('connected')
    }
  );

  // Mutations for FL control
  const startMutation = useMutation({
    mutationFn: (rounds: number) => federatedLearningAPI.startTraining({ rounds }),
    onMutate: () => setActionPending("start"),
    onSuccess: () => {
      toast.success("FL training started");
      setActionPending(null);
      queryClient.invalidateQueries({ queryKey: ["fl-status"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      addNotification({
        type: "success",
        title: "Training Started",
        message: "Federated learning training has been initiated",
      });
    },
    onError: (err: any) => {
      setActionPending(null);
      toast.error(`Start failed: ${err?.message ?? "unknown"}`);
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => federatedLearningAPI.stopTraining(),
    onMutate: () => setActionPending("stop"),
    onSuccess: () => {
      toast.success("Training stopped");
      setActionPending(null);
      queryClient.invalidateQueries({ queryKey: ["fl-status"] });
    },
    onError: (err: any) => {
      setActionPending(null);
      toast.error(`Stop failed: ${err?.message ?? "unknown"}`);
    },
  });

  // Prepare chart data
  const apiData = dashboardData?.data ?? {};
  const flStatus = flStatusData?.data ?? {};

  const systemChartData = useMemo(() => {
    const cpu = apiData?.system?.cpu_percent ?? 45;
    const memory = apiData?.system?.memory_percent ?? 62;
    const disk = apiData?.system?.disk_percent ?? 35;
    const network = Math.min(100, (apiData?.system?.network_sent_mb ?? 0) / 10);

    return {
      labels: ["CPU", "Memory", "Disk", "Network"],
      datasets: [
        {
          label: "System Usage (%)",
          data: [cpu, memory, disk, network],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)'
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(16, 185, 129)',
            'rgb(139, 92, 246)',
            'rgb(245, 158, 11)'
          ],
          borderWidth: 2,
        },
      ],
    };
  }, [apiData]);

  const flAccuracyData = useMemo(() => {
    const history = flStatus?.training_history ?? [];
    if (Array.isArray(history) && history.length) {
      return {
        labels: history.map((r: any, i: number) => `Round ${r.round ?? i + 1}`),
        datasets: [
          {
            label: "Global Accuracy",
            data: history.map((r: any) => (r.accuracy ?? 0) * 100),
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.3,
            fill: true,
          },
        ],
      };
    }
    
    // Fallback synthetic data
    return {
      labels: Array.from({ length: 10 }, (_, i) => `Round ${i + 1}`),
      datasets: [
        {
          label: "Global Accuracy",
          data: Array.from({ length: 10 }, (_, i) =>
            Math.min(98, 75 + i * 2 + (Math.random() * 2))
          ),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [flStatus, apiData]);

  // Alerts table columns
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
            {value ? new Date(value).toLocaleTimeString() : '-'}
          </span>
        ),
      },
    ],
    []
  );

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

  // Effects
  useEffect(() => {
    setConnectionStatus(flIdsConnected ? "connected" : "disconnected");
  }, [flIdsConnected, setConnectionStatus]);

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
            Enterprise Command Center
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Real-time federated learning & security intelligence platform
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div
              className={`w-2 h-2 rounded-full ${
                flIdsConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
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
              toast.success("Dashboard refreshed");
            }}
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
          value={String(apiData?.federated_learning?.current_round ?? flStatus?.current_round ?? 0)}
          subtitle={`${apiData?.federated_learning?.active_clients ?? 0} active clients`}
          icon={Brain}
          color="blue"
          trend={{ value: 2.3, direction: "up" }}
          realTime={flIdsConnected}
          onClick={() => setSelectedMetric("fl")}
        />

        <MetricCard
          title="Global Accuracy"
          value={`${((apiData?.federated_learning?.global_accuracy ?? 0.94) * 100).toFixed(1)}%`}
          subtitle={apiData?.federated_learning?.strategy ?? "FedAvg"}
          icon={TrendingUp}
          color="green"
          trend={{ value: 1.8, direction: "up" }}
          realTime={flIdsConnected}
          onClick={() => setSelectedMetric("accuracy")}
        />

        <MetricCard
          title="Security Score"
          value={`${apiData?.security?.security_score ?? 95}%`}
          subtitle={`${apiData?.security?.threats_detected ?? 0} threats detected`}
          icon={Shield}
          color="red"
          trend={{ value: -0.5, direction: "down" }}
          realTime
          onClick={() => setSelectedMetric("security")}
        />

        <MetricCard
          title="System Health"
          value={`${apiData?.overview?.system_health ?? 92}%`}
          subtitle={`${apiData?.system?.processes ?? 0} processes`}
          icon={Activity}
          color="purple"
          trend={{ value: 0.8, direction: "up" }}
          realTime
          onClick={() => setSelectedMetric("system")}
        />
      </div>

      {/* FL-IDS Engine Status */}
      {(flIdsData || flStatus) && (
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
                  Enterprise Federated Learning & Intrusion Detection System
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  if (!window.confirm("Start FL training with 50 rounds?")) return;
                  startMutation.mutate(50);
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md flex items-center gap-2"
                disabled={!!actionPending}
              >
                <Play className="w-4 h-4" />
                <span>Start Training</span>
              </button>

              <button
                onClick={() => {
                  if (!window.confirm("Stop FL training?")) return;
                  stopMutation.mutate();
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md flex items-center gap-2"
                disabled={!!actionPending}
              >
                <StopCircle className="w-4 h-4" />
                <span>Stop</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {flIdsData?.metrics?.threats_detected ?? apiData?.security?.threats_detected ?? 0}
              </div>
              <div className="text-sm text-blue-100">Threats Detected</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold">
                {Math.round(flIdsData?.metrics?.throughput_pps ?? 1250)}
              </div>
              <div className="text-sm text-blue-100">Packets/sec</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold">
                {(flIdsData?.metrics?.latency_ms ?? 1.2).toFixed(1)}ms
              </div>
              <div className="text-sm text-blue-100">Response Time</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold">
                {apiData?.federated_learning?.active_clients ?? flStatus?.active_clients ?? 8}
              </div>
              <div className="text-sm text-blue-100">FL Clients</div>
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

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">System Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600 dark:text-gray-400">CPU Usage</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {apiData?.system?.cpu_percent ?? 45}%
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-green-500" />
                <span className="text-gray-600 dark:text-gray-400">Memory</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {apiData?.system?.memory_percent ?? 62}%
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-purple-500" />
                <span className="text-gray-600 dark:text-gray-400">Network</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {apiData?.system?.network_sent_mb ?? 125} MB
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">FL Training Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Strategy</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {apiData?.federated_learning?.strategy ?? "FedAvg"}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Convergence</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {((apiData?.federated_learning?.convergence_rate ?? 0.95) * 100).toFixed(1)}%
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Data Samples</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {(apiData?.federated_learning?.data_samples ?? 50000).toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Security Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-gray-600 dark:text-gray-400">Active Threats</span>
              </div>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {apiData?.security?.threats_detected ?? 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-gray-600 dark:text-gray-400">Blocked</span>
              </div>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {apiData?.security?.threats_blocked ?? 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600 dark:text-gray-400">Monitoring</span>
              </div>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                Active
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Alerts Table */}
      {apiData?.alerts && apiData.alerts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Security Alerts</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={exportAlertsCsv}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          <DataTable
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
    </div>
  );
};

export default Dashboard;