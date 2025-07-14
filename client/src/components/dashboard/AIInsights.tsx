import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Target, Shield } from "lucide-react";

/**
 * AIInsights Component for AgiesFL Dashboard
 * 
 * This component displays AI-generated insights and recommendations based on
 * federated learning analysis. It provides security analysts with intelligent
 * threat predictions and actionable security recommendations.
 * 
 * @author AgiesFL Development Team
 * @version 1.0.0
 * @since 2025-01-14
 */
export default function AIInsights() {
  const insights = [
    {
      id: 1,
      type: "Threat Prediction",
      confidence: 87,
      title: "Potential DDoS Attack Vector",
      description: "ML model detected patterns suggesting increased probability of DDoS attacks in the next 24 hours.",
      recommendation: "Recommend increasing rate limiting and monitoring network traffic patterns.",
      icon: Target,
      priority: "high"
    },
    {
      id: 2,
      type: "Anomaly Detection",
      confidence: 94,
      title: "Unusual User Behavior Pattern",
      description: "Federated learning model identified anomalous access patterns from Node-156.",
      recommendation: "Review user access logs and consider implementing additional authentication measures.",
      icon: Shield,
      priority: "medium"
    },
    {
      id: 3,
      type: "Performance Optimization",
      confidence: 76,
      title: "Network Efficiency Improvement",
      description: "Analysis suggests optimizing data flow between nodes could improve overall system performance by 15%.",
      recommendation: "Implement suggested routing optimizations during next maintenance window.",
      icon: TrendingUp,
      priority: "low"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-400";
    if (confidence >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-400" />
          <span className="text-white">AI-Generated Insights</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {insights.map((insight) => {
            const Icon = insight.icon;
            return (
              <div key={insight.id} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4 text-purple-400" />
                    <span className="font-medium text-white">{insight.title}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getPriorityColor(insight.priority)} border text-xs`}>
                      {insight.priority}
                    </Badge>
                    <Badge variant="outline" className="border-gray-600">
                      <span className={getConfidenceColor(insight.confidence)}>
                        {insight.confidence}% confidence
                      </span>
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-gray-300 mb-3">{insight.description}</p>

                <div className="bg-gray-800 p-3 rounded border border-gray-600">
                  <p className="text-xs text-gray-400 mb-1">Recommendation:</p>
                  <p className="text-sm text-blue-400">{insight.recommendation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}