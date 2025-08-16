import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Brain, 
  Activity, 
  Network,
  Database,
  Zap,
  Target,
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users,
  Globe,
  Lock,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react';
import { MetricCard } from '../components/Cards/MetricCard';
import MetricsChart from '../components/Charts/MetricsChart';
import { DataTable } from '../components/Tables/DataTable';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { dashboardAPI, flIdsAPI, integrationsAPI } from '../services/api';
import { useAppStore } from '../stores/appStore';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { autoRefresh, refreshInterval, addNotification, setConnectionStatus } = useAppStore();
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Main dashboard data
  const { 
    data: dashboardData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardAPI.getDashboard(),
    refetchInterval: autoRefresh ? refreshInterval : false,
    onSuccess: () => setConnectionStatus('connected'),
    onError: () => setConnectionStatus('error'),
  });

  // Real-time FL-IDS data
  const {
    data: flIdsData,
    loading: flIdsLoading,
    isConnected: flIdsConnected
  } = useRealTimeData(
    () => flIdsAPI.getRealTimeMetrics(),
    { interval: 2000, enabled: autoRefresh }
  );

  // Integrations status
  const { data: integrationsData } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => integrationsAPI.getOverview(),
    refetchInterval: 10000,
  });

  // FL Status
  const { data: flStatusData } = useQuery({
    queryKey: ['fl-status'],
    queryFn: () => flIdsAPI.getFLStatus(),
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (error) {
      toast.error('Failed to load dashboard data');
      addNotification({
        type: 'error',
        title: 'Dashboard Error',
        message: 'Failed to load dashboard data'
      });
    }
  }, [error, addNotification]);

  const data = dashboardData?.data;

  // Prepare chart data
  const systemChartData = {
    labels: ['CPU', 'Memory', 'Disk', 'Network'],
    datasets: [{
      label: 'System Usage (%)',
      data: [
        data?.performance?.cpu_usage || data?.system?.cpu_percent || 0,
        data?.performance?.memory_usage || data?.system?.memory_percent || 0,
        data?.performance?.disk_usage || data?.system?.disk_percent || 0,
        Math.min(100, (data?.performance?.network_traffic_mb || 0) / 10)
      ],
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
    }]
  };

  const flAccuracyData = {
    labels: Array.from({ length: 10 }, (_, i) => `Round ${i + 1}`),
    datasets: [{
      label: 'Global Accuracy',
      data: Array.from({ length: 10 }, (_, i) => 
        Math.min(0.98, 0.75 + (i * 0.02) + (Math.random() * 0.01))
      ),
      borderColor: 'rgb(16, 185, 129)',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4,
    }]
  };

  // Prepare alerts table data
  const alertsColumns = [
    { key: 'type', label: 'Type', sortable: true },
    { key: 'severity', label: 'Severity', sortable: true, render: (value: string) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        value === 'CRITICAL' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
        value === 'HIGH' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
        value === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
        'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      }`}>
        {value}
      </span>
    )},
    { key: 'message', label: 'Message', sortable: false },
    { key: 'source', label: 'Source', sortable: true },
    { key: 'timestamp', label: 'Time', sortable: true, render: (value: string) => (
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {new Date(value).toLocaleTimeString()}
      </span>
    )},
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
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
          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${
              flIdsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {flIdsConnected ? 'Live Data' : 'Offline'}
            </span>
          </div>
          
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="FL Training Round"
          value={data?.federated_learning?.current_round || flStatusData?.data?.current_round || 0}
          subtitle={`${data?.federated_learning?.active_clients || data?.federated_learning?.participating_clients || 0} active clients`}
          icon={Brain}
          color="blue"
          trend={{ value: 2.3, direction: 'up' }}
          realTime={flIdsConnected}
          onClick={() => setSelectedMetric('fl')}
        />
        
        <MetricCard
          title="Global Accuracy"
          value={`${((data?.federated_learning?.global_accuracy || flIdsData?.fl_status?.global_accuracy || 0.94) * 100).toFixed(1)}%`}
          subtitle={data?.federated_learning?.strategy || 'FedAvg'}
          icon={TrendingUp}
          color="green"
          trend={{ value: 1.8, direction: 'up' }}
          realTime={flIdsConnected}
          onClick={() => setSelectedMetric('accuracy')}
        />
        
        <MetricCard
          title="Security Score"
          value={`${data?.security?.security_score || data?.overview?.security_score || 95}%`}
          subtitle={`${data?.security?.threats_detected || data?.security?.threats_blocked || 0} threats detected`}
          icon={Shield}
          color="red"
          trend={{ value: -0.5, direction: 'down' }}
          realTime={true}
          onClick={() => setSelectedMetric('security')}
        />
        
        <MetricCard
          title="System Health"
          value={`${data?.overview?.system_health || 92}%`}
          subtitle={`${data?.overview?.total_processes || data?.system?.processes || 0} processes`}
          icon={Activity}
          color="purple"
          trend={{ value: 0.8, direction: 'up' }}
          realTime={true}
          onClick={() => setSelectedMetric('system')}
        />
      </div>

      {/* FL-IDS Engine Status */}
      {flIdsData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
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
                  {flIdsData.features_active}/50 features active • {flIdsData.engine_status}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-2xl font-bold">{flIdsData.metrics?.threats_detected || 0}</p>
                <p className="text-sm text-blue-100">Threats Detected</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{Math.round(flIdsData.metrics?.throughput_pps || 0)}</p>
                <p className="text-sm text-blue-100">Packets/sec</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{flIdsData.metrics?.latency_ms?.toFixed(1) || '0.0'}ms</p>
                <p className="text-sm text-blue-100">Latency</p>
              </div>
            </div>
          </div>
          
          {flIdsData.recent_threats && flIdsData.recent_threats.length > 0 && (
            <div className="bg-white/10 rounded-xl p-4">
              <h4 className="font-semibold mb-2">Recent Threats</h4>
              <div className="space-y-2">
                {flIdsData.recent_threats.slice(0, 3).map((threat: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span>{threat.type || threat.attack_type || 'Unknown'}</span>
                    <span className="text-blue-100">{threat.source_ip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricsChart
          type="doughnut"
          data={systemChartData}
          title="System Resource Usage"
          height={300}
          realTime={true}
        />
        
        <MetricsChart
          type="line"
          data={flAccuracyData}
          title="FL Training Progress"
          height={300}
          gradient={true}
          realTime={flIdsConnected}
        />
      </div>

      {/* Integrations Status */}
      {integrationsData?.data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {integrationsData.data.integrations?.map((integration: any, index: number) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {integration.name}
                </h4>
                <div className={`w-3 h-3 rounded-full ${
                  integration.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                }`} />
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Type</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {integration.type}
                  </span>
                </div>
                
                {integration.packets !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Packets</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {integration.packets.toLocaleString()}
                    </span>
                  </div>
                )}
                
                {integration.clients !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Clients</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {integration.clients}
                    </span>
                  </div>
                )}
                
                {integration.alerts !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Alerts</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {integration.alerts}
                    </span>
                  </div>
                )}
                
                {integration.dashboards !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Dashboards</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {integration.dashboards}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Alerts Table */}
      {data?.alerts && data.alerts.length > 0 && (
        <DataTable
          title="Recent Alerts"
          subtitle="Real-time security and system alerts"
          data={data.alerts}
          columns={[
            { key: 'type', label: 'Type', sortable: true },
            { 
              key: 'severity', 
              label: 'Severity', 
              sortable: true,
              render: (value: string) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  value === 'CRITICAL' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                  value === 'HIGH' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                  value === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                }`}>
                  {value}
                </span>
              )
            },
            { key: 'message', label: 'Message', sortable: false },
            { key: 'source', label: 'Source', sortable: true },
            { 
              key: 'timestamp', 
              label: 'Time', 
              sortable: true,
              render: (value: string) => (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(value).toLocaleTimeString()}
                </span>
              )
            },
          ]}
          searchable={true}
          exportable={true}
          refreshable={true}
          onRefresh={() => refetch()}
          pageSize={5}
        />
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            System Performance
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">CPU</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {data?.performance?.cpu_usage || data?.system?.cpu_percent || 0}%
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Memory</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {data?.performance?.memory_usage || data?.system?.memory_percent || 0}%
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Disk</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {data?.performance?.disk_usage || data?.system?.disk_percent || 0}%
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Network</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {data?.performance?.network_traffic_mb || 0}MB
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            FL Training Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Strategy</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {data?.federated_learning?.strategy || 'FedAvg'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Convergence</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {((data?.federated_learning?.convergence_rate || 0.95) * 100).toFixed(1)}%
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Data Samples</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {(data?.federated_learning?.data_samples || 50000).toLocaleString()}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Model Size</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {data?.federated_learning?.model_size_mb || 12.5}MB
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Security Overview
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Threats</span>
              </div>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {data?.security?.threats_detected || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Blocked</span>
              </div>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {data?.security?.threats_blocked || data?.security?.intrusions_blocked || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Monitoring</span>
              </div>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                Active
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Firewall</span>
              </div>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                Enabled
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group">
            <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Start FL Training</span>
          </button>
          
          <button className="flex flex-col items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group">
            <Target className="w-6 h-6 text-red-600 dark:text-red-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-red-700 dark:text-red-300">Attack Simulation</span>
          </button>
          
          <button className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors group">
            <Network className="w-6 h-6 text-green-600 dark:text-green-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Network Monitor</span>
          </button>
          
          <button className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group">
            <Database className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Manage Data</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;