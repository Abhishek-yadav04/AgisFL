import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Users, 
  TrendingUp, 
  Play, 
  Pause,
  Settings, 
  BarChart3, 
  Globe,
  Shield,
  Zap,
  Target,
  Activity
} from 'lucide-react';
import { MetricCard } from '../components/Cards/MetricCard';
import MetricsChart from '../components/Charts/MetricsChart';
import { DataTable } from '../components/Tables/DataTable';
import { federatedLearningAPI, flIdsAPI, researchAPI } from '../services/api';
import { useRealTimeData } from '../hooks/useRealTimeData';
import toast from 'react-hot-toast';

const FederatedLearning: React.FC = () => {
  const [isTraining, setIsTraining] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState('FedAvg');

  // FL Status and metrics
  const { data: flStatus } = useQuery({
    queryKey: ['fl-status'],
    queryFn: () => federatedLearningAPI.getStatus(),
    refetchInterval: 3000,
  });

  // FL Strategies
  const { data: strategies } = useQuery({
    queryKey: ['fl-strategies'],
    queryFn: () => federatedLearningAPI.getStrategies(),
  });

  // Research algorithms
  const { data: algorithms } = useQuery({
    queryKey: ['research-algorithms'],
    queryFn: () => researchAPI.getEnterpriseAlgorithms(),
  });

  // Real-time FL-IDS metrics
  const {
    data: flIdsData,
    loading: flIdsLoading,
    isConnected: flIdsConnected
  } = useRealTimeData(
    () => flIdsAPI.getRealTimeMetrics(),
    { interval: 2000, enabled: true }
  );

  // FL experiments
  const { data: experiments } = useQuery({
    queryKey: ['fl-experiments'],
    queryFn: () => federatedLearningAPI.getExperiments(),
    refetchInterval: 10000,
  });

  const handleStartTraining = async () => {
    try {
      setIsTraining(true);
      await federatedLearningAPI.startTraining();
      toast.success('Federated learning training started');
    } catch (error) {
      toast.error('Failed to start training');
      setIsTraining(false);
    }
  };

  const handleStopTraining = async () => {
    try {
      setIsTraining(false);
      toast.success('Training stopped');
    } catch (error) {
      toast.error('Failed to stop training');
    }
  };

  // Prepare accuracy chart data
  const accuracyData = {
    labels: Array.from({ length: 20 }, (_, i) => `Round ${i + 1}`),
    datasets: [{
      label: 'Global Accuracy',
      data: Array.from({ length: 20 }, (_, i) => 
        Math.min(0.98, 0.70 + (i * 0.015) + (Math.random() * 0.005))
      ),
      borderColor: 'rgb(16, 185, 129)',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4,
    }, {
      label: 'Training Loss',
      data: Array.from({ length: 20 }, (_, i) => 
        Math.max(0.05, 0.8 - (i * 0.035) + (Math.random() * 0.01))
      ),
      borderColor: 'rgb(239, 68, 68)',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      tension: 0.4,
    }]
  };

  // Client distribution data
  const clientData = {
    labels: ['North America', 'Europe', 'Asia Pacific', 'Other'],
    datasets: [{
      data: [35, 25, 30, 10],
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

  // Prepare experiments table
  const experimentsColumns = [
    { key: 'name', label: 'Experiment', sortable: true },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'running' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
          value === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
          value === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
          'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
        }`}>
          {value.toUpperCase()}
        </span>
      )
    },
    { 
      key: 'accuracy', 
      label: 'Accuracy', 
      sortable: true,
      render: (value: number) => (
        <span className="font-mono text-green-600 dark:text-green-400">
          {(value * 100).toFixed(2)}%
        </span>
      )
    },
    { key: 'duration', label: 'Duration', sortable: true },
    { 
      key: 'created_at', 
      label: 'Created', 
      sortable: true,
      render: (value: string) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(value).toLocaleDateString()}
        </span>
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            Federated Learning Engine
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Privacy-preserving distributed machine learning across untrusted domains
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="FedAvg">FedAvg</option>
            <option value="FedProx">FedProx</option>
            <option value="SCAFFOLD">SCAFFOLD</option>
            <option value="FedNova">FedNova</option>
          </select>
          
          <button 
            onClick={isTraining ? handleStopTraining : handleStartTraining}
            className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
              isTraining 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white shadow-lg'
            }`}
          >
            {isTraining ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isTraining ? 'Stop Training' : 'Start Training'}</span>
          </button>
          
          <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Configure</span>
          </button>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Current Round"
          value={flStatus?.data?.federated_learning?.current_round || flIdsData?.fl_status?.current_round || 0}
          subtitle="Training iteration"
          icon={Brain}
          color="blue"
          realTime={flIdsConnected}
        />
        
        <MetricCard
          title="Global Accuracy"
          value={`${((flStatus?.data?.federated_learning?.global_accuracy || flIdsData?.fl_status?.global_accuracy || 0.94) * 100).toFixed(1)}%`}
          subtitle={selectedStrategy}
          icon={TrendingUp}
          color="green"
          trend={{ value: 2.1, direction: 'up' }}
          realTime={flIdsConnected}
        />
        
        <MetricCard
          title="Active Clients"
          value={flStatus?.data?.federated_learning?.active_clients || flIdsData?.fl_status?.clients_connected || 0}
          subtitle="Participating nodes"
          icon={Users}
          color="purple"
          realTime={flIdsConnected}
        />
        
        <MetricCard
          title="Convergence Rate"
          value={`${((flStatus?.data?.federated_learning?.convergence_rate || 0.95) * 100).toFixed(1)}%`}
          subtitle="Model stability"
          icon={Target}
          color="cyan"
          trend={{ value: 1.2, direction: 'up' }}
        />
      </div>

      {/* FL-IDS Engine Status */}
      {flIdsData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/10 rounded-xl">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">FL-IDS Real-time Engine</h3>
                <p className="text-purple-100">
                  Advanced federated learning with intrusion detection
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-2xl font-bold">{flIdsData.metrics?.packets_processed || 0}</p>
                <p className="text-sm text-purple-100">Packets Processed</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(flIdsData.metrics?.throughput_pps || 0)}</p>
                <p className="text-sm text-purple-100">Throughput (PPS)</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{flIdsData.metrics?.latency_ms?.toFixed(1) || '0.0'}ms</p>
                <p className="text-sm text-purple-100">Latency</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <Activity className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">Engine Status</p>
              <p className="text-xs text-purple-100">{flIdsData.engine_status}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <Shield className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">Features Active</p>
              <p className="text-xs text-purple-100">{flIdsData.features_active}/50</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <Target className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">Threats Detected</p>
              <p className="text-xs text-purple-100">{flIdsData.metrics?.threats_detected || 0}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">Accuracy</p>
              <p className="text-xs text-purple-100">{((flIdsData.metrics?.accuracy || 0) * 100).toFixed(1)}%</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricsChart
          type="line"
          data={accuracyData}
          title="Training Progress & Accuracy"
          height={350}
          gradient={true}
          realTime={flIdsConnected}
        />
        
        <MetricsChart
          type="doughnut"
          data={clientData}
          title="Client Distribution"
          height={350}
        />
      </div>

      {/* FL Algorithms */}
      {algorithms?.data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Available FL Algorithms
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {algorithms.data.algorithms?.map((algorithm: any, index: number) => (
              <motion.div
                key={algorithm.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => setSelectedStrategy(algorithm.name)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {algorithm.name}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    algorithm.implementation_status === 'production' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : algorithm.implementation_status === 'testing'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}>
                    {algorithm.implementation_status}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {algorithm.description}
                </p>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400">Convergence</p>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {(algorithm.performance_metrics?.convergence_rate * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400">Efficiency</p>
                    <p className="font-semibold text-blue-600 dark:text-blue-400">
                      {(algorithm.performance_metrics?.communication_efficiency * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400">Privacy</p>
                    <p className="font-semibold text-purple-600 dark:text-purple-400">
                      {(algorithm.performance_metrics?.privacy_preservation * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Training Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Training Progress
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Round Progress</span>
                <span>78%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '78%' }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Model Convergence</span>
                <span>{((flStatus?.data?.federated_learning?.convergence_rate || 0.95) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(flStatus?.data?.federated_learning?.convergence_rate || 0.95) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full"
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Privacy Budget (ε)</span>
                <span>0.1</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '10%' }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Client Status
          </h3>
          
          <div className="space-y-4">
            {[
              { id: 'client-001', location: 'New York', status: 'Active', accuracy: 95.1 },
              { id: 'client-002', location: 'London', status: 'Training', accuracy: 93.8 },
              { id: 'client-003', location: 'Tokyo', status: 'Active', accuracy: 94.5 },
              { id: 'client-004', location: 'Sydney', status: 'Idle', accuracy: 92.9 },
            ].map((client, index) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    client.status === 'Active' ? 'bg-green-500' :
                    client.status === 'Training' ? 'bg-blue-500 animate-pulse' :
                    'bg-gray-400'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {client.location}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {client.id}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {client.accuracy.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {client.status}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Experiments Table */}
      {experiments?.data && (
        <DataTable
          title="FL Experiments"
          subtitle="Recent federated learning experiments and results"
          data={experiments.data.experiments || []}
          columns={experimentsColumns}
          searchable={true}
          exportable={true}
          refreshable={true}
          onRefresh={() => window.location.reload()}
          pageSize={8}
        />
      )}

      {/* Advanced Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Advanced FL Features
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group">
            <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Differential Privacy</span>
          </button>
          
          <button className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors group">
            <Shield className="w-8 h-8 text-green-600 dark:text-green-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Secure Aggregation</span>
          </button>
          
          <button className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group">
            <Users className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Client Management</span>
          </button>
          
          <button className="flex flex-col items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors group">
            <BarChart3 className="w-8 h-8 text-orange-600 dark:text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Performance Analytics</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default FederatedLearning;