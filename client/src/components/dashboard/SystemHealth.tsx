
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Cpu, HardDrive, Wifi, Users } from "lucide-react";

/**
 * SystemHealth Component for AgiesFL Dashboard
 * 
 * This component provides comprehensive system health monitoring and performance
 * metrics for the federated learning network. It displays real-time information
 * about system resources, network connectivity, and node status.
 * 
 * @author AgiesFL Development Team
 * @version 1.0.0
 * @since 2025-01-14
 */
export default function SystemHealth() {
  const systemMetrics = [
    {
      name: "CPU Usage",
      value: 67,
      status: "normal",
      icon: Cpu,
      color: "text-blue-400"
    },
    {
      name: "Memory Usage",
      value: 43,
      status: "normal",
      icon: HardDrive,
      color: "text-green-400"
    },
    {
      name: "Network Load",
      value: 78,
      status: "high",
      icon: Wifi,
      color: "text-yellow-400"
    },
    {
      name: "Active Connections",
      value: 156,
      status: "normal",
      icon: Users,
      color: "text-purple-400"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "high":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return "bg-red-500";
    if (value >= 60) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-green-400" />
          <span className="text-white">System Health</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {systemMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                    <span className="text-sm font-medium text-white">{metric.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-300">
                      {typeof metric.value === 'number' && metric.value <= 100 ? `${metric.value}%` : metric.value}
                    </span>
                    <Badge className={`${getStatusColor(metric.status)} border text-xs`}>
                      {metric.status}
                    </Badge>
                  </div>
                </div>
                {typeof metric.value === 'number' && metric.value <= 100 && (
                  <div className="w-full">
                    <Progress 
                      value={metric.value} 
                      className={`h-2 bg-gray-700 [&>div]:${getProgressColor(metric.value)}`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
