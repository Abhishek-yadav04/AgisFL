import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

// Authentication wrapper component
function AuthWrapper() {
  const [location, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem('auth_token');
    const demoMode = localStorage.getItem('demo_mode');
    
    if (token || demoMode) {
      setIsAuthenticated(true);
    }
    
    setLoading(false);
  }, [location]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading AgisFL...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        {isAuthenticated ? <Dashboard /> : <Login />}
      </Route>
      <Route path="/dashboard">
        {isAuthenticated ? <Dashboard /> : <Login />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Force dark mode for cybersecurity theme
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen cyber-gradient">
          <Toaster />
          <AuthWrapper />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
