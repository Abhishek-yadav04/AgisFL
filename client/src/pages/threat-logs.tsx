
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, AlertTriangle, Search, Filter, Download, Eye, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { Threat } from "@shared/schema";

export function ThreatLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: threatsData, isLoading, error } = useQuery({
    queryKey: ["/api/threats"],
    refetchInterval: 5000,
  });

  const { data: realTimeData, isConnected, sendMessage } = useWebSocket("/api/ws");

  // Use real-time data if available
  const threats = realTimeData?.threats?.allThreats || threatsData?.allThreats || [];
  const activeThreats = realTimeData?.threats?.activeThreats || threatsData?.activeThreats || [];

  const handleMitigateThreat = (threatId: string) => {
    sendMessage({ type: 'mitigate_threat', payload: { threatId } });
  };

  const handleExportLogs = () => {
    const csvData = threats.map(threat => ({
      ID: threat.id,
      Type: threat.type,
      Severity: threat.severity,
      Source: threat.source,
      Target: threat.target,
      Description: threat.description,
      Timestamp: threat.timestamp,
      Status: threat.mitigated ? 'Mitigated' : 'Active',
      Confidence: threat.confidence
    }));

    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threat-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Filter threats based on search and filters
  const filteredThreats = threats.filter((threat: Threat) => {
    const matchesSearch = searchTerm === "" || 
      threat.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      threat.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      threat.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      threat.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = severityFilter === "all" || threat.severity === severityFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && !threat.mitigated) ||
      (statusFilter === "mitigated" && threat.mitigated);

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getThreatTypeIcon = (type: string) => {
    switch (type) {
      case 'malware': return '🦠';
      case 'intrusion': return '🚪';
      case 'ddos': return '⚡';
      case 'anomaly': return '⚠️';
      case 'suspicious': return '🔍';
      default: return '🛡️';
    }
  };

  if (error) {
    return (
      <div className="min-h-screen cyber-gradient">
        <TopBar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-500 mb-2">Connection Error</h2>
            <p className="text-gray-300">Failed to load threat data</p>
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
            <p className="cyber-text-primary text-lg">Loading Threat Intelligence...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-gradient">
      <TopBar />
      
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold cyber-text-primary flex items-center">
                <Shield className="mr-3 h-8 w-8 text-red-500" />
                Threat Intelligence Center
              </h1>
              <p className="cyber-text-muted mt-2">
                Real-time threat detection and incident response dashboard
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Live Monitoring" : "Offline"}
              </Badge>
              <Badge variant="secondary">
                {filteredThreats.length} Threats
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium cyber-text-muted">Active Threats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{activeThreats.length}</div>
              <div className="flex items-center mt-2">
                <AlertTriangle className="mr-1 h-4 w-4 text-red-500" />
                <span className="text-sm cyber-text-muted">Requiring Attention</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium cyber-text-muted">Total Detected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold cyber-info">{threats.length}</div>
              <div className="flex items-center mt-2">
                <Eye className="mr-1 h-4 w-4 text-blue-500" />
                <span className="text-sm cyber-text-muted">All Time</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium cyber-text-muted">Mitigated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold cyber-success">
                {threats.filter((t: Threat) => t.mitigated).length}
              </div>
              <div className="flex items-center mt-2">
                <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                <span className="text-sm cyber-text-muted">Resolved</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium cyber-text-muted">Critical Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {threats.filter((t: Threat) => t.severity === 'critical').length}
              </div>
              <div className="flex items-center mt-2">
                <XCircle className="mr-1 h-4 w-4 text-red-600" />
                <span className="text-sm cyber-text-muted">High Priority</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Filter className="mr-2 h-5 w-5" />
                Threat Analysis Controls
              </span>
              <Button onClick={handleExportLogs} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Logs
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 cyber-text-muted" />
                <Input
                  placeholder="Search threats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="mitigated">Mitigated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Threats Table */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="active">Active Threats</TabsTrigger>
            <TabsTrigger value="all">All Threats</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Recent Threat Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredThreats.slice(0, 10).map((threat: Threat) => (
                    <div key={threat.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{getThreatTypeIcon(threat.type)}</div>
                        <div>
                          <div className="font-medium">{threat.description}</div>
                          <div className="text-sm cyber-text-muted">
                            {threat.source} → {threat.target}
                          </div>
                          <div className="text-xs cyber-text-muted">
                            {new Date(threat.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(threat.severity)}>
                          {threat.severity}
                        </Badge>
                        {threat.mitigated ? (
                          <Badge variant="outline" className="text-green-500">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Mitigated
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleMitigateThreat(threat.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Mitigate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredThreats.length === 0 && (
                    <div className="text-center py-8 cyber-text-muted">
                      No threats match your current filters
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Threats Requiring Immediate Attention</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeThreats.slice(0, 20).map((threat: Threat) => (
                      <TableRow key={threat.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="mr-2">{getThreatTypeIcon(threat.type)}</span>
                            {threat.type}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {threat.description}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{threat.source}</TableCell>
                        <TableCell className="font-mono text-sm">{threat.target}</TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(threat.severity)}>
                            {threat.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>{threat.confidence}%</TableCell>
                        <TableCell className="text-sm">
                          {new Date(threat.timestamp).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleMitigateThreat(threat.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Mitigate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {activeThreats.length === 0 && (
                  <div className="text-center py-8 cyber-text-muted">
                    No active threats detected
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Complete Threat Log</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredThreats.slice(0, 50).map((threat: Threat) => (
                      <TableRow key={threat.id}>
                        <TableCell className="font-mono text-xs">
                          {threat.id.split('_').pop()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="mr-2">{getThreatTypeIcon(threat.type)}</span>
                            {threat.type}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {threat.description}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{threat.source}</TableCell>
                        <TableCell className="font-mono text-sm">{threat.target}</TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(threat.severity)}>
                            {threat.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {threat.mitigated ? (
                            <Badge variant="outline" className="text-green-500">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Mitigated
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(threat.timestamp).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredThreats.length === 0 && (
                  <div className="text-center py-8 cyber-text-muted">
                    No threats match your current filters
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Threat Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['critical', 'high', 'medium', 'low'].map(severity => {
                      const count = threats.filter((t: Threat) => t.severity === severity).length;
                      const percentage = threats.length > 0 ? (count / threats.length) * 100 : 0;
                      return (
                        <div key={severity} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded mr-3 ${getSeverityColor(severity)}`} />
                            <span className="capitalize">{severity}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{count}</div>
                            <div className="text-sm cyber-text-muted">{percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Attack Vectors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['Network', 'Email', 'Web', 'USB', 'Social Engineering'].map(vector => {
                      const count = threats.filter((t: Threat) => t.attackVector === vector).length;
                      const percentage = threats.length > 0 ? (count / threats.length) * 100 : 0;
                      return (
                        <div key={vector} className="flex items-center justify-between">
                          <span>{vector}</span>
                          <div className="text-right">
                            <div className="font-medium">{count}</div>
                            <div className="text-sm cyber-text-muted">{percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      );
                    })}
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
