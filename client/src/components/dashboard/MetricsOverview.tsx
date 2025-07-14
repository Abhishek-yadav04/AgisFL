import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Activity, Users } from "lucide-react";

/**
 * MetricsOverview Component for AgiesFL Dashboard
 * 
 * This component displays key security metrics and system health indicators
 * in a visually appealing card-based layout. It provides real-time insights
 * into system performance, threat detection, and security posture.
 * 
 * @author AgiesFL Development Team
 * @version 1.0.0
 * @since 2025-01-14
 */
export default function MetricsOverview() {
  const metrics = [
    {
      title: "Active Threats",
      value: "23",
      change: "+12%",
      trend: "up",
      icon: AlertTriangle,
      color: "text-red-400",
      bgColor: "bg-red-500/20"
    },
    {
      title: "Protected Nodes",
      value: "1,247",
      change: "+3.2%",
      trend: "up",
      icon: Shield,
      color: "text-green-400",
      bgColor: "bg-green-500/20"
    },
    {
      title: "System Health",
      value: "98.7%",
      change: "+0.3%",
      trend: "up",
      icon: Activity,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20"
    },
    {
      title: "Active Users",
      value: "156",
      change: "+8.1%",
      trend: "up",
      icon: Users,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metric.value}</div>
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                  {metric.change}
                </Badge>
                <span>from last period</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}