import { Wifi } from "lucide-react";
import { LiveNetworkData } from "@shared/schema";

interface NetworkMetricsProps {
  data?: LiveNetworkData;
}

export function NetworkMetrics({ data }: NetworkMetricsProps) {
  const throughput = data?.throughput || 0;
  const packetsPerSecond = data?.packetsPerSecond || 0;
  const connections = data?.activeConnections || 0;

  return (
    <div className="cyber-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center cyber-text-primary">
          <Wifi className="cyber-info mr-2 h-4 w-4" />
          Network Traffic
        </h3>
        <span className="text-2xl font-bold cyber-info">{throughput.toFixed(1)} Gbps</span>
      </div>
      <div className="chart-container p-4 rounded-lg h-32 relative overflow-hidden">
        {/* Real-time network traffic visualization */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-20"></div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-blue-500 to-transparent opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs cyber-text-muted">
          Live Traffic Visualization
        </div>
      </div>
      <div className="flex justify-between text-sm mt-3">
        <span className="cyber-text-muted">
          Packets/sec: <span className="font-mono cyber-success">{packetsPerSecond.toLocaleString()}</span>
        </span>
        <span className="cyber-text-muted">
          Connections: <span className="font-mono cyber-warning">{connections.toLocaleString()}</span>
        </span>
      </div>
    </div>
  );
}
