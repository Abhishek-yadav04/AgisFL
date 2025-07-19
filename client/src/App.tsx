import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "@/lib/queryClient";
import { Dashboard } from "@/pages/dashboard";
import { Login } from "@/pages/login";
import { NotFound } from "@/pages/not-found";
import { FederalLearning } from "@/pages/federal-learning";
import { ThreatLogs } from "@/pages/threat-logs";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/federal-learning" element={<FederalLearning />} />
          <Route path="/threat-logs" element={<ThreatLogs />} />
          <Route path="/network-logs" element={<ThreatLogs />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;