import { AlertTriangle } from "lucide-react";
import { Threat } from "@shared/schema";

interface ActiveThreatsProps {
  threats: Threat[];
}

export function ActiveThreats({ threats }: ActiveThreatsProps) {
  const getSeverityClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'threat-high';
      case 'high':
        return 'threat-high';
      case 'medium':
        return 'threat-medium';
      case 'low':
        return 'threat-low';
      default:
        return 'threat-medium';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'cyber-danger';
      case 'high':
        return 'cyber-danger';
      case 'medium':
        return 'cyber-warning';
      case 'low':
        return 'cyber-success';
      default:
        return 'cyber-warning';
    }
  };

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    return `${minutes} minutes ago`;
  };

  return (
    <div className="cyber-card">
      <h3 className="font-semibold mb-4 flex items-center cyber-text-primary">
        <AlertTriangle className="cyber-warning mr-2 h-4 w-4" />
        Active Threats
      </h3>
      <div className="space-y-3">
        {threats.length > 0 ? (
          threats.slice(0, 3).map((threat) => (
            <div key={threat.id} className={`${getSeverityClass(threat.severity)} bg-accent bg-opacity-30 p-3 rounded-lg`}>
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-medium cyber-text-primary">{threat.name}</span>
                <span className={`text-xs font-mono ${getSeverityColor(threat.severity)}`}>
                  {threat.severity.toUpperCase()}
                </span>
              </div>
              <p className="text-xs cyber-text-muted">Source: {threat.source}</p>
              <p className="text-xs cyber-text-muted">{formatTime(threat.timestamp)}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-sm cyber-text-muted">No active threats detected</p>
            <p className="text-xs cyber-success mt-1">System secure</p>
          </div>
        )}
      </div>
    </div>
  );
}
