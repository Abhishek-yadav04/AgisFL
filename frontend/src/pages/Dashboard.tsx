import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Shield, Network, Server, Cpu, HardDrive,
  RefreshCw, Download, Bell, ArrowUp, ArrowDown, TrendingUp, TrendingDown,
  BarChart3, Clock, Maximize2, CheckCircle, XCircle,
  Globe, Target, Play, Pause, Eye, Lock, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatNumber, formatBytes } from '../services/realTimeApi';
import { useSystemMetrics } from '../hooks/useSystemMetrics';
import { useIDSMetrics } from '../hooks/useIDSMetrics';
import { useFLMetrics } from '../hooks/useFLMetrics';
import { useSecurityAlerts } from '../hooks/useSecurityAlerts';
import AttackClassification from '../components/IDS/AttackClassification';
import ClientContributionAnalysis from '../components/IDS/ClientContributionAnalysis';
import ModelDriftMonitor from '../components/IDS/ModelDriftMonitor';
import AnomalyVisualization from '../components/IDS/AnomalyVisualization';
import ThreatChart from '../components/Charts/ThreatChart';

interface AlertItem {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
  gradient: string;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
}

const Dashboard: React.FC = () => {
  // Use custom hooks for data management
  const { metrics: systemMetrics, dashboardData, loading: systemLoading, error: systemError, refetch: refetchSystem } = useSystemMetrics();
  const { metrics: idsMetrics, threats, networkAnalysis, isLiveFeedConnected, loading: idsLoading, startMonitoring, stopMonitoring } = useIDSMetrics();
  const { metrics: flMetrics, clientContributions, modelDrift, loading: flLoading, startTraining, stopTraining } = useFLMetrics();
  const { addAlert } = useSecurityAlerts();
  
  // UI state
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [chartType, setChartType] = useState('line');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  // Privacy status for DP epsilon/delta and budget usage
  type PrivacyStatus = {
    differential_privacy?: {
      enabled?: boolean;
      epsilon?: number;
      delta?: number;
      privacy_budget_used?: number;
      privacy_budget_remaining?: number;
    }
  } | null;
  const [privacyStatus, setPrivacyStatus] = useState<PrivacyStatus>(null);

  const fetchPrivacyStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/privacy/status');
      if (res.ok) {
        const data = await res.json();
        setPrivacyStatus(data);
      }
    } catch (e) {
      // non-fatal for dashboard
      console.warn('Failed to fetch privacy status');
    }
  }, []);

  useEffect(() => {
    fetchPrivacyStatus();
  }, [fetchPrivacyStatus]);

  const formatDelta = (v?: number) => {
    if (v === undefined || v === null) return '—';
    // Show small deltas in scientific notation
    return v < 0.001 ? v.toExponential(0) : v.toString();
  };

  const isLoading = systemLoading || idsLoading || flLoading;
  const backendConnected = !systemError && idsMetrics?.status !== 'unavailable';

  // Get real-time insights from dashboard data
  const realTimeInsights = React.useMemo(() => {
    if (!dashboardData) return null;
    
    return {
      system_health: dashboardData.metrics?.system_health || { status: 'unknown' },
      security_status: dashboardData.metrics?.security || { threats_detected: 0, security_level: 'medium' },
      fl_status: dashboardData.federated_learning || { is_training: false, active_clients: 0 },
      performance: dashboardData.metrics?.performance || { requests_total: 0, throughput_rps: 0 },
      alerts: dashboardData.metrics?.alerts || { active_count: 0 }
    };
  }, [dashboardData]);

  // Initialize alerts and monitor for security events
  React.useEffect(() => {
    const alertsData = [
      {
        id: '1',
        type: 'success' as const,
        title: 'FL Training Completed',
        message: 'Round completed successfully with 94.2% accuracy',
        timestamp: new Date(Date.now() - 300000),
        read: false,
        priority: 'medium' as const
      },
      {
        id: '2',
        type: 'warning' as const,
        title: 'High CPU Usage',
        message: 'CPU usage exceeded 85% threshold for 5 minutes',
        timestamp: new Date(Date.now() - 600000),
        read: false,
        priority: 'high' as const
      }
    ];
    setAlerts(alertsData);
  }, []);

  // Monitor for critical security events
  React.useEffect(() => {
    if (threats.length > 2) {
      addAlert({
        type: 'critical',
        title: 'High Threat Activity',
        message: `${threats.length} active threats detected`,
        source: 'ids'
      });
    }
    
    const quarantinedCount = clientContributions.filter(c => c.quarantined).length;
    if (quarantinedCount > 0) {
      addAlert({
        type: 'high',
        title: 'Clients Quarantined',
        message: `${quarantinedCount} malicious clients quarantined`,
        source: 'fl'
      });
    }
    
    if (modelDrift?.auto_retrain_triggered) {
      addAlert({
        type: 'medium',
        title: 'Auto-Retraining Triggered',
        message: 'Critical model drift detected - retraining initiated',
        source: 'fl'
      });
    }
  }, [threats.length, clientContributions, modelDrift?.auto_retrain_triggered, addAlert]);

  const handleTrainingToggle = async () => {
    try {
      if (flMetrics?.is_training) {
        await stopTraining();
        toast.success('Training stopped');
      } else {
        await startTraining(10);
        toast.success('Training started');
      }
    } catch (error) {
      toast.error('Training control failed');
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Enhanced metric cards with real backend data
  const metricCards: MetricCard[] = useMemo(() => [
    {
      title: 'CPU Usage',
      value: systemMetrics?.cpu.percent ? formatNumber(systemMetrics.cpu.percent, 1) : '0.0',
      change: realTimeInsights?.system_health?.cpu_usage && systemMetrics?.cpu.percent 
        ? realTimeInsights.system_health.cpu_usage - systemMetrics.cpu.percent 
        : 0,
      changeType: realTimeInsights?.system_health?.cpu_usage && systemMetrics?.cpu.percent 
        ? (realTimeInsights.system_health.cpu_usage > systemMetrics.cpu.percent ? 'negative' : 'positive')
        : 'neutral',
      icon: Cpu,
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-500',
      description: `${systemMetrics?.cpu.count || 0} cores active`,
      trend: (systemMetrics?.cpu.percent || 0) > 70 ? 'up' : (systemMetrics?.cpu.percent || 0) < 30 ? 'down' : 'stable'
    },
    {
      title: 'Memory Usage',
      value: systemMetrics?.memory.percent ? formatNumber(systemMetrics.memory.percent, 1) : '0.0',
      change: realTimeInsights?.system_health?.memory_usage && systemMetrics?.memory.percent
        ? realTimeInsights.system_health.memory_usage - systemMetrics.memory.percent
        : 0,
      changeType: (systemMetrics?.memory.percent || 0) < 80 ? 'positive' : 'negative',
      icon: HardDrive,
      color: 'green',
      gradient: 'from-green-500 to-emerald-500',
      description: `${formatBytes(systemMetrics?.memory.used || 0)} / ${formatBytes(systemMetrics?.memory.total || 0)}`,
      trend: (systemMetrics?.memory.percent || 0) > 80 ? 'up' : 'stable'
    },
    {
      title: 'FL Round',
      value: flMetrics?.current_round || 0,
      change: flMetrics?.is_training ? 1 : 0,
      changeType: flMetrics?.is_training ? 'positive' : 'neutral',
      icon: Activity,
      color: 'purple',
      gradient: 'from-purple-500 to-pink-500',
      description: `${flMetrics?.active_clients || 0} clients participating`,
      trend: flMetrics?.is_training ? 'up' : 'stable'
    },
    {
      title: 'Threat Detection',
      value: realTimeInsights?.security_status?.security_level === 'high' ? '95%' : 
             realTimeInsights?.security_status?.security_level === 'medium' ? '75%' : '50%',
      change: realTimeInsights?.security_status?.threats_detected || 0,
      changeType: realTimeInsights?.security_status?.threats_detected > 0 ? 'negative' : 'positive',
      icon: Shield,
      color: 'red',
      gradient: 'from-red-500 to-orange-500',
      description: `${realTimeInsights?.security_status?.threats_detected || 0} threats detected`,
      trend: realTimeInsights?.security_status?.threats_detected > 0 ? 'up' : 'stable'
    }
  ], [systemMetrics, flMetrics, realTimeInsights]);

  const getHealthStatus = useMemo(() => {
    if (!systemMetrics && !realTimeInsights) return { status: 'unknown', color: 'gray', message: 'Loading...' };

    // Use real system health data if available
    if (realTimeInsights?.system_health?.status) {
      const status = realTimeInsights.system_health.status;
      if (status === 'healthy') return { status: 'excellent', color: 'green', message: 'System Healthy' };
      if (status === 'degraded') return { status: 'warning', color: 'orange', message: 'System Degraded' };
      if (status === 'critical') return { status: 'critical', color: 'red', message: 'Critical Issues' };
    }

    // Fallback to calculated health based on system metrics
    if (systemMetrics) {
      const avgUsage = (systemMetrics.cpu.percent + systemMetrics.memory.percent) / 2;
      if (avgUsage < 50) return { status: 'excellent', color: 'green', message: 'System Healthy' };
      if (avgUsage < 75) return { status: 'good', color: 'yellow', message: 'System Normal' };
      if (avgUsage < 90) return { status: 'warning', color: 'orange', message: 'High Usage' };
      return { status: 'critical', color: 'red', message: 'Critical Load' };
    }

    return { status: 'unknown', color: 'gray', message: 'Status Unknown' };
  }, [systemMetrics, realTimeInsights]);

  const unreadAlerts = alerts.filter(alert => !alert.read).length;
  const criticalAlerts = alerts.filter(alert => alert.priority === 'critical' && !alert.read).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl animate-float">
              <Activity className="h-12 w-12 text-white animate-pulse" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-pulse-glow"></div>
          </div>
          <div className="text-white text-3xl font-bold mb-4 gradient-text-blue">
            Loading Dashboard
          </div>
          <div className="text-blue-300 text-lg mb-6">Initializing real-time monitoring...</div>
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-8 scrollbar-thin">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header with Modern Design */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
        >
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl animate-float">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold gradient-text-blue mb-2">
                  Enterprise Dashboard
                </h1>
                <p className="text-gray-400 text-lg">Real-time federated learning & security monitoring</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-400" />
                <span className="text-blue-300 text-sm">Updated {new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  getHealthStatus.color === 'green' ? 'bg-green-400 shadow-lg shadow-green-400/50' :
                  getHealthStatus.color === 'yellow' ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' :
                  getHealthStatus.color === 'orange' ? 'bg-orange-400 shadow-lg shadow-orange-400/50' :
                  'bg-red-400 shadow-lg shadow-red-400/50'
                }`}></div>
                <span className={`text-sm font-medium ${
                  getHealthStatus.color === 'green' ? 'text-green-400' :
                  getHealthStatus.color === 'yellow' ? 'text-yellow-400' :
                  getHealthStatus.color === 'orange' ? 'text-orange-400' :
                  'text-red-400'
                }`}>
                  {getHealthStatus.message}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-green-400" />
                <span className="text-green-300 text-sm">
                  {realTimeInsights?.fl_status?.active_clients || flMetrics?.active_clients || 0} Global Clients
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isLiveFeedConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <span className={`text-sm ${isLiveFeedConnected ? 'text-green-300' : 'text-red-300'}`}>
                  Backend {backendConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 flex-wrap gap-3">
            {/* Time Range Selector */}
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="bg-gray-800/70 border border-gray-600/50 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all hover:bg-gray-700/70"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>

            {/* Alerts Button with Enhanced Design */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAlerts(!showAlerts)}
              className="relative bg-gray-800/70 hover:bg-gray-700/70 border border-gray-600/50 rounded-xl p-3 transition-all group focus-ring"
            >
              <Bell className="h-5 w-5 text-gray-300 group-hover:text-white transition-colors" />
              {unreadAlerts > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute -top-2 -right-2 text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold ${
                    criticalAlerts > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500 text-white'
                  }`}
                >
                  {unreadAlerts}
                </motion.span>
              )}
            </motion.button>

            {/* Refresh Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                refetchSystem();
                fetchPrivacyStatus();
                toast.success('Data refreshed');
              }}
              className="bg-blue-600/70 hover:bg-blue-700/70 border border-blue-500/50 rounded-xl p-3 transition-all group focus-ring"
            >
              <RefreshCw className="h-5 w-5 text-white group-hover:rotate-180 transition-transform duration-300" />
            </motion.button>

            {/* Export Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-green-600/70 hover:bg-green-700/70 border border-green-500/50 rounded-xl px-4 py-3 text-white text-sm transition-all flex items-center space-x-2 focus-ring"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Enhanced Alerts Panel */}
        <AnimatePresence>
          {showAlerts && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-dark rounded-2xl p-6 shadow-2xl border border-gray-700/50"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Bell className="h-5 w-5 mr-3 text-yellow-400" />
                  System Alerts ({unreadAlerts} unread)
                </h3>
                <button
                  onClick={() => setShowAlerts(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
                {alerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`p-4 rounded-xl border-l-4 hover-lift cursor-pointer ${
                      alert.type === 'error' ? 'border-red-500 bg-red-900/20 hover:bg-red-900/30' :
                      alert.type === 'warning' ? 'border-yellow-500 bg-yellow-900/20 hover:bg-yellow-900/30' :
                      alert.type === 'success' ? 'border-green-500 bg-green-900/20 hover:bg-green-900/30' :
                      'border-blue-500 bg-blue-900/20 hover:bg-blue-900/30'
                    } ${!alert.read ? 'ring-2 ring-blue-500/30' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-white font-medium">{alert.title}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            alert.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                            alert.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            alert.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {alert.priority}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{alert.message}</p>
                        <p className="text-gray-400 text-xs">{alert.timestamp.toLocaleTimeString()}</p>
                      </div>
                      {!alert.read && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="w-2 h-2 bg-blue-400 rounded-full"
                        />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced System Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricCards.map((card) => (
            <div
              key={card.title}
              className={`group relative overflow-hidden bg-gradient-to-br ${card.gradient} rounded-2xl p-6 shadow-2xl hover:shadow-lg transition-shadow duration-200 cursor-pointer`}
            >
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <card.icon className="h-8 w-8 text-white" />
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-white/70 bg-white/20 px-2 py-1 rounded-full">LIVE</span>
                    {card.trend && (
                      <div className={`flex items-center space-x-1 ${
                        card.trend === 'up' ? 'text-green-300' :
                        card.trend === 'down' ? 'text-red-300' : 'text-yellow-300'
                      }`}>
                        {card.trend === 'up' ? <TrendingUp className="h-3 w-3" /> :
                         card.trend === 'down' ? <TrendingDown className="h-3 w-3" /> :
                         <Target className="h-3 w-3" />}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {card.value}{typeof card.value === 'string' && card.value.includes('%') ? '' : card.title === 'FL Round' ? '' : '%'}
                </div>
                <div className="text-white/80 text-sm font-medium mb-3">{card.title}</div>

                {card.description && (
                  <div className="text-white/60 text-xs mb-3">{card.description}</div>
                )}

                {card.change !== undefined && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">vs last hour</span>
                    <div className={`flex items-center space-x-1 ${
                      card.changeType === 'positive' ? 'text-green-300' :
                      card.changeType === 'negative' ? 'text-red-300' : 'text-yellow-300'
                    }`}>
                      {card.changeType === 'positive' ? <ArrowUp className="h-3 w-3" /> :
                       card.changeType === 'negative' ? <ArrowDown className="h-3 w-3" /> :
                       <Target className="h-3 w-3" />}
                      <span>{Math.abs(card.change)}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* IDS-Specific Components - Always Show */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <AttackClassification threats={threats || []} />
          <AnomalyVisualization networkAnalysis={networkAnalysis || {}} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <ClientContributionAnalysis contributions={clientContributions || []} />
          <ModelDriftMonitor modelDrift={modelDrift} />
        </div>

        {/* Federated Learning Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-dark rounded-2xl p-6 shadow-2xl border border-gray-700/50">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Activity className="h-5 w-5 mr-3 text-green-400" />
              Federated Learning Status
            </h3>
            <div className="space-y-6">
              <div className={`flex items-center justify-between p-4 ${flMetrics?.is_training ? 'bg-green-900/20 border-green-700/50' : 'bg-yellow-900/20 border-yellow-700/50'} border rounded-xl hover-lift`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 ${flMetrics?.is_training ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 'bg-yellow-400 shadow-lg shadow-yellow-400/50'} rounded-full`}></div>
                  <div>
                    <div className="text-white font-semibold">
                      {backendConnected ? (flMetrics?.is_training ? 'Training Active' : 'Training Paused') : 'Backend Offline'}
                    </div>
                    <div className={`${flMetrics?.is_training ? 'text-green-300' : 'text-yellow-300'} text-sm`}>
                      {backendConnected ? `Round ${flMetrics?.current_round || 0} of ${flMetrics?.total_rounds || 0}` : 'Connection Lost'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">
                    {backendConnected ? formatNumber((flMetrics?.global_accuracy || 0) * 100, 1) : '0.0'}%
                  </div>
                  <div className="text-green-300 text-sm">Accuracy</div>
                </div>
              </div>

              {/* Privacy Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-xl hover-lift">
                  <div className="flex items-center space-x-2 mb-2">
                    <Eye className="h-4 w-4 text-blue-400" />
                    <span className="text-blue-300 text-sm font-medium">Differential Privacy</span>
                  </div>
                  <div className={`text-sm ${flMetrics?.differential_privacy ? 'text-green-400' : 'text-red-400'}`}>
                    {backendConnected ? (flMetrics?.differential_privacy ? 'Active' : 'Inactive') : 'Unknown'}
                  </div>
                  <div className="text-xs text-blue-400 mt-1 space-y-0.5">
                    {(() => {
                      const used = privacyStatus?.differential_privacy?.privacy_budget_used ?? undefined;
                      const remaining = privacyStatus?.differential_privacy?.privacy_budget_remaining ?? undefined;
                      const epsilon = privacyStatus?.differential_privacy?.epsilon ?? undefined;
                      const delta = privacyStatus?.differential_privacy?.delta ?? undefined;
                      const percent = (typeof used === 'number' && typeof remaining === 'number' && (used + remaining) > 0)
                        ? (remaining / (used + remaining)) * 100
                        : undefined;
                      return (
                        <>
                          <div>
                            Privacy Budget: {percent !== undefined ? `${formatNumber(percent, 1)}%` : '—'}
                          </div>
                          <div>
                            ε = {epsilon !== undefined ? formatNumber(epsilon, 2) : '—'}, δ = {formatDelta(delta)}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="p-4 bg-purple-900/20 border border-purple-700/50 rounded-xl hover-lift">
                  <div className="flex items-center space-x-2 mb-2">
                    <Lock className="h-4 w-4 text-purple-400" />
                    <span className="text-purple-300 text-sm font-medium">Secure Aggregation</span>
                  </div>
                  <div className={`text-sm ${flMetrics?.secure_aggregation ? 'text-green-400' : 'text-red-400'}`}>
                    {backendConnected ? (flMetrics?.secure_aggregation ? 'Active' : 'Inactive') : 'Unknown'}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTrainingToggle}
                  disabled={!backendConnected}
                  className={`flex-1 ${
                    !backendConnected ? 'bg-gray-600 cursor-not-allowed' :
                    flMetrics?.is_training ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
                  } text-white py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-xl focus-ring`}
                >
                  {flMetrics?.is_training ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span>
                    {!backendConnected ? 'Backend Offline' :
                     flMetrics?.is_training ? 'Stop Training' : 'Start Training'}
                  </span>
                </motion.button>
              </div>
            </div>
          </div>

          {/* IDS Security Status */}
          <div className="glass-dark rounded-2xl p-6 shadow-2xl border border-gray-700/50">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Network className="h-5 w-5 mr-3 text-red-400" />
              Intrusion Detection System
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-900/20 border border-red-700/50 rounded-xl hover-lift">
                <div>
                  <div className="text-white font-semibold">IDS Engine</div>
                  <div className={`text-sm ${idsMetrics?.engine_status?.is_running ? 'text-green-400' : 'text-red-400'}`}>
                    {idsMetrics?.engine_status?.is_running ? 'Active' : 'Stopped'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-400">
                    {idsMetrics?.detection_metrics?.total_packets_analyzed || 0}
                  </div>
                  <div className="text-blue-300 text-sm">Packets Analyzed</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-xl hover-lift">
                  <div className="text-2xl font-bold text-yellow-400">
                    {idsMetrics?.detection_metrics?.threats_detected || 0}
                  </div>
                  <div className="text-yellow-300 text-sm">Threats</div>
                </div>
                <div className="text-center p-4 bg-green-900/20 border border-green-700/50 rounded-xl hover-lift">
                  <div className="text-2xl font-bold text-green-400">
                    {((idsMetrics?.detection_metrics?.detection_accuracy || 0) * 100).toFixed(1)}%
                  </div>
                  <div className="text-green-300 text-sm">Accuracy</div>
                </div>
              </div>

              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    try {
                      if (idsMetrics?.engine_status?.is_running) {
                        await stopMonitoring();
                        toast.success('IDS monitoring stopped');
                      } else {
                        await startMonitoring();
                        toast.success('IDS monitoring started');
                      }
                    } catch (error) {
                      toast.error('IDS control failed');
                    }
                  }}
                  disabled={!backendConnected}
                  className={`flex-1 ${
                    !backendConnected ? 'bg-gray-600 cursor-not-allowed' :
                    idsMetrics?.engine_status?.is_running ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
                  } text-white py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-xl focus-ring`}
                >
                  {idsMetrics?.engine_status?.is_running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span>
                    {!backendConnected ? 'Backend Offline' :
                     idsMetrics?.engine_status?.is_running ? 'Stop Monitoring' : 'Start Monitoring'}
                  </span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* System Performance */}
        <div className="glass-dark rounded-2xl p-6 shadow-2xl border border-gray-700/50">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
            <Server className="h-5 w-5 mr-3 text-blue-400" />
            System Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CPU Progress */}
            <div className="hover-lift">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-300 font-medium">CPU Usage</span>
                <span className="text-blue-400 font-semibold">
                  {systemMetrics?.cpu.percent ? formatNumber(systemMetrics.cpu.percent, 1) : '0.0'}%
                </span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${systemMetrics?.cpu.percent || 0}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full relative"
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                </motion.div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{systemMetrics?.cpu.count || 0} cores</span>
                <span className={backendConnected ? 'text-green-400' : 'text-red-400'}>
                  {backendConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Memory Progress */}
            <div className="hover-lift">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-300 font-medium">Memory Usage</span>
                <span className="text-green-400 font-semibold">
                  {systemMetrics?.memory.percent ? formatNumber(systemMetrics.memory.percent, 1) : '0.0'}%
                </span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${systemMetrics?.memory.percent || 0}%` }}
                  transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full relative"
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                </motion.div>
              </div>
              <div className="text-xs text-gray-400">
                {formatBytes(systemMetrics?.memory.used || 0)} / {formatBytes(systemMetrics?.memory.total || 0)}
              </div>
            </div>

            {/* Disk Progress */}
            <div className="hover-lift">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-300 font-medium">Disk Usage</span>
                <span className="text-purple-400 font-semibold">
                  {systemMetrics?.disk.percent ? formatNumber(systemMetrics.disk.percent, 1) : '0.0'}%
                </span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${systemMetrics?.disk.percent || 0}%` }}
                  transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full relative"
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                </motion.div>
              </div>
              <div className="text-xs text-gray-400">
                {formatBytes(systemMetrics?.disk.used || 0)} / {formatBytes(systemMetrics?.disk.total || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Threat Analysis Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ThreatChart 
            data={threats.map((threat) => ({
              timestamp: new Date(threat.timestamp).toLocaleTimeString(),
              threats: 1,
              packets: Math.floor(Math.random() * 100),
              critical: threat.severity === 'Critical' ? 1 : 0,
              high: threat.severity === 'High' ? 1 : 0,
              medium: threat.severity === 'Medium' ? 1 : 0,
              low: threat.severity === 'Low' ? 1 : 0
            })).slice(-10)}
            type="severity"
            title="Threat Severity Timeline"
            showSeverity={true}
          />
          <ThreatChart 
            data={Array.from({ length: 10 }, (_, i) => ({
              timestamp: new Date(Date.now() - (9 - i) * 60000).toLocaleTimeString(),
              threats: Math.floor(Math.random() * 20),
              packets: Math.floor(Math.random() * 1000)
            }))}
            type="area"
            title="Network Traffic vs Threats"
          />
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* System Performance Chart */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-dark rounded-2xl p-6 shadow-2xl border border-gray-700/50 hover-lift"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">System Performance</h3>
                <p className="text-slate-400 text-sm">Real-time resource monitoring</p>
              </div>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setChartType(chartType === 'line' ? 'area' : 'line')}
                  className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-colors duration-200 focus-ring"
                >
                  <BarChart3 className="h-4 w-4 text-slate-400" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleFullscreen}
                  className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-colors duration-200 focus-ring"
                >
                  <Maximize2 className="h-4 w-4 text-slate-400" />
                </motion.button>
              </div>
            </div>

            {/* Chart Container */}
            <div className="h-80 bg-slate-900/30 rounded-xl p-4 border border-slate-700/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-slate-300">CPU ({systemMetrics?.cpu.percent?.toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-slate-300">Memory ({systemMetrics?.memory.percent?.toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                    <span className="text-slate-300">Network</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Updated: {new Date().toLocaleTimeString()}</span>
                  <span className={`px-2 py-1 rounded-full ${
                    threats.length > 5 ? 'bg-red-500/20 text-red-400' :
                    threats.length > 2 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {threats.length} Active Threats
                  </span>
                </div>
              </div>

            {/* Enhanced Chart Visualization */}
            <div className="relative h-48 flex items-end justify-between space-x-1">
              {Array.from({ length: 20 }, (_, i) => (
                <motion.div
                  key={i}
                  className="flex flex-col items-center space-y-1 flex-1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {/* CPU Bar - Real Data */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(2, (systemMetrics?.cpu.percent || realTimeInsights?.system_health?.cpu_usage || Math.random() * 100))}%` }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-sm opacity-80 hover:opacity-100 transition-all duration-300 cursor-pointer"
                    style={{ maxHeight: '60px' }}
                    whileHover={{ scale: 1.1 }}
                  />
                  {/* Memory Bar - Real Data */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(2, (systemMetrics?.memory.percent || realTimeInsights?.system_health?.memory_usage || Math.random() * 80))}%` }}
                    transition={{ duration: 0.5, delay: i * 0.05 + 0.1 }}
                    className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-sm opacity-80 hover:opacity-100 transition-all duration-300 cursor-pointer"
                    style={{ maxHeight: '50px' }}
                    whileHover={{ scale: 1.1 }}
                  />
                  {/* Network Bar - Based on connections */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(2, Math.min(60, (systemMetrics?.connections || 0) / 2))}%` }}
                    transition={{ duration: 0.5, delay: i * 0.05 + 0.2 }}
                    className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-sm opacity-80 hover:opacity-100 transition-all duration-300 cursor-pointer"
                    style={{ maxHeight: '40px' }}
                    whileHover={{ scale: 1.1 }}
                  />
                </motion.div>
              ))}
            </div>              {/* Time labels */}
              <div className="flex justify-between text-xs text-slate-500 mt-4">
                <span>-10min</span>
                <span>-5min</span>
                <span>Now</span>
              </div>
            </div>
          </motion.div>

          {/* Real-time Monitoring Dashboard */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-dark rounded-2xl p-6 shadow-2xl border border-gray-700/50 hover-lift"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Real-time Monitoring</h3>
                <p className="text-indigo-400 text-sm">Live system health & performance</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${backendConnected ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 'bg-red-400 animate-pulse shadow-lg shadow-red-400/50'}`}></div>
                <span className={`text-sm ${backendConnected ? 'text-green-300' : 'text-red-300'}`}>
                  {backendConnected ? 'All Systems Operational' : 'Backend Disconnected'}
                </span>
              </div>
            </div>

            {/* Health Status Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-indigo-900/30 rounded-xl p-4 border border-indigo-700/30 hover-lift">
                <div className="flex items-center justify-between">
                  <span className="text-indigo-300 text-sm">API Health</span>
                  {backendConnected ?
                    <CheckCircle className="h-4 w-4 text-green-400" /> :
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  }
                </div>
                <div className="text-2xl font-bold text-white mt-2">{backendConnected ? '100' : '0'}%</div>
                <div className={`text-xs mt-1 ${backendConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {backendConnected ? 'Connected' : 'Disconnected'}
                </div>
              </div>

              <div className="bg-indigo-900/30 rounded-xl p-4 border border-indigo-700/30 hover-lift">
                <div className="flex items-center justify-between">
                  <span className="text-indigo-300 text-sm">IDS Engine</span>
                  {idsMetrics?.engine_status?.is_trained ?
                    <CheckCircle className="h-4 w-4 text-green-400" /> :
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  }
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  {idsMetrics?.engine_status?.is_trained ? '100' : '0'}%
                </div>
                <div className="text-xs text-blue-400 mt-1">
                  {idsMetrics?.engine_status?.is_trained ? 'Model Trained' : 'Training Required'}
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-indigo-300">Throughput</span>
                  <span className="text-white">
                    {realTimeInsights?.performance?.throughput_rps || 0} req/min
                  </span>
                </div>
                <div className="w-full bg-indigo-900/30 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (realTimeInsights?.performance?.throughput_rps || 0) / 30)}%` }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full relative"
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                  </motion.div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-indigo-300">Error Rate</span>
                  <span className="text-white">
                    {((realTimeInsights?.performance?.error_rate || 0) * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="w-full bg-indigo-900/30 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (realTimeInsights?.performance?.error_rate || 0) * 100 * 50)}%` }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-indigo-300">Load Average</span>
                  <span className="text-white">
                    {systemMetrics?.cpu.percent ? (systemMetrics.cpu.percent / 100).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="w-full bg-indigo-900/30 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (systemMetrics?.cpu.percent || 0))}%` }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-400 rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Quick Stats with Real Data */}
            <div className="grid grid-cols-3 gap-2 mt-6 text-center">
              <div className="bg-gray-900/30 rounded-lg p-3 hover-lift">
                <div className="text-lg font-bold text-white">
                  {realTimeInsights?.fl_status?.active_clients || flMetrics?.active_clients || 0}
                </div>
                <div className="text-xs text-gray-400">Active Clients</div>
              </div>
              <div className="bg-gray-900/30 rounded-lg p-3 hover-lift">
                <div className="text-lg font-bold text-white">
                  {flMetrics?.current_round || 0}
                </div>
                <div className="text-xs text-gray-400">FL Rounds</div>
              </div>
              <div className="bg-gray-900/30 rounded-lg p-3 hover-lift">
                <div className="text-lg font-bold text-white">
                  {formatBytes(systemMetrics?.memory.used || 0)}
                </div>
                <div className="text-xs text-gray-400">Memory Used</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;