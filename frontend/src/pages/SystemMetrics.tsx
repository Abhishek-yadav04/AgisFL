import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Network, TrendingUp, Server, Database, Download, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { systemAPI } from '../api'; // 🔥 use centralized API

interface SystemMetrics {
  cpu: { percent: number; per_core: number[]; count: number; frequency_mhz: number; load_avg: number[] };
  memory: { percent: number; available_gb: number; used_gb: number; total_gb: number };
  disk: { percent: number; free_gb: number; used_gb: number; total_gb: number };
  network: { bytes_sent: number; bytes_recv: number; packets_sent: number; packets_recv: number };
  processes: number;
  uptime_hours: number;
  timestamp: string;
}

interface PerformanceHistory {
  timestamp: string;
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
}

const SystemMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [history, setHistory] = useState<PerformanceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [error, setError] = useState<string | null>(null);

  // 🚀 Fetch metrics via centralized API
  const fetchSystemMetrics = async () => {
    try {
      const { data } = await systemAPI.getMetrics();
      if (data?.system_metrics) {
        setMetrics(data.system_metrics);
        if (data.system_metrics.history) {
          setHistory((prev) => [...prev, ...data.system_metrics.history].slice(-50));
        }
      }
      setError(null);
    } catch (err) {
      setError('Failed to load system metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemMetrics();
    if (autoRefresh) {
      const interval = setInterval(fetchSystemMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getHealthColor = (percent: number, thresholds: { warning: number; critical: number }) => {
    if (percent >= thresholds.critical) return 'text-red-400';
    if (percent >= thresholds.warning) return 'text-yellow-400';
    return 'text-green-400';
  };

  const formatBytes = (mb: number) => `${mb.toFixed(2)} MB`;

  const exportMetrics = () => {
    if (!metrics) return;
    const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">System Metrics</h1>
          <p className="text-gray-400 mt-2">Real-time system performance monitoring and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          {error && (
            <span className="flex items-center text-sm text-red-400">
              <AlertTriangle className="w-4 h-4 mr-1" /> {error}
            </span>
          )}
          <button
            onClick={exportMetrics}
            className="flex items-center bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm text-white"
          >
            <Download className="w-4 h-4 mr-2" /> Export
          </button>
          <button
            onClick={fetchSystemMetrics}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Activity className="w-5 h-5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'CPU Usage', value: metrics?.cpu.percent || 0, icon: Cpu, thresholds: { warning: 70, critical: 90 }, color: 'text-blue-400' },
          { label: 'Memory Usage', value: metrics?.memory.percent || 0, icon: Database, thresholds: { warning: 80, critical: 90 }, color: 'text-green-400' },
          { label: 'Disk Usage', value: metrics?.disk.percent || 0, icon: HardDrive, thresholds: { warning: 80, critical: 90 }, color: 'text-purple-400' },
          { label: 'Processes', value: metrics?.processes || 0, icon: Server, thresholds: { warning: 200, critical: 400 }, color: 'text-orange-400' },
        ].map((card, idx) => (
          <div key={idx} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <card.icon className={`w-8 h-8 ${card.color}`} />
              <div>
                <p className="text-gray-400 text-sm">{card.label}</p>
                <p className={`text-2xl font-bold ${getHealthColor(card.value, card.thresholds)}`}>
                  {card.value.toFixed(1)}{idx < 3 ? '%' : ''}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance History Chart */}
      {history.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <span>Performance Trends</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={history}>
              <XAxis dataKey="timestamp" hide />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="cpu_percent" stroke="#3b82f6" name="CPU %" dot={false} />
              <Line type="monotone" dataKey="memory_percent" stroke="#22c55e" name="Memory %" dot={false} />
              <Line type="monotone" dataKey="disk_percent" stroke="#a855f7" name="Disk %" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
{/* Performance History Chart */}
{history.length > 0 && (
  <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
    ...
  </div>
)}

{/* AI Insights Panel */}
{metrics && (
  <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
    <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
      <AlertTriangle className="w-5 h-5 text-yellow-400" />
      <span>System Insights</span>
    </h3>
    <ul className="space-y-2 text-sm">
      {metrics.cpu.percent > 85 && (
        <li className="text-red-400">⚠ CPU usage is critically high ({metrics.cpu.percent.toFixed(1)}%)</li>
      )}
      {metrics.memory.percent > 80 && (
        <li className="text-yellow-400">⚠ Memory usage is above 80% ({metrics.memory.percent.toFixed(1)}%)</li>
      )}
      {metrics.disk.percent > 90 && (
        <li className="text-red-400">⚠ Disk space is nearly full ({metrics.disk.percent.toFixed(1)}%)</li>
      )}
      {metrics.network.bytes_sent > 1000 && (
        <li className="text-blue-400">📡 High outbound network traffic detected ({metrics.network.bytes_sent.toFixed(2)} MB sent)</li>
      )}
      {metrics.uptime_hours > 72 && (
        <li className="text-green-400">✅ System has been stable for over {metrics.uptime_hours.toFixed(0)} hours</li>
      )}
      {/* Default case when no warnings */}
      {metrics.cpu.percent <= 85 && metrics.memory.percent <= 80 && metrics.disk.percent <= 90 && (
        <li className="text-gray-300">✅ System resources are operating within normal ranges</li>
      )}
    </ul>
  </div>
)}

export default SystemMetrics;
