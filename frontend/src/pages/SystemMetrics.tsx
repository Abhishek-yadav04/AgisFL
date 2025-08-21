import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Network,
  TrendingUp,
  Server,
  Database,
  AlertTriangle,
  HeartPulse,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface SystemMetrics {
  cpu: {
    percent: number;
    per_core: number[];
    count: number;
    frequency_mhz: number;
    load_avg: number[];
  };
  memory: {
    percent: number;
    available_gb: number;
    used_gb: number;
    total_gb: number;
  };
  disk: {
    percent: number;
    free_gb: number;
    used_gb: number;
    total_gb: number;
  };
  network: {
    bytes_sent: number;
    bytes_recv: number;
    packets_sent: number;
    packets_recv: number;
  };
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

  useEffect(() => {
    fetchSystemMetrics();
    if (autoRefresh) {
      const interval = setInterval(fetchSystemMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const data = await response.json();
        const systemData = data.system_metrics;
        if (systemData) {
          const newMetrics: SystemMetrics = {
            cpu: {
              percent: systemData.cpu_percent || 0,
              per_core: systemData.cpu_per_core || [25, 30, 35, 40],
              count: systemData.cpu_count || 4,
              frequency_mhz: systemData.cpu_freq_mhz || 2400,
              load_avg: systemData.load_avg || [0.5, 0.8, 1.2],
            },
            memory: {
              percent: systemData.memory_percent || 0,
              available_gb: systemData.memory_available_gb || 0,
              used_gb: systemData.memory_used_gb || 0,
              total_gb: systemData.memory_total_gb || 0,
            },
            disk: {
              percent: systemData.disk_percent || 0,
              free_gb: systemData.disk_free_gb || 0,
              used_gb: systemData.disk_used_gb || 0,
              total_gb: systemData.disk_total_gb || 0,
            },
            network: {
              bytes_sent: systemData.network_sent_mb || 0,
              bytes_recv: systemData.network_recv_mb || 0,
              packets_sent: systemData.network_packets_sent || 0,
              packets_recv: systemData.network_packets_recv || 0,
            },
            processes: systemData.processes || 0,
            uptime_hours: systemData.uptime_hours || 0,
            timestamp: new Date().toISOString(),
          };

          setMetrics(newMetrics);
          setHistory((prev) => [...prev.slice(-19), {
            timestamp: new Date().toISOString(),
            cpu_percent: newMetrics.cpu.percent,
            memory_percent: newMetrics.memory.percent,
            disk_percent: newMetrics.disk.percent,
          }]);
        }
      }
    } catch (err) {
      console.error('Fetch metrics failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (percent: number, thresholds: { warning: number; critical: number }) => {
    if (percent >= thresholds.critical) return 'text-red-400';
    if (percent >= thresholds.warning) return 'text-yellow-400';
    return 'text-green-400';
  };

  const formatBytes = (mb: number) => {
    const bytes = mb * 1024 * 1024;
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const analyzeTrends = (field: keyof PerformanceHistory) => {
    if (history.length < 5) return '↔ stable';
    const recent = history.slice(-5).map((h) => h[field]);
    const avg1 = (recent[0] + recent[1]) / 2;
    const avg2 = (recent[3] + recent[4]) / 2;
    if (avg2 > avg1 * 1.1) return '↑ rising';
    if (avg2 < avg1 * 0.9) return '↓ falling';
    return '↔ stable';
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
          <h1 className="text-3xl font-bold text-white flex items-center space-x-2">
            <HeartPulse className="w-7 h-7 text-red-400" />
            <span>System Metrics</span>
          </h1>
          <p className="text-gray-400 mt-2">Real-time monitoring, insights & trends</p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-300">Auto-refresh</span>
          </label>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1000}>1s</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
          </select>
          <button
            onClick={fetchSystemMetrics}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Activity className="w-5 h-5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            icon: <Cpu className="w-8 h-8 text-blue-400" />, label: 'CPU Usage',
            value: `${metrics?.cpu.percent.toFixed(1)}%`,
            color: getHealthColor(metrics?.cpu.percent || 0, { warning: 70, critical: 90 }),
            trend: analyzeTrends('cpu_percent')
          },
          {
            icon: <Database className="w-8 h-8 text-green-400" />, label: 'Memory Usage',
            value: `${metrics?.memory.percent.toFixed(1)}%`,
            color: getHealthColor(metrics?.memory.percent || 0, { warning: 80, critical: 90 }),
            trend: analyzeTrends('memory_percent')
          },
          {
            icon: <HardDrive className="w-8 h-8 text-purple-400" />, label: 'Disk Usage',
            value: `${metrics?.disk.percent.toFixed(1)}%`,
            color: getHealthColor(metrics?.disk.percent || 0, { warning: 80, critical: 90 }),
            trend: analyzeTrends('disk_percent')
          },
          {
            icon: <Network className="w-8 h-8 text-orange-400" />, label: 'Network Out',
            value: formatBytes(metrics?.network.bytes_sent || 0),
            color: 'text-white',
            trend: '↔ stable'
          },
        ].map((card, i) => (
          <motion.div key={i} whileHover={{ scale: 1.02 }} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              {card.icon}
              <div>
                <p className="text-gray-400 text-sm">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-gray-400">{card.trend}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      {history.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <span>Performance Trends</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString()} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="cpu_percent" stroke="#60a5fa" name="CPU %" />
              <Line type="monotone" dataKey="memory_percent" stroke="#34d399" name="Memory %" />
              <Line type="monotone" dataKey="disk_percent" stroke="#a78bfa" name="Disk %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* AI Insights */}
      {metrics && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <span>AI Insights</span>
          </h3>
          <ul className="space-y-2 text-sm">
            {metrics.cpu.percent > 85 && (
              <li className="text-red-400">⚠ CPU usage is critically high</li>
            )}
            {metrics.memory.percent > 80 && (
              <li className="text-yellow-400">⚠ Memory usage above 80%</li>
            )}
            {metrics.disk.percent > 90 && (
              <li className="text-red-400">⚠ Disk nearly full</li>
            )}
            {metrics.network.bytes_sent > 1000 && (
              <li className="text-blue-400">📡 High outbound traffic</li>
            )}
            {metrics.uptime_hours > 72 && (
              <li className="text-green-400">✅ System stable for over 72h</li>
            )}
            {metrics.cpu.percent <= 85 && metrics.memory.percent <= 80 && metrics.disk.percent <= 90 && (
              <li className="text-gray-300">✅ All systems within normal range</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SystemMetrics;
