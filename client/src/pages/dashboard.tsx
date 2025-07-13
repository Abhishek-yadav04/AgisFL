import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MetricsOverview } from "@/components/dashboard/MetricsOverview";
import { ThreatActivity } from "@/components/dashboard/ThreatActivity";
import { SystemHealth } from "@/components/dashboard/SystemHealth";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { AttackPathVisualization } from "@/components/dashboard/AttackPathVisualization";
import { IncidentTable } from "@/components/dashboard/IncidentTable";
import { FederatedLearningPanel } from "@/components/dashboard/FederatedLearningPanel";
export default function Dashboard() {
  // Temporarily disable WebSocket to fix infinite re-render bug
  // TODO: Re-enable once authentication is implemented

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto p-6 space-y-6">
          <MetricsOverview />

          {/* Second Row - Federated Learning Panel */}
          <div className="grid grid-cols-1 gap-6">
            <FederatedLearningPanel />
          </div>

          {/* Third Row - Charts and Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIInsights />
            <AttackPathVisualization />
          </div>

          {/* Fourth Row - Detailed Tables */}
          <div className="grid grid-cols-1 gap-6">
            <IncidentTable />
          </div>
        </main>
      </div>
    </div>
  );
}