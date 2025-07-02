import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, AlertTriangle, Lightbulb, TrendingUp, ChevronRight } from "lucide-react";
import { AiInsight } from "@shared/schema";

export function AIInsights() {
  const { data: insights, isLoading } = useQuery<AiInsight[]>({
    queryKey: ['/api/ai/insights'],
    refetchInterval: 60000, // Refresh every minute
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

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'threat_intelligence': return AlertTriangle;
      case 'correlation': return Lightbulb;
      case 'prediction': return TrendingUp;
      default: return Brain;
    }
  };

  const getInsightColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: 'text-red-400' };
      case 'high': return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: 'text-yellow-400' };
      case 'medium': return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: 'text-blue-400' };
      case 'low': return { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', icon: 'text-green-400' };
      default: return { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400', icon: 'text-gray-400' };
    }
  };

  // Default insights if no data
  const defaultInsights: AiInsight[] = [
    {
      id: 1,
      type: 'threat_intelligence',
      title: 'Potential APT Activity Detected',
      description: 'Advanced pattern analysis indicates possible persistent threat behavior across 3 endpoints.',
      severity: 'High',
      confidence: 87,
      data: null,
      createdAt: new Date(),
      isActive: true
    },
    {
      id: 2,
      type: 'correlation',
      title: 'Anomaly Correlation Found',
      description: 'Graph neural network identified 87% correlation between recent network events.',
      severity: 'Medium',
      confidence: 94,
      data: null,
      createdAt: new Date(),
      isActive: true
    },
    {
      id: 3,
      type: 'prediction',
      title: 'Response Time Improvement',
      description: 'Predictive analytics show 23% faster incident resolution this week.',
      severity: 'Low',
      confidence: 76,
      data: null,
      createdAt: new Date(),
      isActive: true
    }
  ];

  const displayInsights = insights?.length ? insights : defaultInsights;

  return (
    <Card className="surface card-elevation">
      <CardHeader className="border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Brain className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-lg font-medium text-white">AI Threat Intelligence</CardTitle>
            <p className="text-sm text-gray-400">Machine learning insights</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {displayInsights.map((insight) => {
          const Icon = getInsightIcon(insight.type);
          const colors = getInsightColor(insight.severity);

          return (
            <div key={insight.id} className={`p-4 ${colors.bg} border ${colors.border} rounded-lg`}>
              <div className="flex items-start space-x-3">
                <Icon className={`h-4 w-4 ${colors.icon} mt-0.5`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm font-medium ${colors.text}`}>{insight.title}</p>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(insight.confidence || 0)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{insight.description}</p>
                  <Button variant="ghost" size="sm" className={`${colors.text} hover:${colors.bg} p-0 h-auto`}>
                    <span className="text-xs">
                      {insight.type === 'threat_intelligence' ? 'View Analysis' :
                       insight.type === 'correlation' ? 'Investigate' :
                       'View Metrics'}
                    </span>
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
