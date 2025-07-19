
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TopBar } from '@/components/layout/TopBar';
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Activity, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Filter,
  Download
} from 'lucide-react';

interface AnalyticsData {
  threatStats: {
    total: number;
    blocked: number;
    active: number;
    resolved: number;
  };
  networkStats: {
    packetsAnalyzed: number;
    anomaliesDetected: number;
    bandwidth: number;
    connections: number;
  };
  systemPerformance: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    uptime: string;
  };
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData>({
    threatStats: { total: 0, blocked: 0, active: 0, resolved: 0 },
    networkStats: { packetsAnalyzed: 0, anomaliesDetected: 0, bandwidth: 0, connections: 0 },
    systemPerformance: { cpuUsage: 0, memoryUsage: 0, diskUsage: 0, uptime: '0h 0m' }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics');
        if (response.ok) {
          const analyticsData = await response.json();
          setData(analyticsData);
        } else {
          // Fallback mock data
          setData({
            threatStats: { total: 247, blocked: 195, active: 12, resolved: 40 },
            networkStats: { packetsAnalyzed: 1250000, anomaliesDetected: 23, bandwidth: 850, connections: 342 },
            systemPerformance: { cpuUsage: 45, memoryUsage: 62, diskUsage: 38, uptime: '72h 34m' }
          });
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        setData({
          threatStats: { total: 247, blocked: 195, active: 12, resolved: 40 },
          networkStats: { packetsAnalyzed: 1250000, anomaliesDetected: 23, bandwidth: 850, connections: 342 },
          systemPerformance: { cpuUsage: 45, memoryUsage: 62, diskUsage: 38, uptime: '72h 34m' }
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <TopBar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-blue-400 text-lg">Loading Analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <TopBar />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Security Analytics</h1>
            <p className="text-slate-400 mt-2">
              Comprehensive analysis of system security metrics and performance
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-slate-700 text-slate-300">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{data.threatStats.blocked}</p>
                  <p className="text-xs text-slate-400">Threats Blocked</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{data.threatStats.active}</p>
                  <p className="text-xs text-slate-400">Active Threats</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-2">
                <Activity className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{data.networkStats.packetsAnalyzed.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">Packets Analyzed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{data.systemPerformance.uptime}</p>
                  <p className="text-xs text-slate-400">System Uptime</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="threats" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
            <TabsTrigger value="threats" className="data-[state=active]:bg-blue-600">Threat Analysis</TabsTrigger>
            <TabsTrigger value="network" className="data-[state=active]:bg-blue-600">Network Metrics</TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-blue-600">System Performance</TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-blue-600">Security Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="threats" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Threat Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Malware</span>
                      <Badge variant="destructive">45%</Badge>
                    </div>
                    <Progress value={45} className="w-full" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Intrusion Attempts</span>
                      <Badge variant="secondary">30%</Badge>
                    </div>
                    <Progress value={30} className="w-full" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Suspicious Traffic</span>
                      <Badge variant="outline">25%</Badge>
                    </div>
                    <Progress value={25} className="w-full" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Threat Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { time: '14:32', type: 'Malware', severity: 'High', status: 'Blocked' },
                      { time: '14:28', type: 'Intrusion', severity: 'Critical', status: 'Blocked' },
                      { time: '14:25', type: 'Anomaly', severity: 'Medium', status: 'Investigating' },
                      { time: '14:20', type: 'Phishing', severity: 'Low', status: 'Resolved' }
                    ].map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-slate-400 text-sm">{event.time}</div>
                          <div className="text-white font-medium">{event.type}</div>
                          <Badge variant={event.severity === 'Critical' ? 'destructive' : 
                                        event.severity === 'High' ? 'default' : 'secondary'}>
                            {event.severity}
                          </Badge>
                        </div>
                        <Badge variant={event.status === 'Blocked' ? 'default' : 'outline'}>
                          {event.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Network Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-2">
                      {data.networkStats.bandwidth} Mbps
                    </div>
                    <p className="text-slate-400">Current Bandwidth</p>
                    <Progress value={85} className="w-full mt-2" />
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">
                      {data.networkStats.connections}
                    </div>
                    <p className="text-slate-400">Active Connections</p>
                    <Progress value={65} className="w-full mt-2" />
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-400 mb-2">
                      {data.networkStats.anomaliesDetected}
                    </div>
                    <p className="text-slate-400">Anomalies Detected</p>
                    <Progress value={12} className="w-full mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">CPU Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-400 mb-4">
                      {data.systemPerformance.cpuUsage}%
                    </div>
                    <Progress value={data.systemPerformance.cpuUsage} className="w-full" />
                    <p className="text-slate-400 mt-2">System Load</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Memory Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-400 mb-4">
                      {data.systemPerformance.memoryUsage}%
                    </div>
                    <Progress value={data.systemPerformance.memoryUsage} className="w-full" />
                    <p className="text-slate-400 mt-2">RAM Utilization</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Disk Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-400 mb-4">
                      {data.systemPerformance.diskUsage}%
                    </div>
                    <Progress value={data.systemPerformance.diskUsage} className="w-full" />
                    <p className="text-slate-400 mt-2">Storage Used</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Security Trends (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Threat Detection Rate</h3>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <span className="text-green-400">↑ 23% improvement</span>
                    </div>
                    <Progress value={89} className="w-full" />
                    <p className="text-slate-400 text-sm">Detection accuracy has improved significantly</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Response Time</h3>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-green-500" />
                      <span className="text-green-400">↓ 45% faster response</span>
                    </div>
                    <Progress value={95} className="w-full" />
                    <p className="text-slate-400 text-sm">Average response time: 1.2 seconds</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
