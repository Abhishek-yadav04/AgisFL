import { Brain } from "lucide-react";
import { LiveFLData } from "@shared/schema";

interface FederatedLearningProps {
  flData?: LiveFLData;
}

export function FederatedLearning({ flData }: FederatedLearningProps) {
  const activeClients = flData?.participantCount || 0;
  const accuracy = flData?.overallAccuracy || 0;
  const round = flData?.trainingRound || 0;

  const formatTime = (timestamp?: Date | string) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    return `${minutes} min ago`;
  };

  return (
    <div className="cyber-card">
      <h3 className="font-semibold mb-4 flex items-center cyber-text-primary">
        <Brain className="cyber-success mr-2 h-4 w-4" />
        FL Model Status
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm cyber-text-muted">Active Clients</span>
          <span className="text-lg font-bold cyber-success">{activeClients}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm cyber-text-muted">Model Accuracy</span>
          <span className="text-lg font-bold cyber-info">{(accuracy * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm cyber-text-muted">Training Round</span>
          <span className="text-lg font-bold cyber-warning">{round}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm cyber-text-muted">Last Update</span>
          <span className="text-sm font-mono cyber-text-muted">
            {formatTime(flData?.currentModel?.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}
