
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitBranch, Target, Shield, AlertTriangle } from "lucide-react";

/**
 * AttackPathVisualization Component for AgiesFL Dashboard
 * 
 * This component provides visualization of potential attack paths and security
 * vulnerabilities across the federated learning network. It helps security
 * analysts understand threat vectors and prioritize security measures.
 * 
 * @author AgiesFL Development Team
 * @version 1.0.0
 * @since 2025-01-14
 */
export default function AttackPathVisualization() {
  const attackPaths = [
    {
      id: 1,
      name: "External Phishing → Credential Theft → Lateral Movement",
      severity: "Critical",
      probability: 78,
      steps: [
        { step: 1, description: "Phishing email sent to user", risk: "High" },
        { step: 2, description: "Credential harvesting successful", risk: "Critical" },
        { step: 3, description: "Lateral movement to Node-247", risk: "High" },
        { step: 4, description: "Data exfiltration attempt", risk: "Critical" }
      ],
      mitigations: [
        "Implement multi-factor authentication",
        "Enhanced email security filtering",
        "Network segmentation improvements"
      ]
    },
    {
      id: 2,
      name: "Insider Threat → Privilege Escalation → Data Access",
      severity: "High",
      probability: 45,
      steps: [
        { step: 1, description: "Malicious insider with valid access", risk: "Medium" },
        { step: 2, description: "Privilege escalation exploiting vulnerability", risk: "High" },
        { step: 3, description: "Access to sensitive federated data", risk: "Critical" }
      ],
      mitigations: [
        "Implement zero-trust architecture",
        "Regular access reviews",
        "Behavioral analytics monitoring"
      ]
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

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Critical":
        return "text-red-400";
      case "High":
        return "text-orange-400";
      case "Medium":
        return "text-yellow-400";
      default:
        return "text-green-400";
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return "text-red-400";
    if (probability >= 50) return "text-orange-400";
    if (probability >= 30) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <GitBranch className="h-5 w-5 text-red-400" />
          <span className="text-white">Attack Path Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {attackPaths.map((path) => (
            <div key={path.id} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-red-400" />
                  <span className="font-medium text-white">{path.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={`${getSeverityColor(path.severity)} border`}>
                    {path.severity}
                  </Badge>
                  <Badge variant="outline" className="border-gray-600">
                    <span className={getProbabilityColor(path.probability)}>
                      {path.probability}% probability
                    </span>
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <h4 className="text-sm font-medium text-gray-300">Attack Steps:</h4>
                {path.steps.map((step, index) => (
                  <div key={index} className="flex items-center space-x-3 pl-4">
                    <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm text-gray-300">{step.description}</span>
                    </div>
                    <Badge variant="outline" className={`border-gray-600 ${getRiskColor(step.risk)}`}>
                      {step.risk}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">Recommended Mitigations:</h4>
                <div className="grid grid-cols-1 gap-2">
                  {path.mitigations.map((mitigation, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <Shield className="h-3 w-3 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{mitigation}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button variant="outline" size="sm" className="border-blue-600 text-blue-400 hover:bg-blue-900/20">
                  View Detailed Analysis
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
