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
  Activity
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { clsx } from 'clsx';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ 
  title = "AgisFL Enterprise", 
  subtitle = "Advanced Federated Learning IDS Platform",
  actions 
}) => {
  const { 
    theme, 
    toggleTheme, 
    connectionStatus, 
    notifications,
    activeFeatures 
  } = useAppStore();

  const unreadCount = notifications.filter(n => !n.read).length;

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="w-4 h-4 text-green-400" />;
      case 'connecting': return <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />;
      default: return <WifiOff className="w-4 h-4 text-red-400" />;
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
    <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700/50 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Title Section */}
          <div className="flex-1">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                  {title}
                  <div className="flex items-center gap-2">
                    {activeFeatures.realTimeMonitoring && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded-full font-medium">
                        <Activity className="w-3 h-3" />
                        LIVE
                      </span>
                    )}
                    {activeFeatures.flTraining && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-medium">
                        <Brain className="w-3 h-3" />
                        FL
                      </span>
                    )}
                    {activeFeatures.attackSimulation && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs rounded-full font-medium">
                        <Target className="w-3 h-3" />
                        SIM
                      </span>
                    )}
                  </div>
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              {getConnectionIcon()}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {getConnectionText()}
              </span>
            </div>

            {/* Custom Actions */}
            {actions && (
              <div className="flex items-center space-x-2">
                {actions}
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.div>
              )}
            </button>

            {/* Settings */}
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* User Menu */}
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;