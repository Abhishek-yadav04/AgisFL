import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Layout Components
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';

// Pages
import Dashboard from './pages/Dashboard';
import FederatedLearning from './pages/FederatedLearning';
import Security from './pages/SecurityCenter';
import Network from './pages/NetworkMonitoring';
import Datasets from './pages/DatasetManager';
import Integrations from './pages/Integrations';

// Stores
import { useAppStore } from './stores/appStore';

// Styles
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 5000,
      refetchInterval: 10000,
      refetchIntervalInBackground: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  const { theme, sidebarCollapsed, setConnectionStatus } = useAppStore();

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.toggle('dark', theme === 'dark');
    
    // Test backend connection
    const testConnection = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('error');
        }
      } catch (error) {
        setConnectionStatus('disconnected');
      }
    };

    testConnection();
    const interval = setInterval(testConnection, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [theme, setConnectionStatus]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router basename="/app">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <Sidebar />
          
          <motion.div
            animate={{ 
              marginLeft: sidebarCollapsed ? '80px' : '280px' 
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="min-h-screen"
          >
            <Header />
            
            <main className="relative">
              <AnimatePresence mode="wait">
                <Routes>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <motion.div
                        key="dashboard"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Dashboard />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/federated-learning" 
                    element={
                      <motion.div
                        key="federated-learning"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <FederatedLearning />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/security" 
                    element={
                      <motion.div
                        key="security"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Security />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/network" 
                    element={
                      <motion.div
                        key="network"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Network />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/datasets" 
                    element={
                      <motion.div
                        key="datasets"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Datasets />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/research" 
                    element={
                      <motion.div
                        key="research"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Research />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/integrations" 
                    element={
                      <motion.div
                        key="integrations"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Integrations />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/advanced" 
                    element={
                      <motion.div
                        key="advanced"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Advanced />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/analytics" 
                    element={
                      <motion.div
                        key="analytics"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Analytics />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/settings" 
                    element={
                      <motion.div
                        key="settings"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Settings />
                      </motion.div>
                    } 
                  />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </AnimatePresence>
            </main>
          </motion.div>
        </div>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: theme === 'dark' ? '#374151' : '#ffffff',
              color: theme === 'dark' ? '#ffffff' : '#000000',
              border: theme === 'dark' ? '1px solid #4B5563' : '1px solid #E5E7EB',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </Router>
      
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default App;