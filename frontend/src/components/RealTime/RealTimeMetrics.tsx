/**
 * Real-Time Metrics Component - Displays live system metrics
 */

import { motion } from 'framer-motion';
import { 
  Activity, 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Network, 
  Users,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface RealTimeMetricsProps {
  data: any;
  className?: string;
}

const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({ data, className = '' }) => {
  const systemData = data?.system || {};
  const securityData = data?.security || {};
  const flData = data?.federated_learning || {};
  const healthData = data?.health || {};

  const metrics = [
    {
      title: 'CPU Usage',
      value: `${systemData.cpu_percent?.toFixed(1) || 0}%`,
      icon: Cpu,
      color: 'blue',
      trend: systemData.cpu_percent > 80 ? 'high' : systemData.cpu_percent > 60 ? 'medium' : 'low'
    },
    {
      title: 'Memory',
      value: `${systemData.memory_percent?.toFixed(1) || 0}%`,
      icon: MemoryStick,
      color: 'green',
      trend: systemData.memory_percent > 85 ? 'high' : systemData.memory_percent > 70 ? 'medium' : 'low'
    },
    {
      title: 'Disk Usage',
      value: `${systemData.disk_percent?.toFixed(1) || 0}%`,
      icon: HardDrive,
      color: 'purple',
      trend: systemData.disk_percent > 90 ? 'high' : systemData.disk_percent > 75 ? 'medium' : 'low'
    },
    {
      title: 'Network I/O',
      value: `${((systemData.network_bytes_sent || 0) / 1024 / 1024).toFixed(1)}MB`,
      icon: Network,
      color: 'yellow',
      trend: 'low'
    },
    {
      title: 'Active Threats',
      value: securityData.threats_detected || 0,
      icon: AlertTriangle,
      color: 'red',
      trend: (securityData.threats_detected || 0) > 0 ? 'high' : 'low'
    },
    {
      title: 'FL Clients',
      value: flData.active_clients || 0,
      icon: Users,
      color: 'cyan',
      trend: 'low'
    },
    {
      title: 'Uptime',
      value: systemData.uptime_formatted || '0h 0m',
      icon: Activity,
      color: 'emerald',
      trend: 'low'
    },
    {
      title: 'Health Status',
      value: healthData.healthy ? 'Healthy' : 'Issues',
      icon: healthData.healthy ? CheckCircle : AlertTriangle,
      color: healthData.healthy ? 'green' : 'red',
      trend: healthData.healthy ? 'low' : 'high'
    }
  ];

  const getColorClasses = (color: string, trend: string) => {
    const baseColors = {
      blue: 'from-blue-500 to-cyan-500',
      green: 'from-green-500 to-emerald-500',
      purple: 'from-purple-500 to-pink-500',
      yellow: 'from-yellow-500 to-orange-500',
      red: 'from-red-500 to-pink-500',
      cyan: 'from-cyan-500 to-blue-500',
      emerald: 'from-emerald-500 to-green-500'
    };

    const trendColors = {
      low: 'border-green-500/30 bg-green-900/10',
      medium: 'border-yellow-500/30 bg-yellow-900/10',
      high: 'border-red-500/30 bg-red-900/10'
    };

    return {
      gradient: baseColors[color as keyof typeof baseColors] || baseColors.blue,
      border: trendColors[trend as keyof typeof trendColors] || trendColors.low
    };
  };

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {metrics.map((metric, index) => {
        const colors = getColorClasses(metric.color, metric.trend);
        const Icon = metric.icon;
        
        return (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative p-4 rounded-xl border backdrop-blur-sm ${colors.border}`}
          >
            {/* Trend indicator */}
            <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
              metric.trend === 'high' ? 'bg-red-400 animate-pulse' :
              metric.trend === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
            }`} />
            
            {/* Icon */}
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors.gradient} flex items-center justify-center mb-3`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            
            {/* Content */}
            <div>
              <div className="text-2xl font-bold text-white mb-1">
                {metric.value}
              </div>
              <div className="text-sm text-gray-400">
                {metric.title}
              </div>
            </div>
            
            {/* Live indicator */}
            <div className="absolute bottom-2 right-2 flex items-center space-x-1">
              <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400">LIVE</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default RealTimeMetrics;