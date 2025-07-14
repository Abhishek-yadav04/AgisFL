
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";

import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";

import Dashboard from "@/pages/dashboard";
import Incidents from "@/pages/incidents";
import Threats from "@/pages/threats";
import Analytics from "@/pages/analytics";
import Forensics from "@/pages/forensics";
import FederatedLearning from "@/pages/federated-learning";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";

import { useEffect, useState } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: (failureCount, error: any) => {
        if (error?.status === 401) return false;
        return failureCount < 3;
      },
    },
  },
});

function PrivateRoute({ component: Component, ...props }: any) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('agiesfl_token');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        if (decoded.exp > currentTime) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('agiesfl_token');
          localStorage.removeItem('agiesfl_user');
          setIsAuthenticated(false);
        }
      } catch (error) {
        localStorage.removeItem('agiesfl_token');
        localStorage.removeItem('agiesfl_user');
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Component {...props} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-900 text-white">
          <Switch>
            <Route path="/login" component={LoginPage} />
            <Route>
              {(params) => {
                const isLoginRoute = params.path === '/login';
                if (isLoginRoute) return null;
                
                return (
                  <>
                    <TopBar />
                    <div className="flex">
                      <Sidebar />
                      <main className="flex-1 p-6 ml-64">
                        <Switch>
                          <Route path="/" component={() => <Redirect to="/dashboard" />} />
                          <Route path="/dashboard" component={(props: any) => <PrivateRoute component={Dashboard} {...props} />} />
                          <Route path="/incidents" component={(props: any) => <PrivateRoute component={Incidents} {...props} />} />
                          <Route path="/threats" component={(props: any) => <PrivateRoute component={Threats} {...props} />} />
                          <Route path="/analytics" component={(props: any) => <PrivateRoute component={Analytics} {...props} />} />
                          <Route path="/forensics" component={(props: any) => <PrivateRoute component={Forensics} {...props} />} />
                          <Route path="/federated-learning" component={(props: any) => <PrivateRoute component={FederatedLearning} {...props} />} />
                          <Route component={NotFound} />
                        </Switch>
                      </main>
                    </div>
                  </>
                );
              }}
            </Route>
          </Switch>
        </div>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
