import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MetricsOverview } from "@/components/dashboard/MetricsOverview";
import { ThreatActivity } from "@/components/dashboard/ThreatActivity";
import { SystemHealth } from "@/components/dashboard/SystemHealth";
import { IncidentTable } from "@/components/dashboard/IncidentTable";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { AttackPathVisualization } from "@/components/dashboard/AttackPathVisualization";
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
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ThreatActivity />
            <SystemHealth />
          </div>
          
          <IncidentTable />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIInsights />
            <AttackPathVisualization />
          </div>
        </main>
      </div>
    </div>
  );
}
