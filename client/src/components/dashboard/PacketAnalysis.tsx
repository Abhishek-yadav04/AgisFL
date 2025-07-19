import { Search } from "lucide-react";
import { Packet } from "@shared/schema";

interface PacketAnalysisProps {
  packets: Packet[];
}

export function PacketAnalysis({ packets }: PacketAnalysisProps) {
  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractional: 3 
    });
  };

  const getProtocolColor = (protocol: string) => {
    switch (protocol.toUpperCase()) {
      case 'TCP':
        return 'cyber-info';
      case 'UDP':
        return 'cyber-warning';
      case 'ICMP':
        return 'cyber-danger';
      case 'HTTP':
        return 'cyber-success';
      case 'HTTPS':
        return 'cyber-success';
      default:
        return 'cyber-text-muted';
    }
  };

  return (
    <div className="cyber-card">
      <h3 className="font-semibold mb-4 flex items-center cyber-text-primary">
        <Search className="cyber-warning mr-2 h-4 w-4" />
        Live Packet Analysis
      </h3>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {packets.length > 0 ? (
          packets.map((packet) => (
            <div key={packet.id} className="bg-accent bg-opacity-30 p-3 rounded-lg font-mono text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className={getProtocolColor(packet.protocol)}>
                  {packet.protocol.toUpperCase()}
                </span>
                <span className="cyber-text-muted">{formatTime(packet.timestamp)}</span>
              </div>
              <div className="cyber-text-muted">
                <span>{packet.source}</span> → <span>{packet.destination}</span>
              </div>
              <div className="cyber-success mt-1">
                {packet.suspicious ? (
                  <span className="cyber-danger">⚠️ Suspicious packet detected</span>
                ) : (
                  `Payload: ${packet.size} bytes`
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-sm cyber-text-muted">No recent packets to display</p>
            <p className="text-xs cyber-text-muted mt-1">Waiting for network traffic...</p>
          </div>
        )}
      </div>
    </div>
  );
}
