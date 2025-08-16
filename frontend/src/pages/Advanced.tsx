import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Target, 
  Zap, 
  Brain, 
  Shield,
  Activity,
  Play,
  Pause,
  Settings,
  Eye,
  AlertTriangle,
  CheckCircle,
  Users,
  BarChart3
} from 'lucide-react';
import { MetricCard } from '../components/Cards/MetricCard';
import MetricsChart from '../components/Charts/MetricsChart';
import { DataTable } from '../components/Tables/DataTable';
import { flIdsAPI, adminAPI, optimizerAPI } from '../services/api';
import { useRealTimeData } from '../hooks/useRealTimeData';
import toast from 'react-hot-toast';

const Advanced: React.FC = () => {
  const [engineRunning, setEngineRunning] = useState(false);
  const [attackSimulation, setAttackSimulation] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);

  // FL-IDS Engine status
  const { 
    data: engineStatus, 
    refetch: refetchEngine 
  } = useQuery({
    queryKey: ['fl-ids-status'],
    queryFn: () => flIdsAPI.getStatus(),
    refetchInterval: 5000,
  });

  // FL-IDS Features
  const { data: features } = useQuery({
    queryKey: ['fl-ids-features'],
    queryFn: () => flIdsAPI.getFeatures(),
  });

  // Real-time metrics
  const {
    data: realTimeMetrics,
    loading: metricsLoading,
    isConnected: metricsConnected
  } = useRealTimeData(
    () => flIdsAPI.getRealTimeMetrics(),
    { interval: 1000, enabled: true }
  );

  // Performance analytics
  const { data: analytics } = useQuery({
    queryKey: ['performance-analytics'],
    queryFn: () => flIdsAPI.getPerformanceAnalytics(),
    refetchInterval: 10000,
  });

  // Admin status
  const { data: adminStatus } = useQuery({
    queryKey: ['admin-status'],
    queryFn: () => adminAPI.getStatus(),
  });

  // Optimizer status
  const { data: optimizerStatus } = useQuery({
    queryKey: ['optimizer-status'],
    queryFn: () => optimizerAPI.getStatus(),
  });

  // Available attacks
  const { data: availableAttacks } = useQuery({
    queryKey: ['available-attacks'],
    queryFn: () => flIdsAPI.getSimulatedAttacks(),
  });

  const toggleEngine = async () => {
    try {
      if (engineRunning) {
        await flIdsAPI.stop();
        setEngineRunning(false);
        toast.success('FL-IDS Engine stopped');
      } else {
        await flIdsAPI.start();
        setEngineRunning(true);
        toast.success('FL-IDS Engine started');
      }
      refetchEngine();
    } catch (error) {
      toast.error('Failed to toggle engine');
    }
  };

  const toggleAttackSimulation = async () => {
    try {
      await flIdsAPI.toggleSimulation(!attackSimulation);
      setAttackSimulation(!attackSimulation);
      toast.success(`Attack simulation ${!attackSimulation ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to toggle attack simulation');
    }
  };

  const simulateAttack = async (attackType: string) => {
    try {
      await flIdsAPI.simulateAttack(attackType);
      toast.success(`Simulating ${attackType} attack`);
    } catch (error) {
      toast.error('Failed to simulate attack');
    }
  };

  const forceOptimization = async () => {
    try {
      await optimizerAPI.optimize();
      toast.success('System optimization triggered');
    } catch (error) {
      toast.error('Failed to optimize system');
    }
  };

  // Prepare features table
  const featuresColumns = [
    { 
      key: 'name', 
      label: 'Feature Name', 
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            row.status === 'active' ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {value.toUpperCase()}
        </span>
      )
    },
    { 
      key: 'accuracy', 
      label: 'Performance', 
      sortable: true,
      render: (value: number, row: any) => {
        const metric = value || row.detection_rate || row.efficiency || row.accuracy || 0;
        return (
          <span className="font-mono text-blue-600 dark:text-blue-400">
            {(metric * 100).toFixed(1)}%
          </span>
        );
      }
    },
  ];

  const featuresData = features?.data?.features ? 
    Object.entries(features.data.features).map(([id, feature]: [string, any]) => ({
      id,
      ...feature
    })) : [];

  // Performance metrics chart
  const performanceData = {
    labels: ['Detection Rate', 'Accuracy', 'Throughput', 'Latency', 'Efficiency'],
    datasets: [{
      label: 'Current Performance',
      data: [
        (realTimeMetrics?.metrics?.accuracy || 0.95) * 100,
        (analytics?.data?.analytics?.detection_performance?.accuracy || 0.94) * 100,
        Math.min(100, (realTimeMetrics?.metrics?.throughput_pps || 1000) / 50),
        Math.max(0, 100 - (realTimeMetrics?.metrics?.latency_ms || 2) * 10),
        (analytics?.data?.analytics?.system_performance?.cpu_usage || 85)
      ],
      backgroundColor: 'rgba(139, 92, 246, 0.8)',
      borderColor: 'rgb(139, 92, 246)',
      borderWidth: 2,
    }]
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
            Advanced FL-IDS Engine
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            50-feature federated learning intrusion detection system with real-time capabilities
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleEngine}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
              engineRunning 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {engineRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{engineRunning ? 'Stop Engine' : 'Start Engine'}</span>
          </button>
          
          <button
            onClick={forceOptimization}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>Optimize</span>
          </button>
        </div>
      </motion.div>

      {/* Engine Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Engine Status"
          value={engineStatus?.data?.engine_status?.toUpperCase() || realTimeMetrics?.engine_status?.toUpperCase() || 'STOPPED'}
          subtitle={`${features?.data?.active_features || realTimeMetrics?.features_active || 0}/50 features`}
          icon={Target}
          color="purple"
          realTime={metricsConnected}
        />
        
        <MetricCard
          title="Threats Detected"
          value={realTimeMetrics?.metrics?.threats_detected || 0}
          subtitle="Real-time detection"
          icon={Shield}
          color="red"
          realTime={metricsConnected}
        />
        
        <MetricCard
          title="Processing Rate"
          value={`${Math.round(realTimeMetrics?.metrics?.throughput_pps || 0)}/s`}
          subtitle="Packets per second"
          icon={Activity}
          color="blue"
          realTime={metricsConnected}
        />
        
        <MetricCard
          title="Response Time"
          value={`${realTimeMetrics?.metrics?.latency_ms?.toFixed(1) || '0.0'}ms`}
          subtitle="Detection latency"
          icon={Zap}
          color="green"
          realTime={metricsConnected}
        />
      </div>

      {/* Attack Simulation Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/10 rounded-xl">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Attack Simulation Center</h3>
              <p className="text-red-100">
                Test detection capabilities with simulated cyber attacks
              </p>
            </div>
          </div>
          
          <button
            onClick={toggleAttackSimulation}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              attackSimulation 
                ? 'bg-white/20 hover:bg-white/30' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {attackSimulation ? 'Disable Simulation' : 'Enable Simulation'}
          </button>
        </div>
        
        {attackSimulation && availableAttacks?.data && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {availableAttacks.data.available_attacks?.map((attack: any, index: number) => (
              <motion.button
                key={attack.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => simulateAttack(attack.name.toLowerCase().replace(' ', '_'))}
                className="p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-center"
              >
                <div className="text-sm font-medium mb-1">{attack.name}</div>
                <div className="text-xs text-red-100">{attack.severity}</div>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Performance Analytics */}
      {analytics?.data?.available && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MetricsChart
            type="bar"
            data={performanceData}
            title="System Performance Metrics"
            height={350}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Detection Performance
            </h3>
            
            <div className="space-y-4">
              {Object.entries(analytics.data.analytics.detection_performance || {}).map(([metric, value]: [string, any]) => (
                <div key={metric} className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 capitalize">
                    {metric.replace('_', ' ')}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {typeof value === 'number' ? (value * 100).toFixed(1) + '%' : value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* 50 Features Overview */}
      <DataTable
        title="FL-IDS Features (50 Total)"
        subtitle="Comprehensive feature status and performance metrics"
        data={featuresData}
        columns={featuresColumns}
        searchable={true}
        filterable={true}
        refreshable={true}
        onRefresh={() => window.location.reload()}
        onRowClick={setSelectedFeature}
        pageSize={15}
      />

      {/* System Optimization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <div className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            System Optimizer
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Optimizer Status</span>
              <span className={`font-semibold ${
                optimizerStatus?.data?.is_running ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {optimizerStatus?.data?.is_running ? 'Running' : 'Stopped'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Optimizations Applied</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {optimizerStatus?.data?.optimization_count || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Average Improvement</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {((optimizerStatus?.data?.average_improvement || 0) * 100).toFixed(1)}%
              </span>
            </div>
            
            <button
              onClick={forceOptimization}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Force Optimization</span>
            </button>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Admin Privileges
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Admin Status</span>
              <span className={`font-semibold ${
                adminStatus?.data?.is_admin ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
              }`}>
                {adminStatus?.data?.is_admin ? 'Granted' : 'Required'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Platform</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {adminStatus?.data?.platform || 'Unknown'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Capture Mode</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {adminStatus?.data?.capture_mode || 'Simulation'}
              </span>
            </div>
            
            {!adminStatus?.data?.is_admin && (
              <button
                onClick={() => adminAPI.requestPrivileges()}
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Shield className="w-4 h-4" />
                <span>Request Privileges</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Feature Details Modal */}
      {selectedFeature && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelectedFeature(null)}
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
                Feature Details: {selectedFeature.name}
              </h3>
              <button
                onClick={() => setSelectedFeature(null)}
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
                  <div className={`w-3 h-3 rounded-full ${
                    selectedFeature.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedFeature.status?.toUpperCase()}
                  </span>
                </div>
              </div>
              
              {selectedFeature.accuracy && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Accuracy
                  </label>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {(selectedFeature.accuracy * 100).toFixed(1)}%
                  </p>
                </div>
              )}
              
              {selectedFeature.detection_rate && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Detection Rate
                  </label>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {(selectedFeature.detection_rate * 100).toFixed(1)}%
                  </p>
                </div>
              )}
              
              {selectedFeature.privacy_level && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Privacy Level
                  </label>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {(selectedFeature.privacy_level * 100).toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Advanced;