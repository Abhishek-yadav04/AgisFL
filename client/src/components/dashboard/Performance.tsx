import { Gauge } from "lucide-react";
import { LiveSystemData } from "@shared/schema";

interface PerformanceProps {
  data?: LiveSystemData;
}

export function Performance({ data }: PerformanceProps) {
  const uptime = data?.uptime || 0;
  const loadAverage = data?.loadAverage || 0;
  
  // Calculate performance score based on system metrics
  const calculatePerformanceScore = () => {
    if (!data) return 0;
    const cpuScore = Math.max(0, 100 - data.cpuUsage);
    const memoryScore = Math.max(0, 100 - data.memoryUsage);
    const networkScore = Math.max(0, 100 - data.networkIO);
    return ((cpuScore + memoryScore + networkScore) / 3);
  };

  const performanceScore = calculatePerformanceScore();
  const responseTime = 2.3; // Simulated response time

  return (
    <div className="cyber-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center cyber-text-primary">
          <Gauge className="cyber-success mr-2 h-4 w-4" />
          Performance
        </h3>
        <span className="text-2xl font-bold cyber-success">{performanceScore.toFixed(1)}%</span>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm cyber-text-muted">Response Time</span>
          <span className="text-lg font-bold cyber-info">{responseTime}ms</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm cyber-text-muted">Uptime</span>
          <span className="text-lg font-bold cyber-success">{uptime.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm cyber-text-muted">Load Average</span>
          <span className="text-lg font-bold cyber-warning">{loadAverage.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
