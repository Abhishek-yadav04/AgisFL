
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, AlertTriangle, Clock, User, Shield, CheckCircle, XCircle, Eye, FileText, Calendar } from "lucide-react";

export function Incidents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedIncident, setSelectedIncident] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/incidents", searchQuery, statusFilter, severityFilter],
    refetchInterval: 5000,
  });

  const incidents = [
    {
      id: "INC-2024-001",
      title: "Suspicious Network Activity Detected",
      description: "Multiple failed login attempts from external IP addresses",
      severity: "High",
      status: "Active",
      assignee: "John Smith",
      created: "2024-01-07 14:30:00",
      updated: "2024-01-07 15:45:00",
      type: "Security Breach",
      source: "Network Monitor",
      affectedSystems: ["Web Server", "Database"],
      estimatedImpact: "Medium"
    },
    {
      id: "INC-2024-002",
      title: "Malware Detection on Workstation",
      description: "Trojan detected on employee workstation via endpoint detection",
      severity: "Critical",
      status: "Investigating",
      assignee: "Jane Doe",
      created: "2024-01-07 13:15:00",
      updated: "2024-01-07 15:30:00",
      type: "Malware",
      source: "EDR System",
      affectedSystems: ["Workstation-042"],
      estimatedImpact: "Low"
    },
    {
      id: "INC-2024-003",
      title: "DDoS Attack Attempt",
      description: "High volume of requests targeting web application",
      severity: "High",
      status: "Mitigated",
      assignee: "Mike Johnson",
      created: "2024-01-07 12:00:00",
      updated: "2024-01-07 14:20:00",
      type: "DDoS",
      source: "WAF",
      affectedSystems: ["Web Application", "Load Balancer"],
      estimatedImpact: "High"
    },
    {
      id: "INC-2024-004",
      title: "Unauthorized Access Attempt",
      description: "Failed privilege escalation attempts detected",
      severity: "Medium",
      status: "Resolved",
      assignee: "Sarah Wilson",
      created: "2024-01-07 10:30:00",
      updated: "2024-01-07 12:45:00",
      type: "Access Control",
      source: "SIEM",
      affectedSystems: ["Domain Controller"],
      estimatedImpact: "Low"
    }
  ];

  const incidentTypes = [
    { type: "Security Breach", count: 15, trend: "+3" },
    { type: "Malware", count: 8, trend: "-2" },
    { type: "DDoS", count: 12, trend: "+5" },
    { type: "Access Control", count: 6, trend: "0" },
    { type: "Data Loss", count: 3, trend: "-1" },
    { type: "Phishing", count: 9, trend: "+2" }
  ];

  const responseTeam = [
    { name: "John Smith", role: "Lead Analyst", status: "Available", cases: 3 },
    { name: "Jane Doe", role: "Malware Specialist", status: "Busy", cases: 2 },
    { name: "Mike Johnson", role: "Network Security", status: "Available", cases: 1 },
    { name: "Sarah Wilson", role: "Forensics Expert", status: "Available", cases: 2 }
  ];

  if (error) {
    return (
      <div className="min-h-screen cyber-gradient">
        <TopBar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-500 mb-2">Connection Error</h2>
            <p className="text-gray-300">Failed to load incidents data</p>
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
            <p className="cyber-text-primary text-lg">Loading Incident Response...</p>
          </div>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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
      case 'Investigating': return 'bg-blue-500 text-white';
      case 'Mitigated': return 'bg-yellow-500 text-black';
      case 'Resolved': return 'bg-green-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <AlertTriangle className="h-4 w-4" />;
      case 'Investigating': return <Eye className="h-4 w-4" />;
      case 'Mitigated': return <Shield className="h-4 w-4" />;
      case 'Resolved': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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
              <Shield className="h-8 w-8" />
              Incident Response Center
            </h1>
            <p className="text-gray-400">Centralized security incident management and response coordination</p>
          </div>
          
          <div className="flex gap-4">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Incident
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Incident</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Title</label>
                      <Input placeholder="Incident title" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Severity</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Type</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="security-breach">Security Breach</SelectItem>
                          <SelectItem value="malware">Malware</SelectItem>
                          <SelectItem value="ddos">DDoS</SelectItem>
                          <SelectItem value="access-control">Access Control</SelectItem>
                          <SelectItem value="data-loss">Data Loss</SelectItem>
                          <SelectItem value="phishing">Phishing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Assignee</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Assign to" />
                        </SelectTrigger>
                        <SelectContent>
                          {responseTeam.map((member) => (
                            <SelectItem key={member.name} value={member.name}>
                              {member.name} - {member.role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea placeholder="Detailed incident description" rows={4} />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Create Incident</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Incidents</p>
                  <p className="text-2xl font-bold text-red-500">23</p>
                  <p className="text-xs text-red-500">↑ 15% vs last week</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg Response Time</p>
                  <p className="text-2xl font-bold text-blue-500">12m</p>
                  <p className="text-xs text-green-500">↓ 23% improvement</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Resolution Rate</p>
                  <p className="text-2xl font-bold text-green-500">94.2%</p>
                  <p className="text-xs text-green-500">↑ 2.1% vs last week</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Team Utilization</p>
                  <p className="text-2xl font-bold text-yellow-500">78%</p>
                  <p className="text-xs text-yellow-500">Optimal range</p>
                </div>
                <User className="h-8 w-8 text-yellow-500" />
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
                  placeholder="Search incidents by ID, title, or description..."
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
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="mitigated">Mitigated</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Incident Management Tabs */}
        <Tabs defaultValue="incidents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur border border-blue-500/20">
            <TabsTrigger value="incidents">Active Incidents</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="team">Response Team</TabsTrigger>
            <TabsTrigger value="playbooks">Playbooks</TabsTrigger>
          </TabsList>

          <TabsContent value="incidents" className="space-y-6">
            <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Incident Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents.map((incident) => (
                      <TableRow key={incident.id}>
                        <TableCell className="font-mono">{incident.id}</TableCell>
                        <TableCell className="max-w-xs truncate">{incident.title}</TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(incident.severity)}>
                            {incident.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(incident.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(incident.status)}
                              {incident.status}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>{incident.assignee}</TableCell>
                        <TableCell>{incident.created}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>{incident.title}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Incident ID</label>
                                      <p className="font-mono">{incident.id}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Type</label>
                                      <p>{incident.type}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Severity</label>
                                      <Badge className={getSeverityColor(incident.severity)}>
                                        {incident.severity}
                                      </Badge>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Status</label>
                                      <Badge className={getStatusColor(incident.status)}>
                                        {incident.status}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium">Description</label>
                                    <p className="text-gray-300">{incident.description}</p>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Affected Systems</label>
                                      <div className="flex flex-wrap gap-1">
                                        {incident.affectedSystems.map((system, index) => (
                                          <Badge key={index} variant="outline">{system}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Estimated Impact</label>
                                      <p>{incident.estimatedImpact}</p>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
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

          <TabsContent value="statistics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle>Incident Types Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {incidentTypes.map((type, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-800/50 rounded">
                      <span>{type.type}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{type.count}</span>
                        <span className={`text-sm ${type.trend.startsWith('+') ? 'text-red-500' : type.trend.startsWith('-') ? 'text-green-500' : 'text-gray-400'}`}>
                          {type.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle>Resolution Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Average Resolution Time</span>
                      <span className="text-blue-500">4.2 hours</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>First Response Time</span>
                      <span className="text-green-500">12 minutes</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Escalation Rate</span>
                      <span className="text-yellow-500">12%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Response Team Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {responseTeam.map((member, index) => (
                    <div key={index} className="p-4 bg-gray-800/50 rounded border border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{member.name}</h4>
                          <p className="text-sm text-gray-400">{member.role}</p>
                        </div>
                        <Badge variant={member.status === "Available" ? "default" : "secondary"}>
                          {member.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Active Cases:</span>
                        <span className="font-medium">{member.cases}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="playbooks" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: "Malware Response", steps: 12, lastUpdated: "2024-01-01" },
                { name: "DDoS Mitigation", steps: 8, lastUpdated: "2024-01-02" },
                { name: "Data Breach Protocol", steps: 15, lastUpdated: "2024-01-03" },
                { name: "Phishing Investigation", steps: 10, lastUpdated: "2024-01-04" },
                { name: "Insider Threat", steps: 18, lastUpdated: "2024-01-05" },
                { name: "Ransomware Response", steps: 20, lastUpdated: "2024-01-06" }
              ].map((playbook, index) => (
                <Card key={index} className="border-blue-500/20 bg-card/50 backdrop-blur cursor-pointer hover:bg-card/70 transition-colors">
                  <CardContent className="p-6">
                    <h3 className="font-medium mb-2">{playbook.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">{playbook.steps} steps</p>
                    <p className="text-xs text-gray-500 mb-4">Updated: {playbook.lastUpdated}</p>
                    <Button size="sm" variant="outline" className="w-full">
                      View Playbook
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
