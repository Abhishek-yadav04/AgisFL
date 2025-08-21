import React, { useState, useEffect, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Layout Components
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Page Components
import Dashboard from './pages/Dashboard';
import SecurityCenter from './pages/SecurityCenter';
import NetworkMonitoring from './pages/NetworkMonitoring';
import FederatedLearning from './pages/FederatedLearning';
import DatasetManager from './pages/DatasetManager';
import FLAlgorithms from './pages/FLAlgorithms';
import Integrations from './pages/Integrations';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

// Store
import { useAppStore } from './stores/appStore';

// Create QueryClient with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  const { theme, sidebarCollapsed } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
  }, [theme]);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <LoadingSpinner size="lg" />
          <p className="text-white mt-4 font-medium">Loading AgisFL Enterprise...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <Sidebar />
          
          <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
            sidebarCollapsed ? 'ml-20' : 'ml-80'
          }`}>
            <Header />
            
            <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <LoadingSpinner size="lg" />
                </div>
              }>
                <AnimatePresence mode="wait">
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/security" element={<SecurityCenter />} />
                    <Route path="/network" element={<NetworkMonitoring />} />
                    <Route path="/federated-learning" element={<FederatedLearning />} />
                    <Route path="/datasets" element={<DatasetManager />} />
                    <Route path="/algorithms" element={<FLAlgorithms />} />
                    <Route path="/integrations" element={<Integrations />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </AnimatePresence>
              </Suspense>
            </main>
          </div>
        </div>
        
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: theme === 'dark' ? '#1f2937' : '#ffffff',
              color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: 'white',
              },
            },
          }}
        />
      </Router>
      
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

export default App;