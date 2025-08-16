import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Lock, 
  Target,
  Activity,
  Zap,
  Globe,
  Users,
  BarChart3,
  RefreshCw,
  Play,
  Pause
} from 'lucide-react';
import { MetricCard } from '../components/Cards/MetricCard';
import MetricsChart from '../components/Charts/MetricsChart';
import { DataTable } from '../components/Tables/DataTable';
import { securityAPI, flIdsAPI, threatIntelAPI } from '../services/api';
import { useRealTimeData } from '../hooks/useRealTimeData';
import toast from 'react-hot-toast';

const Security: React.FC = () => {
  const [attackSimulation, setAttackSimulation] = useState(false);
  const [selectedThreat, setSelectedThreat] = useState<any>(null);

  // Security metrics
  const { data: securityMetrics, refetch: refetchSecurity } = useQuery({
    queryKey: ['security-metrics'],
    queryFn: () => securityAPI.getSecurityMetrics(),
    refetchInterval: 5000,
  });

  // Live threats
  const {
    data: liveThreats,
    loading: threatsLoading,
    refresh: refreshThreats
  } = useRealTimeData(
    () => securityAPI.getLiveThreats(),
    { interval: 3000, enabled: true }
  );

  // FL-IDS threats
  const {
    data: flIdsThreats,
    isConnected: flIdsConnected
  } = useRealTimeData(
    () => flIdsAPI.getLiveThreats(),
    { interval: 2000, enabled: true }
  );

  // Threat intelligence
  const { data: threatIntel } = useQuery({
    queryKey: ['threat-intel'],
    queryFn: () => threatIntelAPI.getLiveFeed(),
    refetchInterval: 30000,
  });

  // IOC Database
  const { data: iocData } = useQuery({
    queryKey: ['ioc-database'],
    queryFn: () => threatIntelAPI.getIOCDatabase(),
    refetchInterval: 60000,
  });

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

  // Prepare threat trends chart
  const threatTrendsData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Threats Detected',
      data: [12, 19, 8, 15, 22, 18, 25],
      borderColor: 'rgb(239, 68, 68)',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      tension: 0.4,
    }, {
      label: 'Threats Blocked',
      data: [10, 17, 7, 13, 20, 16, 23],
      borderColor: 'rgb(16, 185, 129)',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4,
    }]
  };

  // Attack types distribution
  const attackTypesData = {
    labels: ['Port Scan', 'DDoS', 'Malware', 'Brute Force', 'Phishing'],
    datasets: [{
      data: [35, 25, 20, 15, 5],
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)'
      ],
      borderColor: [
        'rgb(239, 68, 68)',
        'rgb(245, 158, 11)',
        'rgb(139, 92, 246)',
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)'
      ],
      borderWidth: 2,
    }]
  };

  // Prepare threats table
  const allThreats = [
    ...(liveThreats?.threats || []),
    ...(flIdsThreats?.threats || []),
    ...(threatIntel?.data?.threats || [])
  ].slice(0, 20);

  const threatsColumns = [
    { 
      key: 'type', 
      label: 'Threat Type', 
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-red-500" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    { 
      key: 'severity', 
      label: 'Severity', 
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value?.toLowerCase() === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
          value?.toLowerCase() === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
          value?.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
          'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
        }`}>
          {value?.toUpperCase() || 'UNKNOWN'}
        </span>
      )
    },
    { 
      key: 'source_ip', 
      label: 'Source IP', 
      sortable: true,
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    { 
      key: 'confidence', 
      label: 'Confidence', 
      sortable: true,
      render: (value: number) => (
        <span className="font-mono text-green-600 dark:text-green-400">
          {((value || 0) * 100).toFixed(1)}%
        </span>
      )
    },
    { 
      key: 'timestamp', 
      label: 'Detected', 
      sortable: true,
      render: (value: string) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(value).toLocaleTimeString()}
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
            Security Command Center
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Advanced threat detection, analysis & automated response systems
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleAttackSimulation}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
              attackSimulation 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            {attackSimulation ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>Attack Simulation</span>
          </button>
          
          <button
            onClick={() => {
              refetchSecurity();
              refreshThreats();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Active Threats"
          value={securityMetrics?.data?.active_threats || liveThreats?.total_count || 0}
          subtitle="Real-time detection"
          icon={AlertTriangle}
          color="red"
          realTime={true}
          badge="LIVE"
        />
        
        <MetricCard
          title="Blocked Attacks"
          value={securityMetrics?.data?.blocked_attacks || 127}
          subtitle="Automated response"
          icon={Shield}
          color="green"
          trend={{ value: 15.2, direction: 'up' }}
        />
        
        <MetricCard
          title="Security Score"
          value={`${securityMetrics?.data?.security_score || 95}%`}
          subtitle="Overall security posture"
          icon={Lock}
          color="blue"
          trend={{ value: 2.1, direction: 'up' }}
        />
        
        <MetricCard
          title="Monitored Assets"
          value="1,247"
          subtitle="Network endpoints"
          icon={Eye}
          color="purple"
        />
      </div>

      {/* Attack Simulation Panel */}
      {attackSimulation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/10 rounded-xl">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Attack Simulation Active</h3>
                <p className="text-red-100">
                  Simulated attacks for testing detection capabilities
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {['port_scan', 'brute_force', 'ddos', 'malware', 'data_exfiltration'].map(attackType => (
              <button
                key={attackType}
                onClick={() => simulateAttack(attackType)}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-center"
              >
                <div className="text-sm font-medium">
                  {attackType.replace('_', ' ').toUpperCase()}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricsChart
          type="line"
          data={threatTrendsData}
          title="Threat Detection Trends"
          height={350}
          gradient={true}
          realTime={true}
        />
        
        <MetricsChart
          type="doughnut"
          data={attackTypesData}
          title="Attack Types Distribution"
          height={350}
        />
      </div>

      {/* Threat Intelligence */}
      {iocData?.data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Threat Intelligence Database
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {Object.entries(iocData.data.indicators || {}).map(([type, count]: [string, any]) => (
              <div key={type} className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {count.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {type.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total IOCs: {iocData.data.total_iocs?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              New today: {iocData.data.new_today?.toLocaleString() || 0}
            </div>
          </div>
        </motion.div>
      )}

      {/* Live Threats Table */}
      <DataTable
        title="Live Threat Detection"
        subtitle="Real-time security threats and intrusion attempts"
        data={allThreats}
        columns={threatsColumns}
        loading={threatsLoading}
        searchable={true}
        filterable={true}
        exportable={true}
        refreshable={true}
        onRefresh={refreshThreats}
        onRowClick={setSelectedThreat}
        pageSize={10}
      />

      {/* Security Policies */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <div className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Active Security Policies
          </h3>
          <div className="space-y-3">
            {[
              { name: 'Intrusion Prevention', status: 'Active', effectiveness: 98 },
              { name: 'Malware Detection', status: 'Active', effectiveness: 95 },
              { name: 'Anomaly Detection', status: 'Active', effectiveness: 92 },
              { name: 'Data Loss Prevention', status: 'Active', effectiveness: 89 },
              { name: 'Behavioral Analysis', status: 'Active', effectiveness: 87 },
            ].map((policy, index) => (
              <motion.div
                key={policy.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {policy.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {policy.effectiveness}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {policy.status}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            System Health Monitoring
          </h3>
          <div className="space-y-4">
            {[
              { component: 'Firewall', status: 'Operational', health: 100 },
              { component: 'IDS Engine', status: 'Active', health: 95 },
              { component: 'Threat Intelligence', status: 'Updating', health: 78 },
              { component: 'ML Models', status: 'Training', health: 88 },
              { component: 'Network Monitor', status: 'Active', health: 92 },
            ].map((component, index) => (
              <motion.div
                key={component.component}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>{component.component}</span>
                  <span className={
                    component.health >= 90 ? 'text-green-600 dark:text-green-400' :
                    component.health >= 75 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }>
                    {component.status}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${component.health}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: index * 0.1 }}
                    className={`h-2 rounded-full ${
                      component.health >= 90 ? 'bg-green-500' :
                      component.health >= 75 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Threat Details Modal */}
      {selectedThreat && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelectedThreat(null)}
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
                Threat Details
              </h3>
              <button
                onClick={() => setSelectedThreat(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Threat Type
                </label>
                <p className="text-gray-900 dark:text-white font-semibold">
                  {selectedThreat.type || selectedThreat.threat_type}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Severity
                </label>
                <p className="text-gray-900 dark:text-white font-semibold">
                  {selectedThreat.severity}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Source IP
                </label>
                <p className="text-gray-900 dark:text-white font-mono">
                  {selectedThreat.source_ip}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Confidence
                </label>
                <p className="text-gray-900 dark:text-white font-semibold">
                  {((selectedThreat.confidence || selectedThreat.confidence_score || 0) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            
            {selectedThreat.description && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Description
                </label>
                <p className="text-gray-900 dark:text-white">
                  {selectedThreat.description}
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Security;