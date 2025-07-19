import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TopBar } from '@/components/layout/TopBar';
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  UserCheck,
  Calendar
} from 'lucide-react';

interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  type: 'Malware' | 'Intrusion' | 'Data Breach' | 'Phishing' | 'DDoS' | 'Other';
  assignee: string;
  reporter: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  affectedSystems: string[];
  timeline: Array<{
    timestamp: string;
    action: string;
    user: string;
    details: string;
  }>;
}

export default function Incidents() {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await fetch('/api/incidents');
        if (response.ok) {
          const data = await response.json();
          setIncidents(data.incidents || []);
        } else {
          throw new Error('Failed to fetch incidents');
        }
      } catch (err) {
        console.error('Incidents data error:', err);
        setError('Failed to connect to backend services');
        // Mock data for demonstration
        setIncidents([
          {
            id: 'INC-2024-001',
            title: 'Suspicious Network Activity Detected',
            description: 'Unusual outbound connections detected from multiple workstations',
            severity: 'Critical',
            status: 'In Progress',
            type: 'Intrusion',
            assignee: 'John Doe',
            reporter: 'Security System',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            affectedSystems: ['WS-001', 'WS-045', 'SRV-DB-01'],
            timeline: [
              {
                timestamp: new Date().toISOString(),
                action: 'Incident Created',
                user: 'System',
                details: 'Automated detection triggered alert'
              },
              {
                timestamp: new Date(Date.now() - 1800000).toISOString(),
                action: 'Assigned',
                user: 'Security Manager',
                details: 'Assigned to John Doe for investigation'
              }
            ]
          },
          {
            id: 'INC-2024-002',
            title: 'Malware Detection on Endpoint',
            description: 'Trojan detected and quarantined on user workstation',
            severity: 'High',
            status: 'Resolved',
            type: 'Malware',
            assignee: 'Jane Smith',
            reporter: 'Antivirus System',
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            updatedAt: new Date(Date.now() - 1800000).toISOString(),
            resolvedAt: new Date(Date.now() - 1800000).toISOString(),
            affectedSystems: ['WS-023'],
            timeline: [
              {
                timestamp: new Date(Date.now() - 7200000).toISOString(),
                action: 'Incident Created',
                user: 'System',
                details: 'Malware detected and quarantined'
              },
              {
                timestamp: new Date(Date.now() - 6000000).toISOString(),
                action: 'Investigation Started',
                user: 'Jane Smith',
                details: 'Analyzing malware sample'
              },
              {
                timestamp: new Date(Date.now() - 1800000).toISOString(),
                action: 'Resolved',
                user: 'Jane Smith',
                details: 'System cleaned and patched'
              }
            ]
          },
          {
            id: 'INC-2024-003',
            title: 'Phishing Email Campaign',
            description: 'Multiple users reported suspicious emails requesting credentials',
            severity: 'Medium',
            status: 'Open',
            type: 'Phishing',
            assignee: 'Security Team',
            reporter: 'Multiple Users',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            updatedAt: new Date(Date.now() - 3600000).toISOString(),
            affectedSystems: ['Email Server'],
            timeline: [
              {
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                action: 'Incident Created',
                user: 'Security Team',
                details: 'Multiple phishing reports received'
              }
            ]
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncidents();
    const interval = setInterval(fetchIncidents, 30000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <TopBar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-400 mb-2">Connection Error</h2>
            <p className="text-slate-300">Failed to load incidents data</p>
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
            <p className="text-blue-400 text-lg">Loading Security Incidents...</p>
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'In Progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'Resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Closed': return <XCircle className="h-4 w-4 text-gray-500" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <TopBar />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Security Incidents</h1>
            <p className="text-slate-400 mt-2">
              Monitor and manage security incidents and responses
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-slate-700 text-slate-300">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              New Incident
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {incidents.filter(i => i.status === 'Open').length}
                  </p>
                  <p className="text-xs text-slate-400">Open Incidents</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {incidents.filter(i => i.status === 'In Progress').length}
                  </p>
                  <p className="text-xs text-slate-400">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {incidents.filter(i => i.status === 'Resolved').length}
                  </p>
                  <p className="text-xs text-slate-400">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {incidents.filter(i => i.severity === 'Critical').length}
                  </p>
                  <p className="text-xs text-slate-400">Critical</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-700">
            <TabsTrigger value="active" className="data-[state=active]:bg-blue-600">Active Incidents</TabsTrigger>
            <TabsTrigger value="resolved" className="data-[state=active]:bg-blue-600">Resolved Incidents</TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-blue-600">Timeline View</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Active Security Incidents
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Current incidents requiring attention and response
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">ID</TableHead>
                      <TableHead className="text-slate-300">Title</TableHead>
                      <TableHead className="text-slate-300">Type</TableHead>
                      <TableHead className="text-slate-300">Severity</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Assignee</TableHead>
                      <TableHead className="text-slate-300">Created</TableHead>
                      <TableHead className="text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').map((incident) => (
                      <TableRow key={incident.id} className="border-slate-700">
                        <TableCell className="text-blue-400 font-mono">{incident.id}</TableCell>
                        <TableCell className="text-white font-medium max-w-xs">
                          <div>
                            <p className="truncate">{incident.title}</p>
                            <p className="text-slate-400 text-xs truncate">{incident.description}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300">{incident.type}</TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(incident.severity)}>
                            {incident.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(incident.status)}
                            <span className="text-slate-300">{incident.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300">{incident.assignee}</TableCell>
                        <TableCell className="text-slate-300">
                          {new Date(incident.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="border-slate-600">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="border-slate-600">
                              <Edit className="h-3 w-3" />
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

          <TabsContent value="resolved" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Resolved Incidents
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Historical incident records and resolutions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {incidents.filter(i => i.status === 'Resolved').map((incident) => (
                    <div key={incident.id} className="bg-slate-700 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-white font-semibold">{incident.title}</h3>
                          <p className="text-slate-400 text-sm">{incident.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getSeverityColor(incident.severity)}>
                            {incident.severity}
                          </Badge>
                          <Badge variant="outline" className="text-green-400 border-green-400">
                            Resolved
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Incident ID</p>
                          <p className="text-blue-400 font-mono">{incident.id}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Resolved By</p>
                          <p className="text-white">{incident.assignee}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Resolution Time</p>
                          <p className="text-white">
                            {incident.resolvedAt && 
                              Math.round((new Date(incident.resolvedAt).getTime() - new Date(incident.createdAt).getTime()) / (1000 * 60 * 60))
                            }h
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Affected Systems</p>
                          <p className="text-white">{incident.affectedSystems.length} systems</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Incident Timeline
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Chronological view of all incident activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {incidents.map((incident) => (
                    <div key={incident.id} className="relative">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            incident.severity === 'Critical' ? 'bg-red-500' :
                            incident.severity === 'High' ? 'bg-orange-500' :
                            incident.severity === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
                          {incidents.indexOf(incident) < incidents.length - 1 && (
                            <div className="w-px h-16 bg-slate-600 mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1 bg-slate-700 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-white font-semibold">{incident.title}</h3>
                            <span className="text-slate-400 text-sm">
                              {new Date(incident.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-300 text-sm mb-2">{incident.description}</p>
                          <div className="flex gap-2">
                            <Badge className={getSeverityColor(incident.severity)}>
                              {incident.severity}
                            </Badge>
                            <Badge variant="outline" className="text-slate-300">
                              {incident.type}
                            </Badge>
                          </div>
                        </div>
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