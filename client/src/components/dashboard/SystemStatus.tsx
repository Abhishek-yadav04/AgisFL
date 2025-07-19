import { Server } from "lucide-react";
import { LiveSystemData } from "@shared/schema";

interface SystemStatusProps {
  data?: LiveSystemData;
}

export function SystemStatus({ data }: SystemStatusProps) {
  const cpuUsage = data?.cpuUsage || 0;
  const memoryUsage = data?.memoryUsage || 0;
  const networkIO = data?.networkIO || 0;

  return (
    <div className="cyber-card">
      <h3 className="font-semibold mb-4 flex items-center cyber-text-primary">
        <Server className="cyber-info mr-2 h-4 w-4" />
        System Status
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm cyber-text-muted">CPU Usage</span>
          <div className="flex items-center space-x-2">
            <div className="w-20 h-2 bg-accent rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${cpuUsage > 80 ? 'bg-red-500' : cpuUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${cpuUsage}%` }}
              ></div>
            </div>
            <span className="text-sm font-mono cyber-text-primary">{cpuUsage.toFixed(1)}%</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm cyber-text-muted">Memory</span>
          <div className="flex items-center space-x-2">
            <div className="w-20 h-2 bg-accent rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${memoryUsage > 80 ? 'bg-red-500' : memoryUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${memoryUsage}%` }}
              ></div>
            </div>
            <span className="text-sm font-mono cyber-text-primary">{memoryUsage.toFixed(1)}%</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm cyber-text-muted">Network I/O</span>
          <div className="flex items-center space-x-2">
            <div className="w-20 h-2 bg-accent rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${networkIO > 80 ? 'bg-red-500 pulse-animation' : networkIO > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${networkIO}%` }}
              ></div>
            </div>
            <span className="text-sm font-mono cyber-text-primary">{networkIO.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
