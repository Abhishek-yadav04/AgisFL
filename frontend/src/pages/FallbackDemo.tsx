import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Database, Network, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { getFallbackData } from '../services/fallbackData';

const FallbackDemo: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState('/api/privacy/status');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const endpoints = [
    { path: '/api/privacy/status', name: 'Privacy Status', icon: Shield },
    { path: '/api/privacy/budget', name: 'Privacy Budget', icon: Database },
    { path: '/api/dashboard/overview', name: 'Dashboard Overview', icon: Activity },
    { path: '/api/security/overview', name: 'Security Overview', icon: Network },
  ];

  const fetchFallbackData = async (endpoint: string) => {
    setLoading(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      const fallbackData = getFallbackData(endpoint);
      setData(fallbackData);
    } catch (error) {
      console.error('Error fetching fallback data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-4">
            Fallback Data Demo
          </h1>
          <p className="text-gray-400 text-lg">
            Demonstrating realistic fallback data when backend APIs are unavailable
          </p>
        </motion.div>

        {/* Endpoint Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Select API Endpoint</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {endpoints.map((endpoint) => {
              const Icon = endpoint.icon;
              return (
                <motion.button
                  key={endpoint.path}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedEndpoint(endpoint.path);
                    fetchFallbackData(endpoint.path);
                  }}
                  className={`p-4 rounded-xl border transition-all ${
                    selectedEndpoint === endpoint.path
                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                      : 'bg-gray-700/30 border-gray-600/50 text-gray-300 hover:bg-gray-600/30'
                  }`}
                >
                  <Icon className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">{endpoint.name}</div>
                  <div className="text-xs opacity-70 mt-1">{endpoint.path}</div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Status Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
              <span className="text-orange-300 font-medium">Backend Simulation Mode</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <span className="text-yellow-300 text-sm">Using Fallback Data</span>
            </div>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            This demo shows how the application gracefully handles API failures by providing realistic fallback data.
          </p>
        </motion.div>

        {/* Data Display */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 text-center"
          >
            <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-300">Loading fallback data...</p>
          </motion.div>
        ) : data ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Fallback Data Response</h2>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-green-300 text-sm">Data Available</span>
              </div>
            </div>
            
            {/* Highlight fallback indicator */}
            {data._fallback && (
              <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <span className="text-yellow-300 text-sm font-medium">Fallback Data Active</span>
                </div>
                <p className="text-yellow-200 text-xs mt-1">
                  This data is generated locally when the backend API is unavailable.
                </p>
              </div>
            )}

            <div className="bg-gray-900/50 rounded-lg p-4 overflow-auto max-h-96">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 text-center"
          >
            <Database className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Select an endpoint to view fallback data</p>
            <p className="text-gray-500 text-sm mt-2">
              Click on any endpoint above to see realistic fallback data in action
            </p>
          </motion.div>
        )}

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <Shield className="h-8 w-8 text-green-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Realistic Data</h3>
            <p className="text-gray-400 text-sm">
              Fallback data includes realistic values with proper data types and structures.
            </p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <Activity className="h-8 w-8 text-blue-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Dynamic Values</h3>
            <p className="text-gray-400 text-sm">
              Values include timestamps and slight variations to simulate real-time data.
            </p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <Network className="h-8 w-8 text-purple-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Seamless UX</h3>
            <p className="text-gray-400 text-sm">
              Users can continue using the application even when backend services are down.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FallbackDemo;