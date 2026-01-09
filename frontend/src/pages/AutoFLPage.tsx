import React from 'react';
import { Brain, Cpu, Gauge, Network } from 'lucide-react';
import AutoFLEngine from '../components/autonomous/AutoFLEngine';

const AutoFLPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Brain className="h-12 w-12 text-cyan-400 mr-4" />
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              AgisFL Autonomous Engine
            </h1>
          </div>
          <p className="text-xl text-indigo-300 max-w-3xl mx-auto">
            Next-generation autonomous federated learning with neural architecture search,
            hyperparameter optimization, and concept drift monitoring
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 rounded-xl p-6 border border-cyan-500/30">
            <Cpu className="h-8 w-8 text-cyan-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">FedNAS</h3>
            <p className="text-cyan-300 text-sm">Federated Neural Architecture Search for optimal model structures</p>
          </div>

          <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30">
            <Gauge className="h-8 w-8 text-purple-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">FedHPO</h3>
            <p className="text-purple-300 text-sm">Hyperparameter optimization across federated environments</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-900/50 to-teal-900/50 rounded-xl p-6 border border-emerald-500/30">
            <Network className="h-8 w-8 text-emerald-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Drift Monitor</h3>
            <p className="text-emerald-300 text-sm">Real-time concept drift detection and adaptation</p>
          </div>

          <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 rounded-xl p-6 border border-orange-500/30">
            <Brain className="h-8 w-8 text-orange-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Auto-Retrain</h3>
            <p className="text-orange-300 text-sm">Autonomous retraining orchestration and management</p>
          </div>
        </div>

        {/* Main AutoFL Engine Component */}
        <div>
          <AutoFLEngine />
        </div>
      </div>
    </div>
  );
};

export default AutoFLPage;
