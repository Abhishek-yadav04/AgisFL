import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import IncidentsPage from "@/pages/incidents";
import ThreatsPage from "@/pages/threats";
import AnalyticsPage from "@/pages/analytics";
import FederatedLearning from "./pages/federated-learning";
import ForensicsPage from "@/pages/forensics";
import NotFound from "@/pages/not-found";
import { WebSocketProvider } from "./lib/websocket";
import { ElectronProvider } from "./lib/electron";
import { useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/incidents" component={IncidentsPage} />
      <Route path="/threats" component={ThreatsPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/federated-learning" component={FederatedLearning} />
      <Route path="/investigation" component={ForensicsPage} />
      <Route path="/forensics" component={ForensicsPage} />
      <Route path="/reports" component={AnalyticsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Request notification permission for desktop app
    if (window.electronAPI) {
      window.electronAPI.requestNotificationPermission();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ElectronProvider>
        <WebSocketProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </WebSocketProvider>
      </ElectronProvider>
    </QueryClientProvider>
  );
}

export default App;