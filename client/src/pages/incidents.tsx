import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Clock, User, Search, Filter, Plus, Eye, Edit, CheckCircle, XCircle } from "lucide-react";
import { Incident } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default function IncidentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: incidents, isLoading } = useQuery<Incident[]>({
    queryKey: ['/api/incidents'],
    refetchInterval: 30000,
  });

  const updateIncidentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Incident> }) => {
      return apiRequest('PATCH', `/api/incidents/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      toast({ title: "Success", description: "Incident updated successfully" });
    },
  });

  const filteredIncidents = incidents?.filter(incident => {
    const matchesSearch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.incidentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || incident.status === statusFilter;
    const matchesSeverity = severityFilter === "all" || incident.severity === severityFilter;
    
    return matchesSearch && matchesStatus && matchesSeverity;
  }) || [];

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved': return 'bg-green-500/20 text-green-400';
      case 'investigating': return 'bg-yellow-500/20 text-yellow-400';
      case 'analyzing': return 'bg-blue-500/20 text-blue-400';
      case 'open': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleStatusUpdate = (incident: Incident, newStatus: string) => {
    updateIncidentMutation.mutate({
      id: incident.id,
      data: { status: newStatus }
    });
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
                <h1 className="text-2xl font-bold text-white">Incident Management</h1>
                <p className="text-gray-400">Comprehensive incident response and tracking</p>
              </div>
              <Button className="bg-primary hover:bg-primary/80">
                <Plus className="h-4 w-4 mr-2" />
                New Incident
              </Button>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="surface card-elevation">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-8 w-8 text-red-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{filteredIncidents.filter(i => i.status !== 'resolved').length}</p>
                      <p className="text-sm text-gray-400">Open Incidents</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="surface card-elevation">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-8 w-8 text-yellow-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{filteredIncidents.filter(i => i.severity === 'Critical').length}</p>
                      <p className="text-sm text-gray-400">Critical Priority</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="surface card-elevation">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{filteredIncidents.filter(i => i.status === 'resolved').length}</p>
                      <p className="text-sm text-gray-400">Resolved Today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="surface card-elevation">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-8 w-8 text-blue-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">18m</p>
                      <p className="text-sm text-gray-400">Avg Response Time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card className="surface card-elevation">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search incidents by ID, title, or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 surface-variant border-gray-600"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] surface-variant border-gray-600">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="analyzing">Analyzing</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  
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
                </div>
              </CardContent>
            </Card>

            {/* Incidents Table */}
            <Card className="surface card-elevation">
              <CardHeader>
                <CardTitle>Incident Queue ({filteredIncidents.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="surface-variant">
                      <TableRow>
                        <TableHead>Incident ID</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Risk Score</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIncidents.map((incident) => (
                        <TableRow key={incident.id} className="hover:bg-gray-800/50 border-gray-700">
                          <TableCell>
                            <span className="font-mono text-blue-400">{incident.incidentId}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getSeverityColor(incident.severity)}>
                              {incident.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="font-medium text-white truncate">{incident.title}</p>
                              <p className="text-sm text-gray-400 truncate">{incident.description}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-300">{incident.type}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(incident.status)} border-0`}>
                              {incident.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-mono text-orange-400">
                              {incident.riskScore || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-400">
                              {new Date(incident.createdAt).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setSelectedIncident(incident)}
                                  >
                                    <Eye className="h-4 w-4 text-blue-400" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl bg-gray-800 border-gray-700">
                                  <DialogHeader>
                                    <DialogTitle className="text-white">
                                      Incident Details - {selectedIncident?.incidentId}
                                    </DialogTitle>
                                  </DialogHeader>
                                  {selectedIncident && (
                                    <IncidentDetails 
                                      incident={selectedIncident} 
                                      onStatusUpdate={handleStatusUpdate}
                                    />
                                  )}
                                </DialogContent>
                              </Dialog>
                              
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4 text-gray-400" />
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
          </div>
        </main>
      </div>
    </div>
  );
}

function IncidentDetails({ incident, onStatusUpdate }: { 
  incident: Incident; 
  onStatusUpdate: (incident: Incident, status: string) => void;
}) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-gray-700">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
        <TabsTrigger value="response">Response</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-400">Severity</label>
              <Badge variant={incident.severity === 'Critical' ? 'destructive' : 'secondary'}>
                {incident.severity}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400">Type</label>
              <p className="text-white">{incident.type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400">Risk Score</label>
              <p className="text-orange-400 font-mono">{incident.riskScore || 'N/A'}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-400">Status</label>
              <div className="flex items-center space-x-2">
                <Badge className={`${incident.status === 'resolved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'} border-0`}>
                  {incident.status}
                </Badge>
                <Select onValueChange={(value) => onStatusUpdate(incident, value)}>
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue placeholder="Change" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="analyzing">Analyzing</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400">Created</label>
              <p className="text-white">{new Date(incident.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400">Last Updated</label>
              <p className="text-white">{new Date(incident.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-400">Description</label>
          <p className="text-white mt-1 p-3 bg-gray-700 rounded">{incident.description}</p>
        </div>
        
        {incident.metadata && (
          <div>
            <label className="text-sm font-medium text-gray-400">Additional Metadata</label>
            <pre className="text-sm text-green-400 mt-1 p-3 bg-gray-900 rounded overflow-auto">
              {JSON.stringify(incident.metadata, null, 2)}
            </pre>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="timeline" className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <div className="flex-1">
              <p className="text-white font-medium">Incident Created</p>
              <p className="text-sm text-gray-400">{new Date(incident.createdAt).toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <div className="flex-1">
              <p className="text-white font-medium">Status: {incident.status}</p>
              <p className="text-sm text-gray-400">{new Date(incident.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="artifacts" className="space-y-4">
        <div className="text-center py-8 text-gray-400">
          <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Evidence collection in progress...</p>
          <p className="text-sm">Digital forensics artifacts will appear here</p>
        </div>
      </TabsContent>
      
      <TabsContent value="response" className="space-y-4">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-400">Response Notes</label>
            <Textarea 
              placeholder="Add response notes, actions taken, or analysis findings..."
              className="mt-1 surface-variant border-gray-600"
              rows={4}
            />
          </div>
          <Button className="bg-primary hover:bg-primary/80">
            Update Response
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}