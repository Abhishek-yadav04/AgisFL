import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Settings, 
  User, 
  Sun, 
  Moon, 
  Wifi, 
  WifiOff,
  RefreshCw,
  Zap,
  Shield,
  Activity,
  Brain,
  Target,
  Search,
  Command
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { clsx } from 'clsx';

const Header: React.FC = () => {
  const { 
    theme, 
    toggleTheme, 
    connectionStatus, 
    unreadNotificationsCount,
    activeFeatures,
    user
  } = useAppStore();

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting': return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      default: return <WifiOff className="w-4 h-4 text-red-500" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Connection Error';
      default: return 'Unknown';
    }
  };

  return (
    <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Search & Quick Actions */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search across all modules... (Ctrl+K)"
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">⌘</kbd>
                <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">K</kbd>
              </div>
            </div>
          </div>

          {/* Status Indicators & Actions */}
          <div className="flex items-center space-x-4">
            {/* Feature Status Indicators */}
            <div className="hidden lg:flex items-center space-x-3">
              {activeFeatures.realTimeMonitoring && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full">
                  <Activity className="w-3 h-3" />
                  <span className="text-xs font-medium">LIVE</span>
                </div>
              )}
              
              {activeFeatures.flTraining && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full">
                  <Brain className="w-3 h-3" />
                  <span className="text-xs font-medium">FL</span>
                </div>
              )}
              
              {activeFeatures.attackSimulation && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full">
                  <Target className="w-3 h-3" />
                  <span className="text-xs font-medium">SIM</span>
                </div>
              )}
            </div>

            {/* Connection Status */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              {getConnectionIcon()}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {getConnectionText()}
              </span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              {unreadNotificationsCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                >
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </motion.div>
              )}
            </button>

            {/* Settings */}
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* User Menu */}
            <div className="flex items-center space-x-3 pl-3 border-l border-gray-200 dark:border-gray-700">
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.name || 'Administrator'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role || 'System Admin'}
                </p>
              </div>
              <button className="relative">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-700"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;