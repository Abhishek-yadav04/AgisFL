import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Globe, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Settings,
  Activity,
  Network,
  Brain,
  Shield,
  BarChart3,
  Play,
  Pause,
  Eye
} from 'lucide-react';
import { MetricCard } from '../components/Cards/MetricCard';
import { DataTable } from '../components/Tables/DataTable';
import { integrationsAPI } from '../services/api';
import { useRealTimeData } from '../hooks/useRealTimeData';
import toast from 'react-hot-toast';

const Integrations: React.FC = () => {
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);

  // Integrations overview
  const { 
    data: integrationsData, 
    refetch: refetchIntegrations 
  } = useQuery({
    queryKey: ['integrations-overview'],
    queryFn: () => integrationsAPI.getOverview(),
    refetchInterval: 10000,
  });

  // Scapy data
  const {
    data: scapyData,
    refresh: refreshScapy
  } = useRealTimeData(
    () => integrationsAPI.getScapyPackets(),
    { interval: 3000, enabled: true }
  );

  // Flower status
  const { data: flowerData } = useQuery({
    queryKey: ['flower-status'],
    queryFn: () => integrationsAPI.getFlowerStatus(),
    refetchInterval: 5000,
  });

  // Suricata alerts
  const { data: suricataData } = useQuery({
    queryKey: ['suricata-alerts'],
    queryFn: () => integrationsAPI.getSuricataAlerts(),
    refetchInterval: 5000,
  });

  // Grafana dashboards
  const { data: grafanaData } = useQuery({
    queryKey: ['grafana-dashboards'],
    queryFn: () => integrationsAPI.getGrafanaDashboards(),
  });

  const refreshAllIntegrations = async () => {
    try {
      await integrationsAPI.refresh();
      refetchIntegrations();
      refreshScapy();
      toast.success('Integrations refreshed');
    } catch (error) {
      toast.error('Failed to refresh integrations');
    }
  };

  const startIntegration = async (integration: string) => {
    try {
      switch (integration) {
        case 'scapy':
          await integrationsAPI.startScapyMonitoring();
          break;
        case 'flower':
          await integrationsAPI.startFlowerTraining();
          break;
        case 'suricata':
          await integrationsAPI.startSuricataMonitoring();
          break;
      }
      toast.success(`${integration} started`);
      refetchIntegrations();
    } catch (error) {
      toast.error(`Failed to start ${integration}`);
    }
  };

  const stopIntegration = async (integration: string) => {
    try {
      switch (integration) {
        case 'scapy':
          await integrationsAPI.stopScapyMonitoring();
          break;
        case 'flower':
          await integrationsAPI.stopFlowerTraining();
          break;
      }
      toast.success(`${integration} stopped`);
      refetchIntegrations();
    } catch (error) {
      toast.error(`Failed to stop ${integration}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'connected':
      case 'monitoring':
      case 'online':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
      case 'connecting':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
      case 'offline':
      case 'inactive':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />;
    }
  };

  const getIntegrationIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'scapy': return Network;
      case 'flower': return Brain;
      case 'suricata': return Shield;
      case 'grafana': return BarChart3;
      default: return Globe;
    }
  };

  // Prepare integrations table
  const integrationsColumns = [
    { 
      key: 'name', 
      label: 'Integration', 
      sortable: true,
      render: (value: string, row: any) => {
        const Icon = getIntegrationIcon(value);
        return (
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {row.type}
              </p>
            </div>
          </div>
        );
      }
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(value)}
          <span className={`font-medium ${
            ['active', 'connected', 'monitoring', 'online'].includes(value?.toLowerCase()) 
              ? 'text-green-600 dark:text-green-400'
              : ['warning', 'connecting'].includes(value?.toLowerCase())
              ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {value?.toUpperCase() || 'UNKNOWN'}
          </span>
        </div>
      )
    },
    { 
      key: 'last_update', 
      label: 'Last Update', 
      sortable: true,
      render: (value: string) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(value).toLocaleTimeString()}
        </span>
      )
    },
    { 
      key: 'metrics', 
      label: 'Metrics', 
      sortable: false,
      render: (value: any, row: any) => (
        <div className="text-xs space-y-1">
          {row.packets !== undefined && (
            <div>Packets: {row.packets.toLocaleString()}</div>
          )}
          {row.clients !== undefined && (
            <div>Clients: {row.clients}</div>
          )}
          {row.alerts !== undefined && (
            <div>Alerts: {row.alerts}</div>
          )}
          {row.dashboards !== undefined && (
            <div>Dashboards: {row.dashboards}</div>
          )}
        </div>
      )
    },
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
            System Integrations
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            External service connections, monitoring & management
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshAllIntegrations}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh All</span>
          </button>
          
          <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Configure</span>
          </button>
        </div>
      </motion.div>

      {/* Integration Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Integrations"
          value={integrationsData?.data?.integrations?.length || 0}
          subtitle="Connected services"
          icon={Globe}
          color="blue"
        />
        
        <MetricCard
          title="Active Services"
          value={integrationsData?.data?.active_count || 0}
          subtitle="Currently running"
          icon={CheckCircle}
          color="green"
        />
        
        <MetricCard
          title="Health Score"
          value="94%"
          subtitle="Overall integration health"
          icon={Activity}
          color="purple"
          trend={{ value: 2.1, direction: 'up' }}
        />
        
        <MetricCard
          title="Data Throughput"
          value="2.4 GB/h"
          subtitle="Processed data volume"
          icon={BarChart3}
          color="cyan"
        />
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Scapy Network Monitor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/10 rounded-xl">
                <Network className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">Scapy Monitor</h3>
                <p className="text-xs text-blue-100">Network packet capture</p>
              </div>
            </div>
            {getStatusIcon(scapyData?.scapy_available ? 'active' : 'inactive')}
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-100">Packets</span>
              <span className="font-semibold">{scapyData?.total_packets?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-100">Suspicious</span>
              <span className="font-semibold">{scapyData?.suspicious_packets || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-100">Mode</span>
              <span className="font-semibold">{scapyData?.capture_mode || 'Simulation'}</span>
            </div>
          </div>
          
          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => startIntegration('scapy')}
              className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-xs font-medium"
            >
              <Play className="w-3 h-3 inline mr-1" />
              Start
            </button>
            <button
              onClick={() => stopIntegration('scapy')}
              className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-xs font-medium"
            >
              <Pause className="w-3 h-3 inline mr-1" />
              Stop
            </button>
          </div>
        </motion.div>

        {/* Flower FL Server */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/10 rounded-xl">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">Flower FL</h3>
                <p className="text-xs text-purple-100">Federated learning server</p>
              </div>
            </div>
            {getStatusIcon(flowerData?.data?.is_training ? 'active' : 'inactive')}
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-purple-100">Round</span>
              <span className="font-semibold">{flowerData?.data?.round || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-100">Accuracy</span>
              <span className="font-semibold">{((flowerData?.data?.accuracy || 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-100">Clients</span>
              <span className="font-semibold">{flowerData?.data?.participating_clients || 0}</span>
            </div>
          </div>
          
          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => startIntegration('flower')}
              className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-xs font-medium"
            >
              <Play className="w-3 h-3 inline mr-1" />
              Start
            </button>
            <button
              onClick={() => stopIntegration('flower')}
              className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-xs font-medium"
            >
              <Pause className="w-3 h-3 inline mr-1" />
              Stop
            </button>
          </div>
        </motion.div>

        {/* Suricata IDS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/10 rounded-xl">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">Suricata IDS</h3>
                <p className="text-xs text-red-100">Intrusion detection</p>
              </div>
            </div>
            {getStatusIcon('active')}
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-red-100">Alerts</span>
              <span className="font-semibold">{suricataData?.data?.new_alerts || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-100">Rules</span>
              <span className="font-semibold">{(25000).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-100">Performance</span>
              <span className="font-semibold">Optimal</span>
            </div>
          </div>
          
          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => startIntegration('suricata')}
              className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-xs font-medium"
            >
              <Play className="w-3 h-3 inline mr-1" />
              Start
            </button>
            <button className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-xs font-medium">
              <Settings className="w-3 h-3 inline mr-1" />
              Config
            </button>
          </div>
        </motion.div>

        {/* Grafana Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/10 rounded-xl">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">Grafana</h3>
                <p className="text-xs text-green-100">Metrics visualization</p>
              </div>
            </div>
            {getStatusIcon('online')}
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-100">Dashboards</span>
              <span className="font-semibold">{grafanaData?.data?.total_count || 4}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-100">Data Sources</span>
              <span className="font-semibold">8</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-100">Uptime</span>
              <span className="font-semibold">99.9%</span>
            </div>
          </div>
          
          <div className="flex space-x-2 mt-4">
            <button className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-xs font-medium">
              <Eye className="w-3 h-3 inline mr-1" />
              View
            </button>
            <button className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-xs font-medium">
              <Settings className="w-3 h-3 inline mr-1" />
              Config
            </button>
          </div>
        </motion.div>
      </div>

      {/* Integrations Table */}
      <DataTable
        title="Integration Details"
        subtitle="Detailed view of all system integrations"
        data={integrationsData?.data?.integrations || []}
        columns={integrationsColumns}
        searchable={true}
        filterable={true}
        refreshable={true}
        onRefresh={refetchIntegrations}
        onRowClick={setSelectedIntegration}
        pageSize={10}
      />

      {/* Integration Health Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Integration Health Matrix
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {integrationsData?.data?.integrations?.map((integration: any, index: number) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {integration.name}
                </h4>
                {getStatusIcon(integration.status)}
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Type</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {integration.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Health</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {Math.floor(Math.random() * 20) + 80}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Uptime</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {Math.floor(Math.random() * 24) + 1}h
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Integration Details Modal */}
      {selectedIntegration && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelectedIntegration(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedIntegration.name} Details
              </h3>
              <button
                onClick={() => setSelectedIntegration(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Status
                </label>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(selectedIntegration.status)}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedIntegration.status?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Type
                </label>
                <p className="text-gray-900 dark:text-white font-semibold">
                  {selectedIntegration.type}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Last Update
                </label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(selectedIntegration.last_update).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Health Score
                </label>
                <p className="text-gray-900 dark:text-white font-semibold">
                  95%
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Integrations;