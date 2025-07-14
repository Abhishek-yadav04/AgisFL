
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Clock } from "lucide-react";

/**
 * ThreatActivity Component for AgiesFL Dashboard
 * 
 * This component displays recent threat detection activities and security alerts
 * in real-time. It provides security analysts with immediate visibility into
 * potential threats and ongoing security incidents.
 * 
 * @author AgiesFL Development Team
 * @version 1.0.0
 * @since 2025-01-14
 */
export default function ThreatActivity() {
  const threats = [
    {
      id: 1,
      type: "Malware Detection",
      severity: "High",
      source: "Node-247",
      timestamp: "2 min ago",
      description: "Suspicious executable detected in system processes"
    },
    {
      id: 2,
      type: "Anomalous Traffic",
      severity: "Medium",
      source: "Node-103",
      timestamp: "5 min ago",
      description: "Unusual network communication pattern detected"
    },
    {
      id: 3,
      type: "Intrusion Attempt",
      severity: "Critical",
      source: "Node-089",
      timestamp: "8 min ago",
      description: "Multiple failed authentication attempts from external IP"
    },
    {
      id: 4,
      type: "Data Exfiltration",
      severity: "High",
      source: "Node-156",
      timestamp: "12 min ago",
      description: "Large data transfer to unauthorized destination"
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "High":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "Medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <span className="text-white">Recent Threat Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {threats.map((threat) => (
            <div key={threat.id} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <span className="font-medium text-white">{threat.type}</span>
                </div>
                <Badge className={`${getSeverityColor(threat.severity)} border`}>
                  {threat.severity}
                </Badge>
              </div>
              <p className="text-sm text-gray-300 mb-2">{threat.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Source: {threat.source}</span>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{threat.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
