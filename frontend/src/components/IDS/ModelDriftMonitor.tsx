import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { ModelDrift } from '../../hooks/useFLMetrics';

interface ModelDriftMonitorProps {
  modelDrift: ModelDrift | null;
}

const ModelDriftMonitor: React.FC<ModelDriftMonitorProps> = ({ modelDrift }) => {
  // Use demo data if no drift data available
  const displayDrift = modelDrift || {
    drift_detected: true,
    drift_magnitude: 0.35,
    affected_features: ['network_latency', 'packet_size', 'protocol_distribution'],
    recommendation: 'MEDIUM: Monitor closely and consider retraining',
    last_check: new Date().toISOString(),
    auto_retrain_triggered: false
  };

  const getDriftSeverity = (magnitude: number) => {
    if (magnitude > 0.7) return { level: 'Critical', color: 'red' };
    if (magnitude > 0.4) return { level: 'High', color: 'orange' };
    if (magnitude > 0.2) return { level: 'Medium', color: 'yellow' };
    return { level: 'Low', color: 'green' };
  };

  const severity = getDriftSeverity(displayDrift.drift_magnitude);

  return (
    <div className="glass-dark rounded-2xl p-6 shadow-2xl border border-gray-700/50">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
        <TrendingDown className="h-5 w-5 mr-3 text-purple-400" />
        Model Drift Monitor
      </h3>

      <div className="space-y-6">
        {/* Drift Status */}
        <div className={`p-4 rounded-xl border ${
          displayDrift.drift_detected 
            ? 'bg-red-900/20 border-red-700/50' 
            : 'bg-green-900/20 border-green-700/50'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              {displayDrift.drift_detected ? (
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              )}
              <span className={`font-semibold ${
                displayDrift.drift_detected ? 'text-red-400' : 'text-green-400'
              }`}>
                {displayDrift.drift_detected ? 'Drift Detected' : 'Model Stable'}
              </span>
            </div>
            <span className={`text-sm px-2 py-1 rounded-full ${
              severity.color === 'red' ? 'bg-red-500/20 text-red-400' :
              severity.color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
              severity.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              {severity.level}
            </span>
          </div>
          
          <div className="text-white/70 text-sm">
            {displayDrift.recommendation}
          </div>
          {displayDrift.auto_retrain_triggered && (
            <div className="mt-2 px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 text-xs">
              🔄 Auto-retraining initiated
            </div>
          )}
        </div>

        {/* Drift Magnitude */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Drift Magnitude</span>
            <span className="text-white font-semibold">
              {(displayDrift.drift_magnitude * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${displayDrift.drift_magnitude * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full bg-gradient-to-r ${
                severity.color === 'red' ? 'from-red-500 to-red-600' :
                severity.color === 'orange' ? 'from-orange-500 to-red-500' :
                severity.color === 'yellow' ? 'from-yellow-500 to-orange-500' :
                'from-green-500 to-emerald-500'
              }`}
            />
          </div>
        </div>

        {/* Affected Features */}
        {displayDrift.affected_features.length > 0 && (
          <div>
            <h4 className="text-white font-medium mb-3">Affected Features</h4>
            <div className="flex flex-wrap gap-2">
              {displayDrift.affected_features.map((feature, index) => (
                <motion.span
                  key={feature}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="px-3 py-1 bg-purple-900/30 border border-purple-700/50 rounded-full text-purple-300 text-sm"
                >
                  {feature}
                </motion.span>
              ))}
            </div>
          </div>
        )}

        {/* Last Check */}
        <div className="text-xs text-gray-400 text-center">
          Last checked: {new Date(displayDrift.last_check).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default ModelDriftMonitor;