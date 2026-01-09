import React from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Zap, Bug, Target, Skull } from 'lucide-react';
import { ThreatData } from '../../hooks/useIDSMetrics';

interface AttackClassificationProps {
  threats: ThreatData[];
}

const AttackClassification: React.FC<AttackClassificationProps> = ({ threats }) => {
  // Use demo threats if none provided
  const displayThreats = threats.length > 0 ? threats : [
    {
      id: '1',
      type: 'brute_force',
      source_ip: '192.168.1.100',
      severity: 'High' as const,
      status: 'Detected' as const,
      timestamp: new Date().toISOString(),
      description: 'Multiple failed login attempts detected'
    },
    {
      id: '2',
      type: 'port_scan', 
      source_ip: '10.0.0.50',
      severity: 'Medium' as const,
      status: 'Blocked' as const,
      timestamp: new Date(Date.now() - 300000).toISOString(),
      description: 'Port scanning activity detected'
    },
    {
      id: '3',
      type: 'ddos',
      source_ip: '203.0.113.45',
      severity: 'Critical' as const,
      status: 'Investigating' as const,
      timestamp: new Date(Date.now() - 600000).toISOString(),
      description: 'DDoS attack detected'
    }
  ];
  
  const getAttackIcon = (type: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      'brute_force': Shield,
      'ddos': Zap,
      'malware': Bug,
      'port_scan': Target,
      'sql_injection': Skull,
      'default': AlertTriangle
    };
    return icons[type] || icons.default;
  };

  const getAttackColor = (severity: string) => {
    const colors: Record<string, string> = {
      'Critical': 'from-red-600 to-red-800',
      'High': 'from-orange-500 to-red-600',
      'Medium': 'from-yellow-500 to-orange-500',
      'Low': 'from-blue-500 to-cyan-500'
    };
    return colors[severity] || colors.Low;
  };

  const attackTypes = displayThreats.reduce((acc, threat) => {
    const type = threat.type || 'unknown';
    if (!acc[type]) {
      acc[type] = { count: 0, severity: threat.severity, latest: threat.timestamp };
    }
    acc[type].count++;
    return acc;
  }, {} as Record<string, { count: number; severity: string; latest: string }>);

  return (
    <div className="glass-dark rounded-2xl p-6 shadow-2xl border border-gray-700/50">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
        <Shield className="h-5 w-5 mr-3 text-red-400" />
        Attack Vector Classification
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(attackTypes).map(([type, data], index) => {
          const Icon = getAttackIcon(type);
          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-br ${getAttackColor(data.severity)} rounded-xl p-4 hover-lift`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className="h-6 w-6 text-white" />
                <span className="text-2xl font-bold text-white">{data.count}</span>
              </div>
              <div className="text-white font-medium capitalize mb-1">
                {type.replace('_', ' ')}
              </div>
              <div className="text-white/70 text-sm">
                {data.severity} severity
              </div>
              <div className="text-white/50 text-xs mt-2">
                Latest: {new Date(data.latest).toLocaleTimeString()}
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {Object.keys(attackTypes).length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No active threats detected</p>
        </div>
      )}
    </div>
  );
};

export default AttackClassification;