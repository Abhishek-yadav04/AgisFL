import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { TopBar } from "@/components/layout/TopBar";
import { SystemStatus } from "@/components/dashboard/SystemStatus";
import { ActiveThreats } from "@/components/dashboard/ActiveThreats";
import { FederatedLearning } from "@/components/dashboard/FederatedLearning";
import { NetworkMetrics } from "@/components/dashboard/NetworkMetrics";
import { ThreatDetection } from "@/components/dashboard/ThreatDetection";
import { Performance } from "@/components/dashboard/Performance";
import { NetworkTopology } from "@/components/dashboard/NetworkTopology";
import { PacketAnalysis } from "@/components/dashboard/PacketAnalysis";
import { FLDashboard } from "@/components/dashboard/FLDashboard";
import { NotificationToast } from "@/components/ui/notification-toast";
import { DashboardData } from "@shared/schema";

export function Dashboard() {
  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    refetchInterval: 5000, // Refresh every 5 seconds
    retry: 3,
    retryDelay: 1000,
  });

  const { data: realTimeData, isConnected } = useWebSocket("/api/ws");

  // Merge real-time data with dashboard data
  const data = realTimeData || dashboardData;

  if (error) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">Connection Error</div>
          <p className="text-gray-300">Failed to connect to backend services</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="cyber-text-primary text-lg">Initializing Cybersecurity Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-gradient">
      <TopBar />
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-80 bg-card border-r border-border p-6 min-h-screen">
          <div className="space-y-6">
            <SystemStatus data={data?.system} />
            <ActiveThreats threats={data?.threats?.activeThreats || []} />
            <FederatedLearning flData={data?.fl} />
          </div>
        </aside>

        {/* Main Dashboard */}
        <main className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
            <NetworkMetrics data={data?.network} />
            <ThreatDetection data={data?.threats} />
            <Performance data={data?.system} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            <NetworkTopology />
            <PacketAnalysis packets={data?.network?.recentPackets || []} />
          </div>

          <FLDashboard flData={data?.fl} />
        </main>
      </div>

      <NotificationToast alerts={data?.recentAlerts || []} />
    </div>
  );
}
