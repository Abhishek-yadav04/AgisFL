
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Activity, TrendingUp, Shield, AlertTriangle, Eye, Download, Calendar, Filter } from "lucide-react";

export function Analytics() {
  const [timeRange, setTimeRange] = useState("7d");
  const [analyticsType, setAnalyticsType] = useState("threats");

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/analytics", timeRange, analyticsType],
    refetchInterval: 30000,
  });

  const threatTrends = [
    { date: "2024-01-01", threats: 45, mitigated: 42, false_positives: 3 },
    { date: "2024-01-02", threats: 52, mitigated: 48, false_positives: 4 },
    { date: "2024-01-03", threats: 38, mitigated: 35, false_positives: 3 },
    { date: "2024-01-04", threats: 67, mitigated: 61, false_positives: 6 },
    { date: "2024-01-05", threats: 43, mitigated: 41, false_positives: 2 },
    { date: "2024-01-06", threats: 59, mitigated: 55, false_positives: 4 },
    { date: "2024-01-07", threats: 41, mitigated: 39, false_positives: 2 },
  ];

  const severityDistribution = [
    { name: "Critical", value: 23, color: "#ef4444" },
    { name: "High", value: 45, color: "#f97316" },
    { name: "Medium", value: 89, color: "#eab308" },
    { name: "Low", value: 156, color: "#22c55e" },
  ];

  const systemMetrics = [
    { time: "00:00", cpu: 45, memory: 67, network: 23 },
    { time: "04:00", cpu: 52, memory: 71, network: 34 },
    { time: "08:00", cpu: 78, memory: 85, network: 67 },
    { time: "12:00", cpu: 65, memory: 79, network: 45 },
    { time: "16:00", cpu: 71, memory: 82, network: 56 },
    { time: "20:00", cpu: 58, memory: 74, network: 38 },
  ];

  if (error) {
    return (
      <div className="min-h-screen cyber-gradient">
        <TopBar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-500 mb-2">Connection Error</h2>
            <p className="text-gray-300">Failed to load analytics data</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen cyber-gradient">
        <TopBar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="cyber-text-primary text-lg">Loading Analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-gradient">
      <TopBar />
      
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold cyber-text-primary mb-2">Security Analytics</h1>
            <p className="text-gray-400">Comprehensive security metrics and insights</p>
          </div>
          
          <div className="flex gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Threats</p>
                  <p className="text-2xl font-bold text-red-500">1,247</p>
                  <p className="text-xs text-green-500">↓ 12% vs last week</p>
                </div>
                <Shield className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Mitigation Rate</p>
                  <p className="text-2xl font-bold text-green-500">94.2%</p>
                  <p className="text-xs text-green-500">↑ 2.1% vs last week</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">False Positives</p>
                  <p className="text-2xl font-bold text-yellow-500">3.8%</p>
                  <p className="text-xs text-red-500">↑ 0.5% vs last week</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Response Time</p>
                  <p className="text-2xl font-bold text-blue-500">2.3s</p>
                  <p className="text-xs text-green-500">↓ 0.7s vs last week</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="threats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur border border-blue-500/20">
            <TabsTrigger value="threats">Threat Analytics</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="network">Network Analysis</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="threats" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Threat Trends */}
              <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Threat Detection Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={threatTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '6px'
                        }}
                      />
                      <Line type="monotone" dataKey="threats" stroke="#ef4444" strokeWidth={2} />
                      <Line type="monotone" dataKey="mitigated" stroke="#22c55e" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Severity Distribution */}
              <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Threat Severity Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={severityDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {severityDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={systemMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                    <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} name="CPU %" />
                    <Line type="monotone" dataKey="memory" stroke="#10b981" strokeWidth={2} name="Memory %" />
                    <Line type="monotone" dataKey="network" stroke="#f59e0b" strokeWidth={2} name="Network %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle>Network Traffic Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Inbound Traffic</span>
                      <span className="text-blue-500">2.4 GB/h</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Outbound Traffic</span>
                      <span className="text-green-500">1.8 GB/h</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Suspicious Connections</span>
                      <span className="text-red-500">23</span>
                    </div>
                    <Progress value={15} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle>Top Threat Sources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { ip: "192.168.1.100", threats: 45, country: "Unknown" },
                    { ip: "10.0.0.50", threats: 32, country: "Internal" },
                    { ip: "203.0.113.42", threats: 28, country: "US" },
                    { ip: "198.51.100.23", threats: 19, country: "CN" },
                  ].map((source, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-800/50 rounded">
                      <div>
                        <p className="font-medium">{source.ip}</p>
                        <p className="text-sm text-gray-400">{source.country}</p>
                      </div>
                      <Badge variant="destructive">{source.threats} threats</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Generated Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Weekly Security Summary", date: "2024-01-07", size: "2.4 MB", status: "Ready" },
                  { name: "Threat Intelligence Report", date: "2024-01-06", size: "1.8 MB", status: "Ready" },
                  { name: "Performance Analysis", date: "2024-01-05", size: "3.2 MB", status: "Processing" },
                  { name: "Compliance Report", date: "2024-01-04", size: "1.5 MB", status: "Ready" },
                ].map((report, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-800/50 rounded border border-gray-700">
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-sm text-gray-400">{report.date} • {report.size}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={report.status === "Ready" ? "default" : "secondary"}>
                        {report.status}
                      </Badge>
                      {report.status === "Ready" && (
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
