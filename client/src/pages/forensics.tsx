
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
import { Search, FileText, Download, Calendar, Clock, User, HardDrive, Network, Shield, AlertTriangle, Microscope, Database } from "lucide-react";

export function Forensics() {
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("24h");
  const [evidenceType, setEvidenceType] = useState("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/forensics", searchQuery, timeRange, evidenceType],
    refetchInterval: 10000,
  });

  const evidenceItems = [
    {
      id: "EV-2024-001",
      type: "Network Log",
      timestamp: "2024-01-07 14:32:15",
      source: "192.168.1.100",
      size: "2.4 MB",
      hash: "sha256:a1b2c3d4e5f6...",
      status: "Verified",
      severity: "High"
    },
    {
      id: "EV-2024-002",
      type: "System Log",
      timestamp: "2024-01-07 14:28:42",
      source: "Server-01",
      size: "856 KB",
      hash: "sha256:f6e5d4c3b2a1...",
      status: "Analyzing",
      severity: "Medium"
    },
    {
      id: "EV-2024-003",
      type: "Memory Dump",
      timestamp: "2024-01-07 14:25:33",
      source: "Workstation-05",
      size: "1.2 GB",
      hash: "sha256:9f8e7d6c5b4a...",
      status: "Collected",
      severity: "Critical"
    },
    {
      id: "EV-2024-004",
      type: "Packet Capture",
      timestamp: "2024-01-07 14:20:18",
      source: "Network Interface",
      size: "45.3 MB",
      hash: "sha256:3c4d5e6f7a8b...",
      status: "Verified",
      severity: "High"
    }
  ];

  const timelineEvents = [
    {
      time: "14:32:15",
      event: "Suspicious network connection detected",
      source: "IDS System",
      severity: "High",
      details: "Connection to known malicious IP 203.0.113.42"
    },
    {
      time: "14:28:42",
      event: "Unusual process execution",
      source: "EDR Agent",
      severity: "Medium",
      details: "PowerShell executed with suspicious parameters"
    },
    {
      time: "14:25:33",
      event: "Memory anomaly detected",
      source: "Memory Scanner",
      severity: "Critical",
      details: "Code injection patterns identified"
    },
    {
      time: "14:20:18",
      event: "Abnormal traffic pattern",
      source: "Network Monitor",
      severity: "High",
      details: "High volume of encrypted traffic to external IP"
    }
  ];

  const analysisResults = [
    {
      artifact: "suspicious.exe",
      hash: "MD5: a1b2c3d4e5f6789...",
      verdict: "Malware",
      confidence: 95,
      tags: ["trojan", "backdoor", "persistence"]
    },
    {
      artifact: "network_traffic.pcap",
      hash: "SHA1: f6e5d4c3b2a1098...",
      verdict: "Suspicious",
      confidence: 78,
      tags: ["c2-communication", "exfiltration"]
    },
    {
      artifact: "system_memory.dmp",
      hash: "SHA256: 9f8e7d6c5b4a321...",
      verdict: "Compromised",
      confidence: 89,
      tags: ["injection", "rootkit", "privilege-escalation"]
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
            <p className="text-gray-300">Failed to load forensics data</p>
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
            <p className="cyber-text-primary text-lg">Loading Digital Forensics...</p>
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
      case 'Verified': return 'bg-green-600 text-white';
      case 'Analyzing': return 'bg-blue-500 text-white';
      case 'Collected': return 'bg-yellow-500 text-black';
      case 'Error': return 'bg-red-600 text-white';
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
              <Microscope className="h-8 w-8" />
              Digital Forensics Lab
            </h1>
            <p className="text-gray-400">Comprehensive digital evidence analysis and investigation</p>
          </div>
          
          <div className="flex gap-4">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Case
            </Button>
            <Button>
              <Database className="h-4 w-4 mr-2" />
              New Investigation
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="border-blue-500/20 bg-card/50 backdrop-blur mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search evidence, hashes, IPs, or case IDs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={evidenceType} onValueChange={setEvidenceType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Evidence</SelectItem>
                  <SelectItem value="network">Network Logs</SelectItem>
                  <SelectItem value="system">System Logs</SelectItem>
                  <SelectItem value="memory">Memory Dumps</SelectItem>
                  <SelectItem value="disk">Disk Images</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Forensics Tabs */}
        <Tabs defaultValue="evidence" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-card/50 backdrop-blur border border-blue-500/20">
            <TabsTrigger value="evidence">Evidence Chain</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="evidence" className="space-y-6">
            <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Evidence Inventory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evidence ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evidenceItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono">{item.id}</TableCell>
                        <TableCell>{item.type}</TableCell>
                        <TableCell>{item.timestamp}</TableCell>
                        <TableCell>{item.source}</TableCell>
                        <TableCell>{item.size}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(item.severity)}>
                            {item.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              Analyze
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

          <TabsContent value="timeline" className="space-y-6">
            <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Incident Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {timelineEvents.map((event, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-gray-800/50 rounded border border-gray-700">
                    <div className="flex-shrink-0 w-20 text-sm text-blue-400 font-mono">
                      {event.time}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{event.event}</h4>
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-1">{event.details}</p>
                      <p className="text-xs text-gray-500">Source: {event.source}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Malware Analysis Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysisResults.map((result, index) => (
                    <div key={index} className="p-4 bg-gray-800/50 rounded border border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{result.artifact}</h4>
                        <Badge variant={result.verdict === "Malware" ? "destructive" : "secondary"}>
                          {result.verdict}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{result.hash}</p>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Confidence:</span>
                        <span className="text-sm font-medium">{result.confidence}%</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {result.tags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Network Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-800/50 rounded">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Suspicious Connections</span>
                        <Badge variant="destructive">23</Badge>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gray-800/50 rounded">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">C&C Communications</span>
                        <Badge variant="destructive">5</Badge>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gray-800/50 rounded">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Data Exfiltration</span>
                        <Badge className="bg-orange-500">2</Badge>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gray-800/50 rounded">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Port Scans</span>
                        <Badge className="bg-yellow-500 text-black">12</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Forensics Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: "Incident Response Report", date: "2024-01-07", status: "Complete" },
                    { name: "Digital Evidence Analysis", date: "2024-01-06", status: "In Progress" },
                    { name: "Malware Analysis Report", date: "2024-01-06", status: "Complete" },
                    { name: "Network Forensics Summary", date: "2024-01-05", status: "Complete" }
                  ].map((report, index) => (
                    <div key={index} className="p-4 bg-gray-800/50 rounded border border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{report.name}</h4>
                        <Badge variant={report.status === "Complete" ? "default" : "secondary"}>
                          {report.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{report.date}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: "Hash Calculator", icon: "🔒", description: "Calculate MD5, SHA1, SHA256 hashes" },
                { name: "Hex Viewer", icon: "🔍", description: "View and analyze binary files" },
                { name: "String Extractor", icon: "📝", description: "Extract readable strings from files" },
                { name: "Packet Analyzer", icon: "📡", description: "Deep packet inspection tool" },
                { name: "Registry Viewer", icon: "🗂️", description: "Windows registry analysis" },
                { name: "Memory Dump Analyzer", icon: "🧠", description: "Analyze memory dumps" }
              ].map((tool, index) => (
                <Card key={index} className="border-blue-500/20 bg-card/50 backdrop-blur cursor-pointer hover:bg-card/70 transition-colors">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl mb-3">{tool.icon}</div>
                    <h3 className="font-medium mb-2">{tool.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">{tool.description}</p>
                    <Button size="sm" variant="outline" className="w-full">
                      Launch Tool
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
