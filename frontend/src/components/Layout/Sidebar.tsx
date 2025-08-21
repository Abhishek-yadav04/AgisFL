import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Brain, 
  Shield, 
  Network, 
  Database, 
  TestTube2,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Zap,
  Globe,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { clsx } from 'clsx';

const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar, connectionStatus, activeFeatures } = useAppStore();

  const navItems = [
    { 
      path: '/dashboard', 
      icon: LayoutDashboard, 
      label: 'Command Center',
      description: 'Real-time overview & control',
      color: 'from-blue-500 to-indigo-600'
    },
    { 
      path: '/federated-learning', 
      icon: Brain, 
      label: 'FL Engine',
      description: 'Federated learning training',
      color: 'from-purple-500 to-pink-600'
    },
    { 
      path: '/security', 
      icon: Shield, 
      label: 'Security Center',
      description: 'Threat detection & response',
      color: 'from-red-500 to-orange-600'
    },
    { 
      path: '/network', 
      icon: Network, 
      label: 'Network Monitor',
      description: 'Packet analysis & monitoring',
      color: 'from-green-500 to-emerald-600'
    },
    { 
      path: '/datasets', 
      icon: Database, 
      label: 'Data Management',
      description: 'Dataset upload & analysis',
      color: 'from-cyan-500 to-blue-600'
    },
    { 
      path: '/algorithms', 
      icon: TestTube2, 
      label: 'FL Algorithms',
      description: 'Research & experimentation',
      color: 'from-violet-500 to-purple-600'
    },
    { 
      path: '/integrations', 
      icon: Globe, 
      label: 'Integrations',
      description: 'External service connections',
      color: 'from-teal-500 to-cyan-600'
    },
    { 
      path: '/analytics', 
      icon: BarChart3, 
      label: 'Analytics',
      description: 'Performance insights',
      color: 'from-amber-500 to-orange-600'
    },
  ];

  const bottomNavItems = [
    { 
      path: '/settings', 
      icon: Settings, 
      label: 'Settings',
      description: 'System configuration',
      color: 'from-gray-500 to-gray-600'
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
      animate={{ width: sidebarCollapsed ? 80 : 320 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-30 shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
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
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div className={clsx(
                  'absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900',
                  connectionStatusColors[connectionStatus]
                )} />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 dark:text-white text-xl tracking-tight">
                  AgisFL Enterprise
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Advanced FL-IDS Platform v4.0
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden',
                isActive
                  ? 'bg-gradient-to-r text-white shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-xl`}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <div className={clsx(
                  'relative z-10 flex items-center',
                  sidebarCollapsed ? 'justify-center w-full' : 'space-x-4 w-full'
                )}>
                  <div className={clsx(
                    'p-2.5 rounded-lg transition-colors',
                    isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
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

      {/* Bottom Navigation */}
      <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden',
                isActive
                  ? 'bg-gradient-to-r text-white shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeBottomTab"
                    className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-xl`}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <div className={clsx(
                  'relative z-10 flex items-center',
                  sidebarCollapsed ? 'justify-center w-full' : 'space-x-4 w-full'
                )}>
                  <div className={clsx(
                    'p-2.5 rounded-lg transition-colors',
                    isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
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
      </div>

      {/* Status Panel */}
      <AnimatePresence mode="wait">
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="p-4 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">System Status</span>
                <div className={clsx(
                  'w-2 h-2 rounded-full',
                  connectionStatusColors[connectionStatus]
                )} />
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Backend</span>
                  <span className={clsx(
                    'font-medium capitalize',
                    connectionStatus === 'connected' ? 'text-green-600 dark:text-green-400' :
                    connectionStatus === 'connecting' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  )}>
                    {connectionStatus}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">FL Training</span>
                  <span className={clsx(
                    'font-medium',
                    activeFeatures.flTraining ? 'text-green-600 dark:text-green-400' : 'text-gray-500'
                  )}>
                    {activeFeatures.flTraining ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Monitoring</span>
                  <span className={clsx(
                    'font-medium',
                    activeFeatures.realTimeMonitoring ? 'text-green-600 dark:text-green-400' : 'text-gray-500'
                  )}>
                    {activeFeatures.realTimeMonitoring ? 'Live' : 'Paused'}
                  </span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Enterprise Mode</span>
                  <div className="flex items-center space-x-1">
                    <Activity className="w-3 h-3 text-blue-500" />
                    <span className="text-blue-600 dark:text-blue-400 font-medium">Active</span>
                  </div>
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