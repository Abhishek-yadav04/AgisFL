import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Shield, CheckCircle, Timer, TrendingUp, TrendingDown } from "lucide-react";
import { DashboardMetrics } from "@/types/dashboard";

export function MetricsOverview() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/metrics'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="surface card-elevation animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricsData = [
    {
      title: "Active Incidents",
      value: metrics?.activeIncidents || 0,
      change: "+3 from yesterday",
      trend: "up",
      color: "error",
      icon: AlertTriangle,
    },
    {
      title: "Threats Detected",
      value: metrics?.threatsDetected || 0,
      change: "+127 today",
      trend: "up",
      color: "warning",
      icon: Shield,
    },
    {
      title: "Resolved Today",
      value: metrics?.resolvedToday || 0,
      change: "95% resolution rate",
      trend: "up",
      color: "success",
      icon: CheckCircle,
    },
    {
      title: "Avg Response Time",
      value: `${metrics?.avgResponseTime || 0}m`,
      change: "-12% improvement",
      trend: "down",
      color: "primary",
      icon: Timer,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricsData.map((metric, index) => {
        const Icon = metric.icon;
        const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown;
        
        return (
          <Card key={index} className="surface card-elevation">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm on-surface-variant font-medium">{metric.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{metric.value}</p>
                  <p className={`text-sm mt-1 flex items-center ${
                    metric.color === 'error' ? 'text-red-400' :
                    metric.color === 'warning' ? 'text-yellow-400' :
                    metric.color === 'success' ? 'text-green-400' :
                    'text-blue-400'
                  }`}>
                    <TrendIcon className="h-3 w-3 mr-1" />
                    {metric.change}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  metric.color === 'error' ? 'bg-red-500/20' :
                  metric.color === 'warning' ? 'bg-yellow-500/20' :
                  metric.color === 'success' ? 'bg-green-500/20' :
                  'bg-blue-500/20'
                }`}>
                  <Icon className={`h-6 w-6 ${
                    metric.color === 'error' ? 'text-red-400' :
                    metric.color === 'warning' ? 'text-yellow-400' :
                    metric.color === 'success' ? 'text-green-400' :
                    'text-blue-400'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
