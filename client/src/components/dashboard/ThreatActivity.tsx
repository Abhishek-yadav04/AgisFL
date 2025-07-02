import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, History } from "lucide-react";
import { useWebSocket } from "@/lib/websocket";
import { useEffect, useState } from "react";

export function ThreatActivity() {
  const [threatFeed, setThreatFeed] = useState<any[]>([]);
  const { lastMessage } = useWebSocket();

  const { data: initialThreats, isLoading, refetch } = useQuery({
    queryKey: ['/api/threats/feed'],
    refetchInterval: 60000, // Refresh every minute
  });

  useEffect(() => {
    if (initialThreats) {
      setThreatFeed(initialThreats);
    }
  }, [initialThreats]);

  useEffect(() => {
    if (lastMessage?.channel === 'threats' && lastMessage.data?.type === 'threat_detected') {
      setThreatFeed(prev => [lastMessage.data.threat, ...prev.slice(0, 9)]);
    }
  }, [lastMessage]);

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="lg:col-span-2">
        <Card className="surface card-elevation animate-pulse">
          <CardContent className="p-6">
            <div className="h-80 bg-gray-700 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2">
      <Card className="surface card-elevation">
        <CardHeader className="border-b border-gray-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-white">Real-time Threat Activity</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs on-surface-variant">Live</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="chart-container rounded-lg flex flex-col items-center justify-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-400/20"></div>
            <div className="relative z-10 text-center">
              <History className="h-12 w-12 opacity-50 mb-4" />
              <p className="text-lg font-medium mb-2">Real-time Threat History</p>
              <p className="text-sm opacity-75 mb-4">ML-powered threat correlation engine</p>
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="text-center">
                  <p className="text-2xl font-bold">{threatFeed?.length || 0}</p>
                  <p className="text-xs opacity-75">Active Threats</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">94%</p>
                  <p className="text-xs opacity-75">Detection Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">12s</p>
                  <p className="text-xs opacity-75">Avg Detection</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent threat activity list */}
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-medium text-white">Recent Activity</h4>
            {threatFeed?.slice(0, 5).map((threat, index) => (
              <div key={threat.id || index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant={threat.severity === 'Critical' ? 'destructive' : threat.severity === 'High' ? 'secondary' : 'outline'}>
                    {threat.severity || 'Medium'}
                  </Badge>
                  <span className="text-sm text-gray-300">{threat.name || threat.type || 'Unknown Threat'}</span>
                </div>
                <span className="text-xs text-gray-400">{threat.timestamp || 'Now'}</span>
              </div>
            )) || (
              <div className="text-center py-4 text-gray-400">
                <p>No active threats detected</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
