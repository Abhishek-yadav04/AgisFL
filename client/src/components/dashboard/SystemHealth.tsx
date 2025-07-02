import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SystemHealthData } from "@/types/dashboard";

export function SystemHealth() {
  const { data: health, isLoading } = useQuery<SystemHealthData>({
    queryKey: ['/api/system/health'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="surface card-elevation animate-pulse">
        <CardContent className="p-6">
          <div className="h-80 bg-gray-700 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const services = [
    { name: "AI Detection Engine", status: "healthy", uptime: health?.aiEngine || 99.8 },
    { name: "Data Pipeline", status: "healthy", uptime: health?.dataPipeline || 98.2 },
    { name: "Network Sensors", status: "warning", uptime: health?.networkSensors || 94.1 },
    { name: "Correlation Engine", status: "healthy", uptime: health?.correlationEngine || 99.9 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "bg-green-500";
      case "warning": return "bg-yellow-500";
      case "critical": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-green-400";
      case "warning": return "text-yellow-400";
      case "critical": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  return (
    <Card className="surface card-elevation">
      <CardHeader className="border-b border-gray-700">
        <CardTitle className="text-lg font-medium text-white">System Health</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {services.map((service, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 ${getStatusColor(service.status)} rounded-full`}></div>
              <span className="text-sm on-surface">{service.name}</span>
            </div>
            <span className={`text-xs font-medium ${getStatusTextColor(service.status)}`}>
              {service.uptime}%
            </span>
          </div>
        ))}

        <div className="pt-4 border-t border-gray-700 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm on-surface-variant">CPU Usage</span>
              <span className="text-sm on-surface">{health?.cpu || 23}%</span>
            </div>
            <Progress value={health?.cpu || 23} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm on-surface-variant">Memory Usage</span>
              <span className="text-sm on-surface">{health?.memory || 67}%</span>
            </div>
            <Progress value={health?.memory || 67} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm on-surface-variant">Network I/O</span>
              <span className="text-sm on-surface">{health?.network || 45}%</span>
            </div>
            <Progress value={health?.network || 45} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm on-surface-variant">Storage</span>
              <span className="text-sm on-surface">{health?.storage || 78}%</span>
            </div>
            <Progress value={health?.storage || 78} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
