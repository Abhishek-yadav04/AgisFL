import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Database,
  Monitor,
  Zap,
  Globe,
  Lock,
  Eye,
  RefreshCw,
  Save
} from 'lucide-react';
import { MetricCard } from '../components/Cards/MetricCard';
import { settingsAPI } from '../services/api';
import { useAppStore } from '../stores/appStore';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { 
    theme, 
    toggleTheme, 
    autoRefresh, 
    refreshInterval, 
    setAutoRefresh, 
    setRefreshInterval,
    performanceMode,
    setPerformanceMode,
    activeFeatures,
    toggleFeature
  } = useAppStore();

  const [settings, setSettings] = useState({
    theme: theme,
    notifications: {
      security_alerts: true,
      fl_updates: true,
      system_alerts: false,
      email_notifications: false,
    },
    security: {
      two_factor_auth: false,
      auto_lock: true,
      session_timeout: 30,
      password_policy: {
        min_length: 8,
        require_special: true,
        require_numbers: true,
        require_uppercase: true,
      }
    },
    monitoring: {
      real_time: autoRefresh,
      interval: refreshInterval / 1000,
      log_retention: 30,
      performance_tracking: true,
    },
    federated_learning: {
      auto_start: true,
      max_clients: 10,
      convergence_threshold: 0.95,
      privacy_level: 'high',
    },
    network: {
      packet_capture: true,
      max_packet_size: 1500,
      capture_interface: 'eth0',
      filter_rules: ['tcp', 'udp', 'icmp'],
    }
  });

  // Backend settings
  const { data: backendSettings, refetch: refetchSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsAPI.getSettings(),
  });

  const saveSettings = async () => {
    try {
      await settingsAPI.updateSettings(settings);
      
      // Update local store
      setAutoRefresh(settings.monitoring.real_time);
      setRefreshInterval(settings.monitoring.interval * 1000);
      
      toast.success('Settings saved successfully');
      refetchSettings();
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const resetToDefaults = () => {
    setSettings({
      ...settings,
      theme: 'dark',
      notifications: {
        security_alerts: true,
        fl_updates: true,
        system_alerts: false,
        email_notifications: false,
      },
      monitoring: {
        real_time: true,
        interval: 5,
        log_retention: 30,
        performance_tracking: true,
      }
    });
    toast.success('Settings reset to defaults');
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-700 via-gray-900 to-black dark:from-gray-100 dark:via-gray-300 dark:to-white bg-clip-text text-transparent">
            System Configuration
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Configure application preferences, security settings & system behavior
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          
          <button
            onClick={saveSettings}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </motion.div>

      {/* Settings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Active Features"
          value={Object.values(activeFeatures).filter(Boolean).length}
          subtitle="Enabled capabilities"
          icon={Zap}
          color="blue"
        />
        
        <MetricCard
          title="Security Level"
          value="High"
          subtitle="Current protection"
          icon={Shield}
          color="green"
        />
        
        <MetricCard
          title="Performance Mode"
          value={performanceMode.charAt(0).toUpperCase() + performanceMode.slice(1)}
          subtitle="System optimization"
          icon={Monitor}
          color="purple"
        />
        
        <MetricCard
          title="Auto Refresh"
          value={autoRefresh ? 'Enabled' : 'Disabled'}
          subtitle={`${refreshInterval / 1000}s interval`}
          icon={RefreshCw}
          color="cyan"
        />
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Preferences */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              User Preferences
            </h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <select 
                value={settings.theme}
                onChange={(e) => {
                  setSettings({ ...settings, theme: e.target.value as any });
                  if (e.target.value !== theme) toggleTheme();
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Performance Mode
              </label>
              <select 
                value={performanceMode}
                onChange={(e) => setPerformanceMode(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="high">High Performance</option>
                <option value="balanced">Balanced</option>
                <option value="power-save">Power Save</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Refresh Interval
              </label>
              <select 
                value={settings.monitoring.interval}
                onChange={(e) => {
                  const interval = parseInt(e.target.value);
                  setSettings({ 
                    ...settings, 
                    monitoring: { ...settings.monitoring, interval }
                  });
                  setRefreshInterval(interval * 1000);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1 second</option>
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
                <option value={30}>30 seconds</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl">
              <Bell className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
          </div>
          
          <div className="space-y-4">
            {Object.entries(settings.notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {key.replace('_', ' ')}
                </span>
                <input 
                  type="checkbox" 
                  checked={value}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      [key]: e.target.checked
                    }
                  })}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Security Settings */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-xl">
              <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Security Settings
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Two-Factor Authentication
              </span>
              <input 
                type="checkbox" 
                checked={settings.security.two_factor_auth}
                onChange={(e) => setSettings({
                  ...settings,
                  security: {
                    ...settings.security,
                    two_factor_auth: e.target.checked
                  }
                })}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Auto-lock Session
              </span>
              <input 
                type="checkbox" 
                checked={settings.security.auto_lock}
                onChange={(e) => setSettings({
                  ...settings,
                  security: {
                    ...settings.security,
                    auto_lock: e.target.checked
                  }
                })}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Session Timeout (minutes)
              </label>
              <input 
                type="number" 
                value={settings.security.session_timeout}
                onChange={(e) => setSettings({
                  ...settings,
                  security: {
                    ...settings.security,
                    session_timeout: parseInt(e.target.value)
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Monitoring Settings */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
              <Monitor className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Monitoring Settings
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Real-time Monitoring
              </span>
              <input 
                type="checkbox" 
                checked={settings.monitoring.real_time}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    monitoring: {
                      ...settings.monitoring,
                      real_time: e.target.checked
                    }
                  });
                  setAutoRefresh(e.target.checked);
                }}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Performance Tracking
              </span>
              <input 
                type="checkbox" 
                checked={settings.monitoring.performance_tracking}
                onChange={(e) => setSettings({
                  ...settings,
                  monitoring: {
                    ...settings.monitoring,
                    performance_tracking: e.target.checked
                  }
                })}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Log Retention (days)
              </label>
              <input 
                type="number" 
                value={settings.monitoring.log_retention}
                onChange={(e) => setSettings({
                  ...settings,
                  monitoring: {
                    ...settings.monitoring,
                    log_retention: parseInt(e.target.value)
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </motion.div>

        {/* FL Settings */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
              <Database className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Federated Learning
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Auto-start Training
              </span>
              <input 
                type="checkbox" 
                checked={settings.federated_learning.auto_start}
                onChange={(e) => setSettings({
                  ...settings,
                  federated_learning: {
                    ...settings.federated_learning,
                    auto_start: e.target.checked
                  }
                })}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Clients
              </label>
              <input 
                type="number" 
                value={settings.federated_learning.max_clients}
                onChange={(e) => setSettings({
                  ...settings,
                  federated_learning: {
                    ...settings.federated_learning,
                    max_clients: parseInt(e.target.value)
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Privacy Level
              </label>
              <select 
                value={settings.federated_learning.privacy_level}
                onChange={(e) => setSettings({
                  ...settings,
                  federated_learning: {
                    ...settings.federated_learning,
                    privacy_level: e.target.value
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Network Settings */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-cyan-100 dark:bg-cyan-900/20 rounded-xl">
              <Globe className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Network Configuration
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Packet Capture
              </span>
              <input 
                type="checkbox" 
                checked={settings.network.packet_capture}
                onChange={(e) => setSettings({
                  ...settings,
                  network: {
                    ...settings.network,
                    packet_capture: e.target.checked
                  }
                })}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Capture Interface
              </label>
              <input 
                type="text" 
                value={settings.network.capture_interface}
                onChange={(e) => setSettings({
                  ...settings,
                  network: {
                    ...settings.network,
                    capture_interface: e.target.value
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Packet Size (bytes)
              </label>
              <input 
                type="number" 
                value={settings.network.max_packet_size}
                onChange={(e) => setSettings({
                  ...settings,
                  network: {
                    ...settings.network,
                    max_packet_size: parseInt(e.target.value)
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Feature Toggles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Feature Controls
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(activeFeatures).map(([feature, enabled]) => (
            <motion.div
              key={feature}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                enabled 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
              }`}
              onClick={() => toggleFeature(feature as keyof typeof activeFeatures)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-3 h-3 rounded-full ${
                  enabled ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {enabled ? 'ON' : 'OFF'}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {feature.replace(/([A-Z])/g, ' $1').trim()}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Backend Configuration */}
      {backendSettings?.data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Backend Configuration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(backendSettings.data.settings || {}).map(([section, config]: [string, any]) => (
              <div key={section} className="space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                  {section.replace('_', ' ')}
                </h4>
                <div className="space-y-2">
                  {typeof config === 'object' && config !== null ? (
                    Object.entries(config).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 capitalize">
                          {key.replace('_', ' ')}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {typeof value === 'boolean' ? (value ? 'Enabled' : 'Disabled') : String(value)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Value</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {String(config)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Settings;