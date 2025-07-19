import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TopBar } from '@/components/layout/TopBar';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart, 
  PieChart, 
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Database,
  Network,
  Activity
} from 'lucide-react';

interface Report {
  id: string;
  title: string;
  type: 'Security Summary' | 'Threat Analysis' | 'Compliance' | 'Performance' | 'Incident Response';
  status: 'Generated' | 'Processing' | 'Draft' | 'Published';
  createdAt: string;
  generatedBy: string;
  size: string;
  format: 'PDF' | 'CSV' | 'JSON' | 'HTML';
}

interface ReportMetrics {
  totalThreats: number;
  threatsBlocked: number;
  systemUptime: number;
  complianceScore: number;
  incidentResponse: number;
  networkHealth: number;
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [metrics, setMetrics] = useState<ReportMetrics>({
    totalThreats: 0,
    threatsBlocked: 0,
    systemUptime: 0,
    complianceScore: 0,
    incidentResponse: 0,
    networkHealth: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('/api/reports');
        if (response.ok) {
          const data = await response.json();
          setReports(data.reports || []);
          setMetrics(data.metrics || {});
        } else {
          throw new Error('Failed to fetch reports');
        }
      } catch (err) {
        console.error('Reports data error:', err);
        setError('Failed to connect to backend services');
        // Mock data for demonstration
        setReports([
          {
            id: 'RPT-2024-001',
            title: 'Monthly Security Summary - January 2024',
            type: 'Security Summary',
            status: 'Published',
            createdAt: new Date().toISOString(),
            generatedBy: 'Security System',
            size: '2.4 MB',
            format: 'PDF'
          },
          {
            id: 'RPT-2024-002',
            title: 'Threat Analysis Report - Q1 2024',
            type: 'Threat Analysis',
            status: 'Generated',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            generatedBy: 'Dr. Sarah Johnson',
            size: '1.8 MB',
            format: 'PDF'
          },
          {
            id: 'RPT-2024-003',
            title: 'Compliance Audit Results',
            type: 'Compliance',
            status: 'Processing',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            generatedBy: 'Compliance Team',
            size: '3.2 MB',
            format: 'HTML'
          },
          {
            id: 'RPT-2024-004',
            title: 'System Performance Metrics',
            type: 'Performance',
            status: 'Draft',
            createdAt: new Date(Date.now() - 259200000).toISOString(),
            generatedBy: 'System Monitor',
            size: '854 KB',
            format: 'CSV'
          }
        ]);
        setMetrics({
          totalThreats: 247,
          threatsBlocked: 195,
          systemUptime: 99.8,
          complianceScore: 94,
          incidentResponse: 87,
          networkHealth: 96
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
    const interval = setInterval(fetchReports, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerateReport = async (type: string) => {
    setIsGenerating(true);
    // Simulate report generation
    setTimeout(() => {
      const newReport: Report = {
        id: `RPT-2024-${String(reports.length + 1).padStart(3, '0')}`,
        title: `${type} Report - ${new Date().toLocaleDateString()}`,
        type: type as any,
        status: 'Generated',
        createdAt: new Date().toISOString(),
        generatedBy: 'Current User',
        size: `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 9)} MB`,
        format: 'PDF'
      };
      setReports([newReport, ...reports]);
      setIsGenerating(false);
    }, 3000);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <TopBar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-400 mb-2">Connection Error</h2>
            <p className="text-slate-300">Failed to load reports data</p>
            <Button onClick={() => window.location.reload()} className="mt-4 bg-blue-600 hover:bg-blue-700">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <TopBar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-blue-400 text-lg">Loading Reports...</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published': return 'bg-green-600 text-white';
      case 'Generated': return 'bg-blue-600 text-white';
      case 'Processing': return 'bg-yellow-600 text-white';
      case 'Draft': return 'bg-gray-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Security Summary': return <Shield className="h-4 w-4" />;
      case 'Threat Analysis': return <AlertTriangle className="h-4 w-4" />;
      case 'Compliance': return <CheckCircle className="h-4 w-4" />;
      case 'Performance': return <TrendingUp className="h-4 w-4" />;
      case 'Incident Response': return <Clock className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <TopBar />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Security Reports</h1>
            <p className="text-slate-400 mt-2">
              Generate, manage, and analyze comprehensive security reports
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-slate-700 text-slate-300">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Report
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => handleGenerateReport('Security Summary')}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Security Score</h3>
                <Shield className="h-8 w-8 text-green-500" />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Threats Blocked</span>
                    <span className="text-white">{((metrics.threatsBlocked / metrics.totalThreats) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(metrics.threatsBlocked / metrics.totalThreats) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">System Uptime</span>
                    <span className="text-white">{metrics.systemUptime}%</span>
                  </div>
                  <Progress value={metrics.systemUptime} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Compliance</h3>
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Compliance Score</span>
                    <span className="text-white">{metrics.complianceScore}%</span>
                  </div>
                  <Progress value={metrics.complianceScore} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Network Health</span>
                    <span className="text-white">{metrics.networkHealth}%</span>
                  </div>
                  <Progress value={metrics.networkHealth} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Response Metrics</h3>
                <Activity className="h-8 w-8 text-orange-500" />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Incident Response</span>
                    <span className="text-white">{metrics.incidentResponse}%</span>
                  </div>
                  <Progress value={metrics.incidentResponse} className="h-2" />
                </div>
                <div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{reports.length}</div>
                    <div className="text-slate-400 text-sm">Total Reports</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
            <TabsTrigger value="reports" className="data-[state=active]:bg-blue-600">All Reports</TabsTrigger>
            <TabsTrigger value="generate" className="data-[state=active]:bg-blue-600">Generate</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600">Analytics</TabsTrigger>
            <TabsTrigger value="scheduled" className="data-[state=active]:bg-blue-600">Scheduled</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Generated Reports
                </CardTitle>
                <CardDescription className="text-slate-400">
                  View and download all generated security reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="bg-slate-700 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getTypeIcon(report.type)}
                            <h3 className="text-white font-semibold">{report.title}</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-slate-400">Report ID</p>
                              <p className="text-blue-400 font-mono">{report.id}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Generated By</p>
                              <p className="text-white">{report.generatedBy}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Size</p>
                              <p className="text-white">{report.size}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Created</p>
                              <p className="text-white">{new Date(report.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                          <Badge variant="outline" className="text-slate-300">
                            {report.format}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Download className="mr-2 h-3 w-3" />
                          Download
                        </Button>
                        <Button size="sm" variant="outline" className="border-slate-600">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generate" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { type: 'Security Summary', icon: Shield, desc: 'Comprehensive overview of security posture and threats' },
                { type: 'Threat Analysis', icon: AlertTriangle, desc: 'Detailed analysis of detected threats and patterns' },
                { type: 'Compliance', icon: CheckCircle, desc: 'Compliance status and audit results' },
                { type: 'Performance', icon: TrendingUp, desc: 'System performance metrics and optimization' },
                { type: 'Incident Response', icon: Clock, desc: 'Incident handling and response time analysis' }
              ].map(({ type, icon: Icon, desc }) => (
                <Card key={type} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {type}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {desc}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleGenerateReport(type)}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Generate {type}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart className="h-5 w-5" />
                    Report Generation Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['Security Summary', 'Threat Analysis', 'Compliance', 'Performance'].map((type, index) => (
                      <div key={type}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-300">{type}</span>
                          <span className="text-white">{Math.floor(Math.random() * 50) + 10} reports</span>
                        </div>
                        <Progress value={Math.floor(Math.random() * 80) + 20} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Report Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">45%</div>
                      <div className="text-slate-400 text-sm">Security Reports</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">30%</div>
                      <div className="text-slate-400 text-sm">Compliance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">15%</div>
                      <div className="text-slate-400 text-sm">Performance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">10%</div>
                      <div className="text-slate-400 text-sm">Other</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Scheduled Reports
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Manage automated report generation schedules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: 'Daily Security Summary', frequency: 'Daily at 6:00 AM', nextRun: 'Tomorrow 6:00 AM' },
                    { type: 'Weekly Threat Analysis', frequency: 'Every Monday', nextRun: 'Monday 9:00 AM' },
                    { type: 'Monthly Compliance', frequency: 'First day of month', nextRun: 'Next month' }
                  ].map((schedule, index) => (
                    <div key={index} className="bg-slate-700 p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <h3 className="text-white font-medium">{schedule.type}</h3>
                        <p className="text-slate-400 text-sm">{schedule.frequency}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-300 text-sm">Next run:</p>
                        <p className="text-white font-medium">{schedule.nextRun}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}