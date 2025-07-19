
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { FileText, Download, Calendar as CalendarIcon, Filter, TrendingUp, Shield, AlertTriangle, Eye, Plus, Search } from "lucide-react";

export function Reports() {
  const [searchQuery, setSearchQuery] = useState("");
  const [reportType, setReportType] = useState("all");
  const [timeRange, setTimeRange] = useState("7d");
  const [date, setDate] = useState<Date>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/reports", searchQuery, reportType, timeRange],
    refetchInterval: 30000,
  });

  const reports = [
    {
      id: "RPT-2024-001",
      title: "Weekly Security Summary",
      type: "Security",
      description: "Comprehensive overview of security events and metrics",
      status: "Published",
      created: "2024-01-07 09:00:00",
      author: "Security Team",
      size: "2.4 MB",
      downloads: 45,
      schedule: "Weekly"
    },
    {
      id: "RPT-2024-002",
      title: "Threat Intelligence Digest",
      type: "Intelligence",
      description: "Latest threat indicators and analysis",
      status: "Draft",
      created: "2024-01-07 14:30:00",
      author: "Threat Team",
      size: "1.8 MB",
      downloads: 23,
      schedule: "Daily"
    },
    {
      id: "RPT-2024-003",
      title: "Compliance Assessment",
      type: "Compliance",
      description: "SOC 2 Type II compliance status report",
      status: "Review",
      created: "2024-01-06 16:45:00",
      author: "Compliance Team",
      size: "3.2 MB",
      downloads: 12,
      schedule: "Monthly"
    },
    {
      id: "RPT-2024-004",
      title: "Incident Response Metrics",
      type: "Operations",
      description: "Performance metrics for incident response activities",
      status: "Published",
      created: "2024-01-06 11:20:00",
      author: "SOC Team",
      size: "1.5 MB",
      downloads: 67,
      schedule: "Weekly"
    }
  ];

  const reportMetrics = [
    { period: "Jan 1", generated: 12, downloaded: 145, views: 234 },
    { period: "Jan 2", generated: 8, downloaded: 123, views: 198 },
    { period: "Jan 3", generated: 15, downloaded: 167, views: 287 },
    { period: "Jan 4", generated: 10, downloaded: 134, views: 221 },
    { period: "Jan 5", generated: 14, downloaded: 156, views: 265 },
    { period: "Jan 6", generated: 11, downloaded: 142, views: 243 },
    { period: "Jan 7", generated: 13, downloaded: 178, views: 298 }
  ];

  const reportTypes = [
    { name: "Security Reports", count: 45, color: "#ef4444" },
    { name: "Compliance Reports", count: 23, color: "#3b82f6" },
    { name: "Intelligence Reports", count: 34, color: "#f59e0b" },
    { name: "Operations Reports", count: 28, color: "#10b981" },
    { name: "Executive Summaries", count: 12, color: "#8b5cf6" }
  ];

  const templates = [
    {
      name: "Security Incident Report",
      description: "Standard template for security incident documentation",
      category: "Incident Response",
      lastUsed: "2024-01-07",
      downloads: 156
    },
    {
      name: "Threat Intelligence Brief",
      description: "Template for threat intelligence summaries",
      category: "Intelligence",
      lastUsed: "2024-01-06",
      downloads: 89
    },
    {
      name: "Compliance Audit Report",
      description: "Comprehensive compliance assessment template",
      category: "Compliance",
      lastUsed: "2024-01-05",
      downloads: 67
    },
    {
      name: "Executive Dashboard",
      description: "High-level security metrics for leadership",
      category: "Executive",
      lastUsed: "2024-01-04",
      downloads: 123
    }
  ];

  if (error) {
    return (
      <div className="min-h-screen cyber-gradient">
        <TopBar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-500 mb-2">Connection Error</h2>
            <p className="text-gray-300">Failed to load reports data</p>
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
            <p className="cyber-text-primary text-lg">Loading Reports Center...</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published': return 'bg-green-600 text-white';
      case 'Draft': return 'bg-yellow-500 text-black';
      case 'Review': return 'bg-blue-500 text-white';
      case 'Archived': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="min-h-screen cyber-gradient">
      <TopBar />
      
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold cyber-text-primary mb-2 flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Reports & Analytics
            </h1>
            <p className="text-gray-400">Comprehensive security reporting and business intelligence</p>
          </div>
          
          <div className="flex gap-4">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Bulk Export
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Reports Generated</p>
                  <p className="text-2xl font-bold text-blue-500">142</p>
                  <p className="text-xs text-green-500">↑ 12% vs last week</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Downloads</p>
                  <p className="text-2xl font-bold text-green-500">1,847</p>
                  <p className="text-xs text-green-500">↑ 23% vs last week</p>
                </div>
                <Download className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Users</p>
                  <p className="text-2xl font-bold text-yellow-500">89</p>
                  <p className="text-xs text-green-500">↑ 5% vs last week</p>
                </div>
                <Eye className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Automation Rate</p>
                  <p className="text-2xl font-bold text-purple-500">78%</p>
                  <p className="text-xs text-green-500">↑ 8% vs last month</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-blue-500/20 bg-card/50 backdrop-blur mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search reports by title, author, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="intelligence">Intelligence</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Today</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Custom Date
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Reports Tabs */}
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-card/50 backdrop-blur border border-blue-500/20">
            <TabsTrigger value="reports">Report Library</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Report Library
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reports.map((report) => (
                    <div key={report.id} className="p-4 bg-gray-800/50 rounded border border-gray-700 hover:bg-gray-800/70 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{report.title}</h4>
                          <p className="text-sm text-gray-400 mb-2">{report.description}</p>
                        </div>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-400">
                        <div className="flex justify-between">
                          <span>Type:</span>
                          <span>{report.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span>{report.size}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Downloads:</span>
                          <span>{report.downloads}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Created:</span>
                          <span>{report.created.split(' ')[0]}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Report Generation Trends */}
              <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Report Generation Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportMetrics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="period" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '6px'
                        }}
                      />
                      <Line type="monotone" dataKey="generated" stroke="#3b82f6" strokeWidth={2} name="Generated" />
                      <Line type="monotone" dataKey="downloaded" stroke="#10b981" strokeWidth={2} name="Downloaded" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Report Types Distribution */}
              <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Report Types Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportTypes}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {reportTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Usage Statistics */}
            <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Usage Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="period" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="views" fill="#8b5cf6" name="Page Views" />
                    <Bar dataKey="downloaded" fill="#10b981" name="Downloads" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Report Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template, index) => (
                    <div key={index} className="p-4 bg-gray-800/50 rounded border border-gray-700 hover:bg-gray-800/70 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium mb-1">{template.name}</h4>
                          <p className="text-sm text-gray-400 mb-2">{template.description}</p>
                        </div>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-400 mb-4">
                        <div className="flex justify-between">
                          <span>Last Used:</span>
                          <span>{template.lastUsed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Downloads:</span>
                          <span>{template.downloads}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          Use Template
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduler" className="space-y-6">
            <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Scheduled Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Daily Threat Summary", schedule: "Daily at 8:00 AM", status: "Active", nextRun: "2024-01-08 08:00" },
                    { name: "Weekly Security Report", schedule: "Every Monday at 9:00 AM", status: "Active", nextRun: "2024-01-08 09:00" },
                    { name: "Monthly Compliance Report", schedule: "1st of every month", status: "Active", nextRun: "2024-02-01 09:00" },
                    { name: "Executive Dashboard", schedule: "Every Friday at 5:00 PM", status: "Paused", nextRun: "N/A" }
                  ].map((schedule, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gray-800/50 rounded border border-gray-700">
                      <div>
                        <h4 className="font-medium">{schedule.name}</h4>
                        <p className="text-sm text-gray-400">{schedule.schedule}</p>
                        <p className="text-xs text-gray-500">Next run: {schedule.nextRun}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={schedule.status === "Active" ? "default" : "secondary"}>
                          {schedule.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle>Report Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Default Format</label>
                    <Select defaultValue="pdf">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Retention Period</label>
                    <Select defaultValue="90">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="180">180 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Auto-generation</label>
                    <Select defaultValue="enabled">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email notifications</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Slack notifications</span>
                    <input type="checkbox" className="rounded" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Report completion alerts</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Failed generation alerts</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
