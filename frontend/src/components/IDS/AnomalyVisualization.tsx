import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Zap, TrendingUp, AlertTriangle } from 'lucide-react';

interface AnomalyVisualizationProps {
  networkAnalysis: any;
}

const AnomalyVisualization: React.FC<AnomalyVisualizationProps> = ({ networkAnalysis }) => {
  // Use demo data if no real data available
  const analysisData = networkAnalysis?.anomaly_detection ? networkAnalysis : {
    traffic_patterns: {
      normal_traffic: 87.3,
      suspicious_traffic: 11.2,
      malicious_traffic: 1.5
    },
    anomaly_detection: {
      anomalies_detected: 18,
      anomaly_types: {
        traffic_volume: 3,
        protocol_anomalies: 5,
        timing_patterns: 2,
        behavioral_anomalies: 8
      },
      confidence_levels: {
        high_confidence: 12,
        medium_confidence: 4,
        low_confidence: 2
      }
    }
  };

  const { anomaly_detection, traffic_patterns } = analysisData;

  const anomalyTypes = [
    { name: 'Traffic Volume', count: anomaly_detection.anomaly_types?.traffic_volume || 0, icon: TrendingUp, color: 'blue' },
    { name: 'Protocol Anomalies', count: anomaly_detection.anomaly_types?.protocol_anomalies || 0, icon: Zap, color: 'purple' },
    { name: 'Timing Patterns', count: anomaly_detection.anomaly_types?.timing_patterns || 0, icon: AlertTriangle, color: 'yellow' },
    { name: 'Behavioral', count: anomaly_detection.anomaly_types?.behavioral_anomalies || 0, icon: Eye, color: 'red' }
  ];

  const confidenceLevels = anomaly_detection.confidence_levels || {};

  return (
    <div className="glass-dark rounded-2xl p-6 shadow-2xl border border-gray-700/50">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
        <Eye className="h-5 w-5 mr-3 text-cyan-400" />
        Network Anomaly Visualization
      </h3>

      <div className="space-y-6">
        {/* Traffic Pattern Overview */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-900/20 border border-green-700/50 rounded-xl">
            <div className="text-2xl font-bold text-green-400">
              {traffic_patterns?.normal_traffic?.toFixed(1) || '0.0'}%
            </div>
            <div className="text-green-300 text-sm">Normal Traffic</div>
          </div>
          <div className="text-center p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-xl">
            <div className="text-2xl font-bold text-yellow-400">
              {traffic_patterns?.suspicious_traffic?.toFixed(1) || '0.0'}%
            </div>
            <div className="text-yellow-300 text-sm">Suspicious</div>
          </div>
          <div className="text-center p-4 bg-red-900/20 border border-red-700/50 rounded-xl">
            <div className="text-2xl font-bold text-red-400">
              {traffic_patterns?.malicious_traffic?.toFixed(1) || '0.0'}%
            </div>
            <div className="text-red-300 text-sm">Malicious</div>
          </div>
        </div>

        {/* Anomaly Types */}
        <div>
          <h4 className="text-white font-medium mb-4">Anomaly Types Detected</h4>
          <div className="grid grid-cols-2 gap-4">
            {anomalyTypes.map((anomaly, index) => {
              const Icon = anomaly.icon;
              const colorClasses = {
                blue: 'from-blue-500 to-cyan-500',
                purple: 'from-purple-500 to-pink-500',
                yellow: 'from-yellow-500 to-orange-500',
                red: 'from-red-500 to-red-600'
              };
              
              return (
                <motion.div
                  key={anomaly.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-gradient-to-br ${colorClasses[anomaly.color as keyof typeof colorClasses]} rounded-xl p-4 hover-lift`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="h-5 w-5 text-white" />
                    <span className="text-2xl font-bold text-white">{anomaly.count}</span>
                  </div>
                  <div className="text-white font-medium text-sm">{anomaly.name}</div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Confidence Levels */}
        <div>
          <h4 className="text-white font-medium mb-4">Detection Confidence</h4>
          <div className="space-y-3">
            {Object.entries(confidenceLevels).map(([level, count], index) => (
              <motion.div
                key={level}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between"
              >
                <span className="text-gray-300 capitalize">
                  {level.replace('_', ' ')}
                </span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-700/50 rounded-full h-2">
                    <div
                      className={`h-full rounded-full ${
                        level === 'high_confidence' ? 'bg-green-500' :
                        level === 'medium_confidence' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, (count as number) * 10)}%` }}
                    />
                  </div>
                  <span className="text-white font-semibold w-8">{String(count)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Total Anomalies */}
        <div className="text-center p-4 bg-gray-900/30 rounded-xl border border-gray-700/50">
          <div className="text-3xl font-bold text-cyan-400 mb-2">
            {anomaly_detection.anomalies_detected || 0}
          </div>
          <div className="text-gray-300">Total Anomalies Detected</div>
        </div>
      </div>
    </div>
  );
};

export default AnomalyVisualization;