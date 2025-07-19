import React, { useEffect, useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Toaster } from '@/components/ui/toaster';
import { Dashboard } from '@/pages/dashboard';
import { Login } from '@/pages/login';
import { NotFound } from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Authentication wrapper component
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token');
      const demoMode = localStorage.getItem('demo_mode');
      const isAuth = !!(token || demoMode);
      setIsAuthenticated(isAuth);

      if (!isAuth && location !== '/') {
        setLocation('/');
      }
    };

    checkAuth();
  }, [location, setLocation]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
};

function App() {
  useEffect(() => {
    // Force dark mode for cybersecurity theme
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen cyber-gradient">
        <Toaster />
        <AuthWrapper>
          <Switch>
            <Route path="/" component={Login} />
            <Route path="/dashboard" component={Dashboard} />
            <Route component={NotFound} />
          </Switch>
        </AuthWrapper>
      </div>
    </QueryClientProvider>
  );
}

export default App;