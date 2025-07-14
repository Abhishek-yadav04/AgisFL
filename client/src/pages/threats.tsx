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
import { Shield, Search, Filter, Globe, Eye, ExternalLink, AlertTriangle, TrendingUp, Clock, Target } from "lucide-react";
import { Threat } from "@shared/schema";
import { ThreatFeedItem } from "@/types/dashboard";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useWebSocket } from "@/lib/websocket";

export default function ThreatsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const { lastMessage } = useWebSocket();

  const { data: threats, isLoading } = useQuery<Threat[]>({
    queryKey: ['/api/threats'],
    refetchInterval: 30000,
  });

  const { data: threatFeed } = useQuery<ThreatFeedItem[]>({
    queryKey: ['/api/threats/feed'],
    refetchInterval: 15000,
  });

  const filteredThreats = threats?.filter(threat => {
    const matchesSearch = threat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         threat.threatId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (threat.sourceIp && threat.sourceIp.includes(searchTerm)) ||
                         (threat.targetIp && threat.targetIp.includes(searchTerm));
    const matchesSeverity = severityFilter === "all" || threat.severity === severityFilter;
    const matchesType = typeFilter === "all" || threat.type === typeFilter;
    
    return matchesSearch && matchesSeverity && matchesType;
  }) || [];

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getThreatTypes = () => {
    const types = threats?.map(t => t.type) || [];
    return Array.from(new Set(types));
  };

  // Threat intelligence metrics
  const threatMetrics = {
    total: threats?.length || 0,
    active: threats?.filter(t => t.isActive)?.length || 0,
    critical: threats?.filter(t => t.severity === 'Critical')?.length || 0,
    avgConfidence: threats && threats.length > 0 
      ? threats.reduce((acc, t) => acc + (parseFloat(t.confidence?.toString() || '0')), 0) / threats.length 
      : 0
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
                <h1 className="text-2xl font-bold text-white">Threat Intelligence</h1>
                <p className="text-gray-400">Advanced threat detection and analysis platform</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400">Live Intelligence Feed</span>
                </div>
              </div>
            </div>

            {/* Threat Intelligence Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="surface card-elevation">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-8 w-8 text-blue-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{threatMetrics.total}</p>
                      <p className="text-sm text-gray-400">Total Threats</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="surface card-elevation">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-8 w-8 text-red-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{threatMetrics.active}</p>
                      <p className="text-sm text-gray-400">Active Threats</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="surface card-elevation">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Target className="h-8 w-8 text-orange-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{threatMetrics.critical}</p>
                      <p className="text-sm text-gray-400">Critical Priority</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="surface card-elevation">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-8 w-8 text-green-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{Math.round(threatMetrics.avgConfidence)}%</p>
                      <p className="text-sm text-gray-400">Avg Confidence</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="threats" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
                <TabsTrigger value="threats" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Threat Database</TabsTrigger>
                <TabsTrigger value="feed" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Live Feed</TabsTrigger>
                <TabsTrigger value="iocs" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">IOCs & Artifacts</TabsTrigger>
                <TabsTrigger value="intelligence" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Threat Intel</TabsTrigger>
              </TabsList>

              <TabsContent value="threats" className="space-y-6">
                {/* Filters */}
                <Card className="surface card-elevation">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search by threat name, ID, IP address..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 surface-variant border-gray-600"
                          />
                        </div>
                      </div>
                      <Select value={severityFilter} onValueChange={setSeverityFilter}>
                        <SelectTrigger className="w-[180px] surface-variant border-gray-600">
                          <SelectValue placeholder="Severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Severities</SelectItem>
                          <SelectItem value="Critical">Critical</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[200px] surface-variant border-gray-600">
                          <SelectValue placeholder="Threat Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {getThreatTypes().map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Threats Table */}
                <Card className="surface card-elevation">
                  <CardHeader>
                    <CardTitle>Threat Database ({filteredThreats.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="surface-variant">
                          <TableRow>
                            <TableHead>Threat ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Source IP</TableHead>
                            <TableHead>Target IP</TableHead>
                            <TableHead>Confidence</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Detected</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredThreats.map((threat) => (
                            <TableRow key={threat.id} className="hover:bg-gray-800/50 border-gray-700">
                              <TableCell>
                                <span className="font-mono text-blue-400">{threat.threatId}</span>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-xs">
                                  <p className="font-medium text-white">{threat.name}</p>
                                  {threat.description && (
                                    <p className="text-sm text-gray-400 truncate">{threat.description}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-purple-400 border-purple-400/30">
                                  {threat.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className={`font-medium ${getSeverityColor(threat.severity)}`}>
                                  {threat.severity}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-sm text-orange-400">
                                  {threat.sourceIp || 'N/A'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-sm text-orange-400">
                                  {threat.targetIp || 'N/A'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Progress 
                                    value={parseFloat(threat.confidence?.toString() || '0')} 
                                    className="w-16 h-2"
                                  />
                                  <span className="text-sm text-gray-400">
                                    {Math.round(parseFloat(threat.confidence?.toString() || '0'))}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={threat.isActive ? "destructive" : "secondary"}>
                                  {threat.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-400">
                                  {new Date(threat.detectedAt).toLocaleDateString()}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4 text-blue-400" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <ExternalLink className="h-4 w-4 text-gray-400" />
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

              <TabsContent value="feed" className="space-y-6">
                <Card className="surface card-elevation">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Globe className="h-5 w-5 text-green-400" />
                      <span>Live Threat Intelligence Feed</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {threatFeed?.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full ${
                            item.severity === 'Critical' ? 'bg-red-400' :
                            item.severity === 'High' ? 'bg-orange-400' :
                            item.severity === 'Medium' ? 'bg-yellow-400' :
                            'bg-green-400'
                          }`}></div>
                          <div>
                            <p className="font-medium text-white">{item.name}</p>
                            <p className="text-sm text-gray-400">{item.type}</p>
                            {item.sourceIp && (
                              <p className="text-xs font-mono text-orange-400">Source: {item.sourceIp}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={item.severity === 'Critical' ? 'destructive' : 'secondary'}>
                            {item.severity}
                          </Badge>
                          <p className="text-xs text-gray-400 mt-1">
                            Confidence: {Math.round(item.confidence)}%
                          </p>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-gray-400">
                        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Monitoring threat intelligence sources...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="iocs" className="space-y-6">
                <Card className="surface card-elevation">
                  <CardHeader>
                    <CardTitle>Indicators of Compromise (IOCs)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-white mb-3">IP Addresses</h4>
                        <div className="space-y-2">
                          {threats?.filter(t => t.sourceIp).slice(0, 5).map((threat, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                              <span className="font-mono text-orange-400">{threat.sourceIp}</span>
                              <Badge variant="outline" className="text-xs">{threat.type}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-white mb-3">Domains & URLs</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                            <span className="font-mono text-blue-400">evil.com</span>
                            <Badge variant="outline" className="text-xs">C2 Domain</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                            <span className="font-mono text-blue-400">malicious-site.net</span>
                            <Badge variant="outline" className="text-xs">Phishing</Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-white mb-3">File Hashes</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                            <span className="font-mono text-green-400 text-xs">a1b2c3d4e5f6...</span>
                            <Badge variant="outline" className="text-xs">Malware</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                            <span className="font-mono text-green-400 text-xs">f6e5d4c3b2a1...</span>
                            <Badge variant="outline" className="text-xs">Trojan</Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-white mb-3">Network Signatures</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                            <span className="text-purple-400 text-sm">HTTP/1.1 POST /beacon</span>
                            <Badge variant="outline" className="text-xs">C2 Traffic</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                            <span className="text-purple-400 text-sm">DNS TXT exfil.data</span>
                            <Badge variant="outline" className="text-xs">Exfiltration</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="intelligence" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="surface card-elevation">
                    <CardHeader>
                      <CardTitle>Threat Actor Attribution</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">APT29 (Cozy Bear)</h4>
                          <Badge variant="destructive">Critical</Badge>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">
                          Nation-state threat group attributed to Russian SVR
                        </p>
                        <div className="flex items-center space-x-4 text-xs">
                          <span className="text-orange-400">Confidence: 91%</span>
                          <span className="text-blue-400">MITRE: G0016</span>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">BlackCat Ransomware</h4>
                          <Badge variant="secondary">High</Badge>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">
                          Ransomware-as-a-Service operation targeting enterprises
                        </p>
                        <div className="flex items-center space-x-4 text-xs">
                          <span className="text-orange-400">Confidence: 87%</span>
                          <span className="text-blue-400">Family: ALPHV</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="surface card-elevation">
                    <CardHeader>
                      <CardTitle>MITRE ATT&CK Mapping</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                        <div>
                          <p className="text-white font-medium">T1566.001</p>
                          <p className="text-sm text-gray-400">Spearphishing Attachment</p>
                        </div>
                        <Badge variant="outline">Initial Access</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                        <div>
                          <p className="text-white font-medium">T1003.001</p>
                          <p className="text-sm text-gray-400">LSASS Memory</p>
                        </div>
                        <Badge variant="outline">Credential Access</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                        <div>
                          <p className="text-white font-medium">T1055</p>
                          <p className="text-sm text-gray-400">Process Injection</p>
                        </div>
                        <Badge variant="outline">Defense Evasion</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                        <div>
                          <p className="text-white font-medium">T1041</p>
                          <p className="text-sm text-gray-400">Exfiltration Over C2</p>
                        </div>
                        <Badge variant="outline">Exfiltration</Badge>
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