
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Search, Plus, AlertTriangle, Clock, User, FileText, Database, Network, Eye, Download, Calendar, Filter } from "lucide-react";

export function Investigation() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/investigations", searchQuery, statusFilter, priorityFilter],
    refetchInterval: 10000,
  });

  const investigations = [
    {
      id: "INV-2024-001",
      title: "Advanced Persistent Threat Investigation",
      description: "Investigation into sophisticated APT campaign targeting financial data",
      priority: "Critical",
      status: "Active",
      investigator: "John Smith",
      created: "2024-01-05 09:00:00",
      deadline: "2024-01-15 17:00:00",
      progress: 65,
      evidenceCount: 47,
      findings: 12,
      category: "Advanced Threat"
    },
    {
      id: "INV-2024-002",
      title: "Data Exfiltration Analysis",
      description: "Investigating unauthorized data transfer from production database",
      priority: "High",
      status: "In Progress",
      investigator: "Jane Doe",
      created: "2024-01-06 14:30:00",
      deadline: "2024-01-12 12:00:00",
      progress: 80,
      evidenceCount: 32,
      findings: 8,
      category: "Data Breach"
    },
    {
      id: "INV-2024-003",
      title: "Insider Threat Assessment",
      description: "Investigation into anomalous employee access patterns",
      priority: "Medium",
      status: "Review",
      investigator: "Mike Johnson",
      created: "2024-01-04 11:15:00",
      deadline: "2024-01-10 16:00:00",
      progress: 90,
      evidenceCount: 28,
      findings: 6,
      category: "Insider Threat"
    },
    {
      id: "INV-2024-004",
      title: "Malware Campaign Analysis",
      description: "Detailed analysis of new malware strain affecting multiple endpoints",
      priority: "High",
      status: "Completed",
      investigator: "Sarah Wilson",
      created: "2024-01-03 08:45:00",
      deadline: "2024-01-09 15:00:00",
      progress: 100,
      evidenceCount: 64,
      findings: 15,
      category: "Malware"
    }
  ];

  const evidenceTypes = [
    { type: "Network Logs", count: 156, percentage: 35 },
    { type: "System Logs", count: 124, percentage: 28 },
    { type: "Email Headers", count: 89, percentage: 20 },
    { type: "File Artifacts", count: 67, percentage: 15 },
    { type: "Memory Dumps", count: 34, percentage: 8 },
    { type: "Registry Data", count: 23, percentage: 5 }
  ];

  const investigationPhases = [
    { phase: "Preparation", status: "Completed", progress: 100 },
    { phase: "Identification", status: "Completed", progress: 100 },
    { phase: "Containment", status: "In Progress", progress: 75 },
    { phase: "Analysis", status: "In Progress", progress: 60 },
    { phase: "Recovery", status: "Pending", progress: 0 },
    { phase: "Lessons Learned", status: "Pending", progress: 0 }
  ];

  const timeline = [
    {
      timestamp: "2024-01-07 14:30:00",
      event: "Investigation INV-2024-001 created",
      investigator: "John Smith",
      category: "Administrative",
      details: "APT investigation initiated following threat intelligence alert"
    },
    {
      timestamp: "2024-01-07 14:45:00",
      event: "Evidence collection started",
      investigator: "John Smith",
      category: "Collection",
      details: "Network traffic capture initiated for 192.168.1.0/24 subnet"
    },
    {
      timestamp: "2024-01-07 15:15:00",
      event: "Malicious IP identified",
      investigator: "Jane Doe",
      category: "Analysis",
      details: "C&C server 203.0.113.42 identified through traffic analysis"
    },
    {
      timestamp: "2024-01-07 15:30:00",
      event: "Additional evidence collected",
      investigator: "Mike Johnson",
      category: "Collection",
      details: "Memory dumps collected from 3 affected workstations"
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
            <p className="text-gray-300">Failed to load investigation data</p>
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
            <p className="cyber-text-primary text-lg">Loading Investigation Center...</p>
          </div>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-600 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Medium': return 'bg-yellow-500 text-black';
      case 'Low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-red-600 text-white';
      case 'In Progress': return 'bg-blue-500 text-white';
      case 'Review': return 'bg-yellow-500 text-black';
      case 'Completed': return 'bg-green-600 text-white';
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
              Investigation Center
            </h1>
            <p className="text-gray-400">Advanced threat investigation and digital forensics management</p>
          </div>
          
          <div className="flex gap-4">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Case Files
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Investigation
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Cases</p>
                  <p className="text-2xl font-bold text-red-500">12</p>
                  <p className="text-xs text-red-500">↑ 3 new this week</p>
                </div>
                <FileText className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Evidence Items</p>
                  <p className="text-2xl font-bold text-blue-500">1,247</p>
                  <p className="text-xs text-green-500">↑ 156 collected today</p>
                </div>
                <Database className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg Case Time</p>
                  <p className="text-2xl font-bold text-yellow-500">8.4d</p>
                  <p className="text-xs text-green-500">↓ 1.2d improvement</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Success Rate</p>
                  <p className="text-2xl font-bold text-green-500">96.7%</p>
                  <p className="text-xs text-green-500">↑ 2.1% vs last month</p>
                </div>
                <Eye className="h-8 w-8 text-green-500" />
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
                  placeholder="Search investigations by ID, title, or investigator..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Investigation Management Tabs */}
        <Tabs defaultValue="cases" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-card/50 backdrop-blur border border-blue-500/20">
            <TabsTrigger value="cases">Active Cases</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="methodology">Methodology</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="cases" className="space-y-6">
            <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Investigation Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Case ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Investigator</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investigations.map((investigation) => (
                      <TableRow key={investigation.id}>
                        <TableCell className="font-mono">{investigation.id}</TableCell>
                        <TableCell className="max-w-xs truncate">{investigation.title}</TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(investigation.priority)}>
                            {investigation.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(investigation.status)}>
                            {investigation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="w-24">
                            <Progress value={investigation.progress} className="h-2" />
                            <span className="text-xs text-gray-400">{investigation.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{investigation.investigator}</TableCell>
                        <TableCell>{investigation.deadline}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evidence" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Evidence Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {evidenceTypes.map((evidence, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{evidence.type}</span>
                        <span className="text-sm font-medium">{evidence.count} items</span>
                      </div>
                      <Progress value={evidence.percentage} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Investigation Phases
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {investigationPhases.map((phase, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{phase.phase}</span>
                        <Badge variant={phase.status === "Completed" ? "default" : phase.status === "In Progress" ? "secondary" : "outline"}>
                          {phase.status}
                        </Badge>
                      </div>
                      <Progress value={phase.progress} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Investigation Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-gray-800/50 rounded border border-gray-700">
                    <div className="flex-shrink-0 w-32 text-sm text-blue-400 font-mono">
                      {event.timestamp}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{event.event}</h4>
                        <Badge variant="outline">{event.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-1">{event.details}</p>
                      <p className="text-xs text-gray-500">Investigator: {event.investigator}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="methodology" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: "NIST Framework", description: "Structured incident response methodology", steps: 6 },
                { name: "SANS Methodology", description: "Comprehensive digital forensics process", steps: 8 },
                { name: "OWASP Guidelines", description: "Application security investigation", steps: 5 },
                { name: "ISO 27035", description: "Information security incident management", steps: 7 },
                { name: "Custom Playbook", description: "Organization-specific procedures", steps: 12 },
                { name: "Threat Hunting", description: "Proactive threat detection process", steps: 4 }
              ].map((methodology, index) => (
                <Card key={index} className="border-blue-500/20 bg-card/50 backdrop-blur cursor-pointer hover:bg-card/70 transition-colors">
                  <CardContent className="p-6">
                    <h3 className="font-medium mb-2">{methodology.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">{methodology.description}</p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs text-gray-500">{methodology.steps} steps</span>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    <Button size="sm" variant="outline" className="w-full">
                      View Framework
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Investigation Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: "APT Campaign Analysis Report", case: "INV-2024-001", date: "2024-01-07", status: "Draft" },
                    { title: "Data Exfiltration Investigation", case: "INV-2024-002", date: "2024-01-06", status: "Review" },
                    { title: "Insider Threat Assessment", case: "INV-2024-003", date: "2024-01-05", status: "Final" },
                    { title: "Malware Campaign Summary", case: "INV-2024-004", date: "2024-01-04", status: "Final" }
                  ].map((report, index) => (
                    <div key={index} className="p-4 bg-gray-800/50 rounded border border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{report.title}</h4>
                        <Badge variant={report.status === "Final" ? "default" : "secondary"}>
                          {report.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-1">Case: {report.case}</p>
                      <p className="text-sm text-gray-400 mb-3">{report.date}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
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
