import { Brain, Users, Target, Shield } from "lucide-react";
import { LiveFLData } from "@shared/schema";

interface FLDashboardProps {
  flData?: LiveFLData;
}

export function FLDashboard({ flData }: FLDashboardProps) {
  const participants = flData?.participantCount || 0;
  const accuracy = flData?.overallAccuracy || 0;
  const trainingRound = flData?.trainingRound || 0;
  const clients = flData?.activeClients || [];
  
  // Calculate threats detected (simulated)
  const threatsDetected = Math.floor(accuracy * 1000 + trainingRound * 8);

  const getClientStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500 pulse-animation';
      case 'training':
        return 'bg-blue-500 pulse-animation';
      case 'reconnecting':
        return 'bg-yellow-500';
      case 'inactive':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="cyber-card">
      <h3 className="font-semibold mb-6 flex items-center cyber-text-primary">
        <Brain className="cyber-success mr-2 h-4 w-4" />
        Federated Learning Dashboard
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold cyber-success mb-2">{participants}</div>
          <div className="text-sm cyber-text-muted flex items-center justify-center">
            <Users className="mr-1 h-3 w-3" />
            Active Participants
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold cyber-info mb-2">{(accuracy * 100).toFixed(1)}%</div>
          <div className="text-sm cyber-text-muted flex items-center justify-center">
            <Target className="mr-1 h-3 w-3" />
            Model Accuracy
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold cyber-warning mb-2">{trainingRound}</div>
          <div className="text-sm cyber-text-muted flex items-center justify-center">
            <Brain className="mr-1 h-3 w-3" />
            Training Rounds
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold cyber-danger mb-2">{threatsDetected.toLocaleString()}</div>
          <div className="text-sm cyber-text-muted flex items-center justify-center">
            <Shield className="mr-1 h-3 w-3" />
            Threats Detected
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-container p-4 rounded-lg">
          <h4 className="font-medium mb-3 cyber-text-primary">Training Progress</h4>
          <div className="h-32 bg-gradient-to-t from-green-500 to-transparent opacity-20 rounded relative">
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-green-500 to-transparent"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs cyber-text-muted">
              Model Convergence Chart
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-3 cyber-text-primary">Client Status</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {clients.length > 0 ? (
              clients.slice(0, 5).map((client) => (
                <div key={client.id} className="flex justify-between items-center bg-accent bg-opacity-30 p-2 rounded">
                  <span className="font-mono text-sm cyber-text-primary">{client.clientId}</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getClientStatusColor(client.status)}`}></div>
                    <span className="text-xs cyber-text-muted capitalize">{client.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm cyber-text-muted">No active clients</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
