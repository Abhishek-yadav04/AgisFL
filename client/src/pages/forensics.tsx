import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Search, Download, Eye, FileText, Hash, Clock, Server, Monitor, HardDrive, Network, Zap, Shield } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Incident, Threat } from "@shared/schema";

export default function ForensicsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [evidenceFilter, setEvidenceFilter] = useState("all");
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);

  const { data: incidents } = useQuery<Incident[]>({
    queryKey: ['/api/incidents'],
  });

  const { data: threats } = useQuery<Threat[]>({
    queryKey: ['/api/threats'],
  });

  // Mock forensic evidence data - in real implementation, this would come from forensic tools
  const evidenceData = [
    {
      id: 'EVD-001',
      type: 'Memory Dump',
      source: 'FIN-WS-001',
      timestamp: '2025-01-15T10:30:00Z',
      size: '8.2 GB',
      hash: 'a1b2c3d4e5f6789012345678901234567890abcd',
      status: 'analyzed',
      findings: ['Suspicious process injection', 'Credential dumping evidence', 'C2 communication artifacts']
    },
    {
      id: 'EVD-002',
      type: 'Disk Image',
      source: 'FIN-WS-007',
      timestamp: '2025-01-15T11:15:00Z',
      size: '500 GB',
      hash: 'f6e5d4c3b2a1098765432109876543210fedcba',
      status: 'processing',
      findings: ['Deleted file recovery', 'Registry modifications', 'Timeline reconstruction']
    },
    {
      id: 'EVD-003',
      type: 'Network Capture',
      source: 'Network Tap 3',
      timestamp: '2025-01-15T09:45:00Z',
      size: '12.7 GB',
      hash: 'ef123456789abcdef123456789abcdef12345678',
      status: 'analyzed',
      findings: ['Exfiltration traffic', 'Encrypted communications', 'Command & Control beaconing']
    },
    {
      id: 'EVD-004',
      type: 'Log Files',
      source: 'FIN-DC-01',
      timestamp: '2025-01-15T08:20:00Z',
      size: '2.1 GB',
      hash: '9876543210abcdef9876543210abcdef98765432',
      status: 'analyzed',
      findings: ['Authentication anomalies', 'Privilege escalation', 'Lateral movement traces']
    }
  ];

  const artifactDatabase = [
    {
      id: 'ART-001',
      name: 'Cobalt Strike Beacon',
      type: 'Malware',
      hash: 'a1b2c3d4e5f6789012345678901234567890abcd',
      firstSeen: '2025-01-15T10:30:00Z',
      confidence: 95,
      description: 'Command and control beacon with encrypted communication channel'
    },
    {
      id: 'ART-002',
      name: 'Mimikatz Execution',
      type: 'Tool',
      hash: 'f6e5d4c3b2a1098765432109876543210fedcba',
      firstSeen: '2025-01-15T10:35:00Z',
      confidence: 98,
      description: 'Credential dumping tool execution with LSASS access'
    },
    {
      id: 'ART-003',
      name: 'Encrypted Archive',
      type: 'Data',
      hash: 'ef123456789abcdef123456789abcdef12345678',
      firstSeen: '2025-01-15T11:45:00Z',
      confidence: 87,
      description: 'Suspicious encrypted file with customer data patterns'
    }
  ];

  const timelineData = [
    { time: '08:15:32', event: 'Initial phishing email received', source: 'Email Gateway', severity: 'Low' },
    { time: '08:17:45', event: 'Malicious attachment opened', source: 'FIN-WS-001', severity: 'High' },
    { time: '08:18:12', event: 'PowerShell execution detected', source: 'FIN-WS-001', severity: 'Medium' },
    { time: '08:20:33', event: 'Credential dumping activity', source: 'FIN-WS-001', severity: 'Critical' },
    { time: '08:25:17', event: 'Lateral movement to FIN-WS-007', source: 'Network', severity: 'Critical' },
    { time: '08:30:54', event: 'C2 communication established', source: 'Firewall', severity: 'Critical' },
    { time: '09:15:22', event: 'Data staging detected', source: 'FIN-WS-007', severity: 'High' },
    { time: '09:45:33', event: 'Exfiltration attempt blocked', source: 'DLP System', severity: 'Critical' }
  ];

  const filteredEvidence = evidenceData.filter(evidence => {
    const matchesSearch = evidence.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         evidence.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         evidence.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = evidenceFilter === "all" || evidence.status === evidenceFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'analyzed': return 'bg-green-500/20 text-green-400';
      case 'processing': return 'bg-yellow-500/20 text-yellow-400';
      case 'pending': return 'bg-blue-500/20 text-blue-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
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
                <h1 className="text-2xl font-bold text-white">Digital Forensics Lab</h1>
                <p className="text-gray-400">Evidence acquisition, analysis, and chain of custody management</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button className="bg-primary hover:bg-primary/80">
                  <Zap className="h-4 w-4 mr-2" />
                  Auto Analysis
                </Button>
              </div>
            </div>

            {/* Forensic Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="surface card-elevation">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <HardDrive className="h-8 w-8 text-blue-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{evidenceData.length}</p>
                      <p className="text-sm text-gray-400">Evidence Items</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="surface card-elevation">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Hash className="h-8 w-8 text-green-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{artifactDatabase.length}</p>
                      <p className="text-sm text-gray-400">Artifacts Found</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="surface card-elevation">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-8 w-8 text-orange-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{timelineData.length}</p>
                      <p className="text-sm text-gray-400">Timeline Events</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="surface card-elevation">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-8 w-8 text-purple-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">12.7h</p>
                      <p className="text-sm text-gray-400">Attack Duration</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="evidence" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5 bg-gray-800">
                <TabsTrigger value="evidence">Evidence Management</TabsTrigger>
                <TabsTrigger value="artifacts">Artifact Analysis</TabsTrigger>
                <TabsTrigger value="timeline">Timeline Reconstruction</TabsTrigger>
                <TabsTrigger value="memory">Memory Analysis</TabsTrigger>
                <TabsTrigger value="network">Network Forensics</TabsTrigger>
              </TabsList>

              <TabsContent value="evidence" className="space-y-6">
                {/* Evidence Filters */}
                <Card className="surface card-elevation">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search evidence by ID, type, or source..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 surface-variant border-gray-600"
                          />
                        </div>
                      </div>
                      <Select value={evidenceFilter} onValueChange={setEvidenceFilter}>
                        <SelectTrigger className="w-[180px] surface-variant border-gray-600">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="analyzed">Analyzed</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Evidence Table */}
                <Card className="surface card-elevation">
                  <CardHeader>
                    <CardTitle>Evidence Chain of Custody</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="surface-variant">
                          <TableRow>
                            <TableHead>Evidence ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Hash (SHA-256)</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEvidence.map((evidence) => (
                            <TableRow key={evidence.id} className="hover:bg-gray-800/50 border-gray-700">
                              <TableCell>
                                <span className="font-mono text-blue-400">{evidence.id}</span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-purple-400 border-purple-400/30">
                                  {evidence.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-white">{evidence.source}</span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-400">
                                  {new Date(evidence.timestamp).toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-green-400">{evidence.size}</span>
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-xs text-gray-400">
                                  {evidence.hash.substring(0, 16)}...
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${getStatusColor(evidence.status)} border-0`}>
                                  {evidence.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4 text-blue-400" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4 text-gray-400" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="artifacts" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="surface card-elevation">
                    <CardHeader>
                      <CardTitle>Discovered Artifacts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {artifactDatabase.map((artifact) => (
                        <div key={artifact.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-white">{artifact.name}</h4>
                            <Badge variant="outline">{artifact.type}</Badge>
                          </div>
                          <p className="text-sm text-gray-400 mb-3">{artifact.description}</p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Hash:</span>
                              <span className="font-mono text-gray-400">{artifact.hash.substring(0, 16)}...</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Confidence:</span>
                              <div className="flex items-center space-x-2">
                                <Progress value={artifact.confidence} className="w-16 h-2" />
                                <span className="text-green-400">{artifact.confidence}%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">First Seen:</span>
                              <span className="text-gray-400">{new Date(artifact.firstSeen).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="surface card-elevation">
                    <CardHeader>
                      <CardTitle>YARA Rule Matches</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-sm text-white">CobaltStrike_Beacon</span>
                          <Badge variant="destructive">Critical</Badge>
                        </div>
                        <p className="text-xs text-gray-400">Detects Cobalt Strike beacon artifacts in memory dumps</p>
                      </div>
                      
                      <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-sm text-white">Mimikatz_Detection</span>
                          <Badge variant="secondary">High</Badge>
                        </div>
                        <p className="text-xs text-gray-400">Identifies Mimikatz credential dumping signatures</p>
                      </div>
                      
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-sm text-white">PowerShell_Obfuscation</span>
                          <Badge variant="outline">Medium</Badge>
                        </div>
                        <p className="text-xs text-gray-400">Detects obfuscated PowerShell command patterns</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-6">
                <Card className="surface card-elevation">
                  <CardHeader>
                    <CardTitle>Attack Timeline Reconstruction</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {timelineData.map((event, index) => (
                        <div key={index} className="flex items-center space-x-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              event.severity === 'Critical' ? 'bg-red-400' :
                              event.severity === 'High' ? 'bg-orange-400' :
                              event.severity === 'Medium' ? 'bg-yellow-400' :
                              'bg-green-400'
                            }`}></div>
                            <span className="font-mono text-blue-400 min-w-[80px]">{event.time}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">{event.event}</p>
                            <p className="text-sm text-Gray-400">Source: {event.source}</p>
                          </div>
                          <Badge variant={event.severity === 'Critical' ? 'destructive' : 'secondary'}>
                            {event.severity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="memory" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="surface card-elevation">
                    <CardHeader>
                      <CardTitle>Process Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-gray-800 rounded border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-white">powershell.exe</span>
                          <Badge variant="destructive">Suspicious</Badge>
                        </div>
                        <div className="text-xs space-y-1">
                          <p className="text-gray-400">PID: 2348 | PPID: 1234 | cmdline: powershell -enc aGVsbG8...</p>
                          <p className="text-orange-400">• Process injection detected</p>
                          <p className="text-orange-400">• Encoded command execution</p>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-gray-800 rounded border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-white">rundll32.exe</span>
                          <Badge variant="secondary">Anomalous</Badge>
                        </div>
                        <div className="text-xs space-y-1">
                          <p className="text-gray-400">PID: 3456 | PPID: 2348 | cmdline: rundll32 shell32,Control...</p>
                          <p className="text-yellow-400">• Unusual network connections</p>
                          <p className="text-yellow-400">• Memory artifacts present</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="surface card-elevation">
                    <CardHeader>
                      <CardTitle>Memory Strings Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="p-2 bg-gray-900 rounded font-mono text-xs">
                        <p className="text-green-400">GET /beacon HTTP/1.1</p>
                        <p className="text-green-400">Host: evil.com</p>
                        <p className="text-red-400">mimikatz # sekurlsa::logonpasswords</p>
                        <p className="text-blue-400">administrator:P@ssw0rd123</p>
                        <p className="text-orange-400">rundll32.exe,DllMain</p>
                        <p className="text-purple-400">\\\\domain.local\\SYSVOL</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Key indicators extracted from memory dump analysis
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="network" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="surface card-elevation">
                    <CardHeader>
                      <CardTitle>Network Connections</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-sm">192.168.1.105 → 185.220.101.42</span>
                          <Badge variant="destructive">C2</Badge>
                        </div>
                        <p className="text-xs text-gray-400">Port: 443 | Protocol: HTTPS | Duration: 4.2 hours</p>
                      </div>
                      
                      <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-sm">192.168.1.87 → 203.0.113.15</span>
                          <Badge variant="secondary">Exfiltration</Badge>
                        </div>
                        <p className="text-xs text-gray-400">Port: 8080 | Protocol: HTTP | Data: 127 MB</p>
                      </div>
                      
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-sm">192.168.1.142 → 8.8.8.8</span>
                          <Badge variant="outline">DNS Tunneling</Badge>
                        </div>
                        <p className="text-xs text-gray-400">Port: 53 | Protocol: DNS | Queries: 2,347</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="surface card-elevation">
                    <CardHeader>
                      <CardTitle>Packet Analysis Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Total Packets</span>
                        <span className="text-white font-mono">8,247,392</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Suspicious Flows</span>
                        <span className="text-red-400 font-mono">847</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Encrypted Traffic</span>
                        <span className="text-blue-400 font-mono">67.3%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Anomalous Protocols</span>
                        <span className="text-orange-400 font-mono">23</span>
                      </div>
                      
                      <Separator className="bg-gray-700" />
                      
                      <div>
                        <h4 className="text-sm font-medium text-white mb-2">Top Protocols</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">HTTPS</span>
                            <span className="text-green-400">42.1%</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">HTTP</span>
                            <span className="text-blue-400">18.7%</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">DNS</span>
                            <span className="text-purple-400">12.3%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}