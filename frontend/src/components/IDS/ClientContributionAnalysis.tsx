import React from 'react';
import { motion } from 'framer-motion';
import { Users, AlertTriangle, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { ClientContribution } from '../../hooks/useFLMetrics';

interface ClientContributionAnalysisProps {
  contributions: ClientContribution[];
}

const ClientContributionAnalysis: React.FC<ClientContributionAnalysisProps> = ({ contributions }) => {
  // Use demo data if no contributions provided
  const displayContributions = contributions.length > 0 ? contributions : [
    {
      client_id: 'Hospital_A',
      contribution_score: 85.2,
      data_quality: 0.92,
      model_updates: 45,
      anomaly_score: 0.05,
      is_malicious: false,
      trust_score: 0.87,
      quarantined: false,
      gradient_norm: 0.8,
      cosine_similarity: 0.95
    },
    {
      client_id: 'Research_Lab',
      contribution_score: 78.9,
      data_quality: 0.88,
      model_updates: 38,
      anomaly_score: 0.12,
      is_malicious: false,
      trust_score: 0.82,
      quarantined: false,
      gradient_norm: 1.2,
      cosine_similarity: 0.89
    },
    {
      client_id: 'Suspicious_Node',
      contribution_score: 23.1,
      data_quality: 0.45,
      model_updates: 12,
      anomaly_score: 0.78,
      is_malicious: true,
      trust_score: 0.15,
      quarantined: true,
      gradient_norm: 2.8,
      cosine_similarity: 0.32
    }
  ];
  
  const maliciousClients = displayContributions.filter(c => c.is_malicious);
  const quarantinedClients = displayContributions.filter(c => c.quarantined);
  const topContributors = displayContributions
    .filter(c => !c.is_malicious)
    .sort((a, b) => b.contribution_score - a.contribution_score)
    .slice(0, 5);

  return (
    <div className="glass-dark rounded-2xl p-6 shadow-2xl border border-gray-700/50">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
        <Users className="h-5 w-5 mr-3 text-blue-400" />
        Client Contribution Analysis
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Malicious Clients Alert */}
        {maliciousClients.length > 0 && (
          <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4">
            <div className="flex items-center mb-3">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-400 font-semibold">Malicious Clients Detected</span>
            </div>
            {maliciousClients.map((client, index) => (
              <motion.div
                key={client.client_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between py-2 border-b border-red-700/30 last:border-b-0"
              >
                <span className="text-white text-sm">{client.client_id}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-red-400 text-xs">
                    Anomaly: {(client.anomaly_score * 100).toFixed(1)}%
                  </span>
                  <XCircle className="h-4 w-4 text-red-400" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Top Contributors */}
        <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-4">
          <div className="flex items-center mb-3">
            <TrendingUp className="h-5 w-5 text-green-400 mr-2" />
            <span className="text-green-400 font-semibold">Top Contributors</span>
          </div>
          {topContributors.map((client, index) => (
            <motion.div
              key={client.client_id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between py-2 border-b border-green-700/30 last:border-b-0"
            >
              <span className="text-white text-sm">{client.client_id}</span>
              <div className="flex items-center space-x-2">
                <span className="text-green-400 text-xs">
                  Trust: {client.trust_score.toFixed(2)}
                </span>
                <CheckCircle className="h-4 w-4 text-green-400" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center p-3 bg-gray-900/30 rounded-lg">
          <div className="text-2xl font-bold text-white">{displayContributions.length}</div>
          <div className="text-gray-400 text-sm">Total Clients</div>
        </div>
        <div className="text-center p-3 bg-red-900/30 rounded-lg">
          <div className="text-2xl font-bold text-red-400">{quarantinedClients.length}</div>
          <div className="text-gray-400 text-sm">Quarantined</div>
        </div>
        <div className="text-center p-3 bg-green-900/30 rounded-lg">
          <div className="text-2xl font-bold text-green-400">
            {displayContributions.length > 0 ? (displayContributions.filter(c => c.trust_score > 0.7).length / displayContributions.length * 100).toFixed(1) : '0.0'}%
          </div>
          <div className="text-gray-400 text-sm">High Trust</div>
        </div>
      </div>
    </div>
  );
};

export default ClientContributionAnalysis;