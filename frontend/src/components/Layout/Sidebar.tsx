import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Brain, 
  Shield, 
  Network, 
  Database, 
  FlaskConical,
  Settings,
  Activity,
  ChevronLeft,
  ChevronRight,
  Zap,
  Target,
  BarChart3,
  Users,
  Globe,
  Lock
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { clsx } from 'clsx';

const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar, theme, connectionStatus } = useAppStore();

  const navItems = [
    { 
      path: '/dashboard', 
      icon: LayoutDashboard, 
      label: 'Command Center',
      description: 'Real-time overview & metrics'
    },
    { 
      path: '/federated-learning', 
      icon: Brain, 
      label: 'FL Engine',
      description: 'Federated learning training'
    },
    { 
      path: '/security', 
      icon: Shield, 
      label: 'Security Center',
      description: 'Threat detection & response'
    },
    { 
      path: '/network', 
      icon: Network, 
      label: 'Network Monitor',
      description: 'Packet analysis & monitoring'
    },
    { 
      path: '/datasets', 
      icon: Database, 
      label: 'Data Management',
      description: 'Dataset upload & analysis'
    },
    { 
      path: '/research', 
      icon: FlaskConical, 
      label: 'Research Lab',
      description: 'ML experiments & algorithms'
    },
    { 
      path: '/integrations', 
      icon: Globe, 
      label: 'Integrations',
      description: 'External service connections'
    },
    { 
      path: '/advanced', 
      icon: Target, 
      label: 'Advanced Features',
      description: 'FL-IDS engine & simulation'
    },
    { 
      path: '/analytics', 
      icon: BarChart3, 
      label: 'Analytics',
      description: 'Performance & insights'
    },
    { 
      path: '/settings', 
      icon: Settings, 
      label: 'Settings',
      description: 'System configuration'
    },
  ];

  const connectionStatusColors = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500 animate-pulse',
    disconnected: 'bg-red-500',
    error: 'bg-red-600 animate-pulse',
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: sidebarCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-700/50 backdrop-blur-xl z-30 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
        <AnimatePresence mode="wait">
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-3"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className={clsx(
                  'absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-900',
                  connectionStatusColors[connectionStatus]
                )} />
              </div>
              <div>
                <h1 className="font-bold text-white text-lg tracking-tight">AgisFL</h1>
                <p className="text-xs text-gray-400 font-medium">Enterprise v3.1</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors group"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3 space-y-2">
        {navItems.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden',
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <div className={clsx(
                  'relative z-10 flex items-center',
                  sidebarCollapsed ? 'justify-center w-full' : 'space-x-3 w-full'
                )}>
                  <div className={clsx(
                    'p-2 rounded-lg transition-colors',
                    isActive ? 'bg-white/10' : 'bg-gray-700/50 group-hover:bg-gray-600/50'
                  )}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  
                  <AnimatePresence mode="wait">
                    {!sidebarCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 min-w-0"
                      >
                        <p className="font-semibold tracking-wide truncate">{item.label}</p>
                        <p className="text-xs opacity-75 truncate">{item.description}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Status Panel */}
      <AnimatePresence mode="wait">
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-4 left-4 right-4"
          >
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">System Status</span>
                <div className={clsx(
                  'w-2 h-2 rounded-full',
                  connectionStatusColors[connectionStatus]
                )} />
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Connection</span>
                  <span className={clsx(
                    'font-medium capitalize',
                    connectionStatus === 'connected' ? 'text-green-400' :
                    connectionStatus === 'connecting' ? 'text-yellow-400' :
                    'text-red-400'
                  )}>
                    {connectionStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Mode</span>
                  <span className="text-blue-400 font-medium">Production</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Security</span>
                  <span className="text-green-400 font-medium">Active</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Sidebar;