import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, PieChart, Activity, Download, Filter, Calendar } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Incident, Threat, SystemMetric } from "@shared/schema";

export default function AnalyticsPage() {
  const { data: incidents } = useQuery<Incident[]>({
    queryKey: ['/api/incidents'],
  });

  const { data: threats } = useQuery<Threat[]>({
    queryKey: ['/api/threats'],
  });

  const { data: systemMetrics } = useQuery<SystemMetric[]>({
    queryKey: ['/api/system/metrics'],
  });

  // Calculate analytics data
  const analytics = {
    incidents: {
      total: incidents?.length || 0,
      resolved: incidents?.filter(i => i.status === 'resolved').length || 0,
      critical: incidents?.filter(i => i.severity === 'Critical').length || 0,
      byType: getIncidentsByType(incidents || []),
      resolutionTime: calculateAvgResolutionTime(incidents || [])
    },
    threats: {
      total: threats?.length || 0,
      active: threats?.filter(t => t.isActive).length || 0,
      byType: getThreatsByType(threats || []),
      bySeverity: getThreatsBySeverity(threats || [])
    },
    trends: {
      weeklyIncidents: generateWeeklyTrend(incidents || []),
      threatDetection: generateThreatTrend(threats || [])
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Security Analytics</h1>
                <p className="text-gray-400">Advanced threat intelligence and incident analysis</p>
              </div>
              <div className="flex items-center space-x-2">
                <Select defaultValue="30d">
                  <SelectTrigger className="w-[120px] surface-variant border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="surface card-elevation">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="h-8 w-8 text-blue-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{analytics.incidents.total}</p>
                      <p className="text-sm text-gray-400">Total Incidents</p>
                      <p className="text-xs text-green-400">↑ 12% from last month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="surface card-elevation">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-8 w-8 text-green-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{Math.round((analytics.incidents.resolved / analytics.incidents.total) * 100 || 0)}%</p>
                      <p className="text-sm text-gray-400">Resolution Rate</p>
                      <p className="text-xs text-green-400">↑ 5% improvement</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="surface card-elevation">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Activity className="h-8 w-8 text-orange-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{analytics.incidents.resolutionTime}h</p>
                      <p className="text-sm text-gray-400">Avg Resolution</p>
                      <p className="text-xs text-green-400">↓ 23% faster</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="surface card-elevation">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <PieChart className="h-8 w-8 text-purple-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{analytics.threats.active}</p>
                      <p className="text-sm text-gray-400">Active Threats</p>
                      <p className="text-xs text-yellow-400">↑ 8% this week</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5 bg-gray-800">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="incidents">Incident Analysis</TabsTrigger>
                <TabsTrigger value="threats">Threat Intelligence</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="trends">Trends & Forecasting</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Incident Distribution Chart */}
                  <Card className="surface card-elevation">
                    <CardHeader>
                      <CardTitle>Incident Distribution by Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <PieChart className="h-16 w-16 mx-auto mb-4 text-blue-400 opacity-50" />
                          <p className="text-lg font-medium text-white">Interactive Pie Chart</p>
                          <p className="text-sm text-gray-400">Incident type distribution</p>
                          <div className="mt-4 space-y-2">
                            {Object.entries(analytics.incidents.byType).map(([type, count]) => (
                              <div key={type} className="flex items-center justify-between text-sm">
                                <span className="text-gray-300">{type}</span>
                                <span className="text-blue-400 font-mono">{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Threat Severity Breakdown */}
                  <Card className="surface card-elevation">
                    <CardHeader>
                      <CardTitle>Threat Severity Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(analytics.threats.bySeverity).map(([severity, count]) => {
                          const percentage = (count / analytics.threats.total) * 100;
                          const colors = {
                            'Critical': 'bg-red-500',
                            'High': 'bg-orange-500',
                            'Medium': 'bg-yellow-500',
                            'Low': 'bg-green-500'
                          };
                          
                          return (
                            <div key={severity} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-white font-medium">{severity}</span>
                                <span className="text-gray-400">{count} ({Math.round(percentage)}%)</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${colors[severity as keyof typeof colors] || 'bg-gray-500'}`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Incident Timeline */}
                <Card className="surface card-elevation">
                  <CardHeader>
                    <CardTitle>Weekly Incident Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-16 w-16 mx-auto mb-4 text-green-400 opacity-50" />
                        <p className="text-lg font-medium text-white">Time Series Chart</p>
                        <p className="text-sm text-gray-400">Weekly incident volume and trends</p>
                        <div className="mt-4 flex justify-center space-x-8">
                          {analytics.trends.weeklyIncidents.map((week, index) => (
                            <div key={index} className="text-center">
                              <div className="text-2xl font-bold text-white">{week.count}</div>
                              <div className="text-xs text-gray-400">Week {index + 1}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="incidents" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="surface card-elevation">
                    <CardHeader>
                      <CardTitle>Resolution Time Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Average</span>
                        <span className="text-white font-mono">{analytics.incidents.resolutionTime}h</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Median</span>
                        <span className="text-white font-mono">4.2h</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">90th Percentile</span>
                        <span className="text-white font-mono">18.7h</span>
                      </div>
                      <div className="pt-4 border-t border-gray-700">
                        <h4 className="text-sm font-medium text-white mb-2">SLA Compliance</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Critical (4h)</span>
                          <Badge variant="destructive">78%</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">High (24h)</span>
                          <Badge variant="secondary">94%</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="surface card-elevation">
                    <CardHeader>
                      <CardTitle>Top Incident Types</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(analytics.incidents.byType)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                            <span className="text-white">{type}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-blue-400 font-mono">{count}</span>
                              <Badge variant="outline">
                                {Math.round((count / analytics.incidents.total) * 100)}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </CardContent>
                  </Card>

                  <Card className="surface card-elevation">
                    <CardHeader>
                      <CardTitle>Assignment Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                        <span className="text-white">Sarah Kim</span>
                        <span className="text-blue-400">12 incidents</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                        <span className="text-white">Alex Chen</span>
                        <span className="text-blue-400">8 incidents</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                        <span className="text-white">Mike Johnson</span>
                        <span className="text-blue-400">6 incidents</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                        <span className="text-white">Unassigned</span>
                        <span className="text-yellow-400">4 incidents</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="threats" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="surface card-elevation">
                    <CardHeader>
                      <CardTitle>Threat Detection Accuracy</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">True Positives</span>
                          <span className="text-green-400 font-mono">94.7%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">False Positives</span>
                          <span className="text-yellow-400 font-mono">3.2%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">False Negatives</span>
                          <span className="text-red-400 font-mono">2.1%</span>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-700">
                          <h4 className="text-sm font-medium text-white mb-2">AI Model Performance</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Precision</span>
                              <span className="text-blue-400">96.8%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Recall</span>
                              <span className="text-blue-400">97.9%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">F1 Score</span>
                              <span className="text-blue-400">97.3%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="surface card-elevation">
                    <CardHeader>
                      <CardTitle>Attack Vector Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                        <span className="text-white">Email Phishing</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-red-400">42%</span>
                          <Badge variant="destructive">Critical</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                        <span className="text-white">Web Application</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-orange-400">28%</span>
                          <Badge variant="secondary">High</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                        <span className="text-white">Network Intrusion</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-yellow-400">18%</span>
                          <Badge variant="outline">Medium</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                        <span className="text-white">USB/Physical</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-green-400">12%</span>
                          <Badge variant="outline">Low</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="surface card-elevation">
                    <CardHeader>
                      <CardTitle>System Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Detection Latency</span>
                        <span className="text-green-400">12.3s avg</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Processing Throughput</span>
                        <span className="text-blue-400">2.3M events/min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Correlation Speed</span>
                        <span className="text-purple-400">450ms avg</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Alert Generation</span>
                        <span className="text-orange-400">1.2s avg</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="surface card-elevation">
                    <CardHeader>
                      <CardTitle>Resource Utilization</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-400">CPU Usage</span>
                          <span className="text-blue-400">23%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '23%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-400">Memory Usage</span>
                          <span className="text-green-400">67%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '67%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-400">Storage Usage</span>
                          <span className="text-yellow-400">78%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="surface card-elevation">
                    <CardHeader>
                      <CardTitle>AI Engine Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Model Accuracy</span>
                        <span className="text-green-400">97.3%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Inference Time</span>
                        <span className="text-blue-400">85ms</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Training Samples</span>
                        <span className="text-purple-400">2.1M</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Model Version</span>
                        <span className="text-orange-400">v2.4.1</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="trends" className="space-y-6">
                <Card className="surface card-elevation">
                  <CardHeader>
                    <CardTitle>Predictive Analytics & Forecasting</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <TrendingUp className="h-16 w-16 mx-auto mb-4 text-purple-400 opacity-50" />
                        <p className="text-lg font-medium text-white">Predictive Trend Analysis</p>
                        <p className="text-sm text-gray-400">Machine learning-powered forecasting</p>
                        <div className="mt-6 grid grid-cols-3 gap-8">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-400">+23%</p>
                            <p className="text-xs text-gray-400">Predicted incident increase</p>
                            <p className="text-xs text-gray-500">Next 30 days</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-400">-15%</p>
                            <p className="text-xs text-gray-400">Response time improvement</p>
                            <p className="text-xs text-gray-500">Projected</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-400">96.8%</p>
                            <p className="text-xs text-gray-400">Detection accuracy trend</p>
                            <p className="text-xs text-gray-500">Rolling average</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

// Helper functions for data processing
function getIncidentsByType(incidents: Incident[]) {
  const types: Record<string, number> = {};
  incidents.forEach(incident => {
    types[incident.type] = (types[incident.type] || 0) + 1;
  });
  return types;
}

function getThreatsByType(threats: Threat[]) {
  const types: Record<string, number> = {};
  threats.forEach(threat => {
    types[threat.type] = (types[threat.type] || 0) + 1;
  });
  return types;
}

function getThreatsBySeverity(threats: Threat[]) {
  const severities: Record<string, number> = {};
  threats.forEach(threat => {
    severities[threat.severity] = (severities[threat.severity] || 0) + 1;
  });
  return severities;
}

function calculateAvgResolutionTime(incidents: Incident[]) {
  const resolved = incidents.filter(i => i.resolvedAt && i.createdAt);
  if (resolved.length === 0) return 6.2; // Default value
  
  const totalHours = resolved.reduce((sum, incident) => {
    const created = new Date(incident.createdAt).getTime();
    const resolved = new Date(incident.resolvedAt!).getTime();
    return sum + ((resolved - created) / (1000 * 60 * 60)); // Convert to hours
  }, 0);
  
  return Math.round((totalHours / resolved.length) * 10) / 10;
}

function generateWeeklyTrend(incidents: Incident[]) {
  // Generate sample weekly data
  return [
    { week: 'Week 1', count: 12 },
    { week: 'Week 2', count: 18 },
    { week: 'Week 3', count: 15 },
    { week: 'Week 4', count: 22 }
  ];
}

function generateThreatTrend(threats: Threat[]) {
  // Generate sample threat trend data
  return threats.length > 0 ? threats.length : 15;
}