
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TopBar } from '@/components/layout/TopBar';
import { 
  Search, 
  Eye, 
  Download, 
  FileText, 
  Clock, 
  AlertTriangle,
  Shield,
  Users,
  Database,
  Network,
  Fingerprint,
  Magnify,
  Target
} from 'lucide-react';

interface Investigation {
  id: string;
  title: string;
  description: string;
  status: 'Active' | 'Pending' | 'Completed' | 'On Hold';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  investigator: string;
  createdAt: string;
  updatedAt: string;
  evidence: Array<{
    id: string;
    type: string;
    description: string;
    collected: string;
  }>;
  timeline: Array<{
    timestamp: string;
    action: string;
    user: string;
    details: string;
  }>;
}

export default function Investigation() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvestigations = async () => {
      try {
        const response = await fetch('/api/investigations');
        if (response.ok) {
          const data = await response.json();
          setInvestigations(data.investigations || []);
        } else {
          throw new Error('Failed to fetch investigations');
        }
      } catch (err) {
        console.error('Investigation data error:', err);
        setError('Failed to connect to backend services');
        // Mock data for demonstration
        setInvestigations([
          {
            id: 'INV-2024-001',
            title: 'Advanced Persistent Threat Analysis',
            description: 'Investigation of sophisticated attack targeting financial systems',
            status: 'Active',
            priority: 'Critical',
            investigator: 'Dr. Sarah Johnson',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            evidence: [
              { id: 'EVD-001', type: 'Network Log', description: 'Suspicious connection patterns', collected: '2 hours ago' },
              { id: 'EVD-002', type: 'Malware Sample', description: 'Unknown payload analysis', collected: '4 hours ago' },
              { id: 'EVD-003', type: 'System Image', description: 'Compromised server snapshot', collected: '6 hours ago' }
            ],
            timeline: [
              { timestamp: new Date().toISOString(), action: 'Evidence Analysis', user: 'Dr. Sarah Johnson', details: 'Analyzing network traffic patterns' },
              { timestamp: new Date(Date.now() - 3600000).toISOString(), action: 'Sample Collection', user: 'Security Team', details: 'Malware sample isolated and secured' }
            ]
          },
          {
            id: 'INV-2024-002',
            title: 'Data Exfiltration Incident',
            description: 'Investigating potential data breach and unauthorized access',
            status: 'Completed',
            priority: 'High',
            investigator: 'Michael Chen',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 3600000).toISOString(),
            evidence: [
              { id: 'EVD-004', type: 'Access Log', description: 'Unusual login activities', collected: '1 day ago' },
              { id: 'EVD-005', type: 'Database Log', description: 'Query execution records', collected: '1 day ago' }
            ],
            timeline: [
              { timestamp: new Date(Date.now() - 3600000).toISOString(), action: 'Investigation Closed', user: 'Michael Chen', details: 'False positive - legitimate maintenance activity' },
              { timestamp: new Date(Date.now() - 86400000).toISOString(), action: 'Investigation Started', user: 'Security System', details: 'Automated alert triggered investigation' }
            ]
          },
          {
            id: 'INV-2024-003',
            title: 'Insider Threat Assessment',
            description: 'Behavioral analysis of suspicious employee activities',
            status: 'Pending',
            priority: 'Medium',
            investigator: 'Lisa Rodriguez',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            updatedAt: new Date(Date.now() - 172800000).toISOString(),
            evidence: [
              { id: 'EVD-006', type: 'User Activity', description: 'Abnormal access patterns', collected: '2 days ago' }
            ],
            timeline: [
              { timestamp: new Date(Date.now() - 172800000).toISOString(), action: 'Investigation Created', user: 'HR Department', details: 'Report filed for suspicious behavior' }
            ]
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvestigations();
    const interval = setInterval(fetchInvestigations, 30000);
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
            <p className="text-slate-300">Failed to load investigation data</p>
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
            <p className="text-blue-400 text-lg">Loading Investigations...</p>
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
      case 'Active': return 'bg-blue-600 text-white';
      case 'Pending': return 'bg-yellow-600 text-white';
      case 'Completed': return 'bg-green-600 text-white';
      case 'On Hold': return 'bg-gray-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <TopBar />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Security Investigations</h1>
            <p className="text-slate-400 mt-2">
              Track and manage comprehensive security investigations
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-slate-700 text-slate-300">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Target className="mr-2 h-4 w-4" />
              New Investigation
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-2">
                <Magnify className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {investigations.filter(i => i.status === 'Active').length}
                  </p>
                  <p className="text-xs text-slate-400">Active Investigations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {investigations.filter(i => i.status === 'Pending').length}
                  </p>
                  <p className="text-xs text-slate-400">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {investigations.filter(i => i.status === 'Completed').length}
                  </p>
                  <p className="text-xs text-slate-400">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {investigations.filter(i => i.priority === 'Critical').length}
                  </p>
                  <p className="text-xs text-slate-400">Critical Priority</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
            <TabsTrigger value="active" className="data-[state=active]:bg-blue-600">Active</TabsTrigger>
            <TabsTrigger value="evidence" className="data-[state=active]:bg-blue-600">Evidence</TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-blue-600">Timeline</TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-blue-600">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Magnify className="h-5 w-5" />
                  Active Investigations
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Ongoing security investigations requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {investigations.filter(i => i.status === 'Active').map((investigation) => (
                    <div key={investigation.id} className="bg-slate-700 p-6 rounded-lg">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-white font-semibold text-lg">{investigation.title}</h3>
                          <p className="text-slate-400 mt-2">{investigation.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getPriorityColor(investigation.priority)}>
                            {investigation.priority}
                          </Badge>
                          <Badge className={getStatusColor(investigation.status)}>
                            {investigation.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-slate-400 text-sm">Investigation ID</p>
                          <p className="text-blue-400 font-mono">{investigation.id}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">Lead Investigator</p>
                          <p className="text-white">{investigation.investigator}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">Evidence Count</p>
                          <p className="text-white">{investigation.evidence.length} items</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Eye className="mr-2 h-3 w-3" />
                          View Details
                        </Button>
                        <Button size="sm" variant="outline" className="border-slate-600">
                          <FileText className="mr-2 h-3 w-3" />
                          Evidence
                        </Button>
                        <Button size="sm" variant="outline" className="border-slate-600">
                          <Download className="mr-2 h-3 w-3" />
                          Export
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evidence" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Fingerprint className="h-5 w-5" />
                  Investigation Evidence
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Digital evidence collected across all investigations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Evidence ID</TableHead>
                      <TableHead className="text-slate-300">Investigation</TableHead>
                      <TableHead className="text-slate-300">Type</TableHead>
                      <TableHead className="text-slate-300">Description</TableHead>
                      <TableHead className="text-slate-300">Collected</TableHead>
                      <TableHead className="text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investigations.flatMap(inv => 
                      inv.evidence.map(evidence => (
                        <TableRow key={evidence.id} className="border-slate-700">
                          <TableCell className="text-blue-400 font-mono">{evidence.id}</TableCell>
                          <TableCell className="text-white">{inv.id}</TableCell>
                          <TableCell className="text-slate-300">{evidence.type}</TableCell>
                          <TableCell className="text-slate-300">{evidence.description}</TableCell>
                          <TableCell className="text-slate-300">{evidence.collected}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="border-slate-600">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="border-slate-600">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Investigation Timeline
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Chronological view of all investigation activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {investigations.flatMap(inv => 
                    inv.timeline.map((event, index) => (
                      <div key={`${inv.id}-${index}`} className="relative">
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <div className="w-px h-12 bg-slate-600 mt-2"></div>
                          </div>
                          <div className="flex-1 bg-slate-700 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="text-white font-medium">{event.action}</h4>
                                <p className="text-blue-400 text-sm">{inv.id} - {inv.title}</p>
                              </div>
                              <span className="text-slate-400 text-sm">
                                {new Date(event.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-slate-300 text-sm mb-2">{event.details}</p>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-400 text-sm">{event.user}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Completed Investigations
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Historical record of resolved security investigations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {investigations.filter(i => i.status === 'Completed').map((investigation) => (
                    <div key={investigation.id} className="bg-slate-700 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-white font-semibold">{investigation.title}</h3>
                          <p className="text-slate-400 text-sm">{investigation.description}</p>
                        </div>
                        <Badge className="bg-green-600 text-white">Completed</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Investigation ID</p>
                          <p className="text-blue-400 font-mono">{investigation.id}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Investigator</p>
                          <p className="text-white">{investigation.investigator}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Duration</p>
                          <p className="text-white">
                            {Math.round((new Date(investigation.updatedAt).getTime() - new Date(investigation.createdAt).getTime()) / (1000 * 60 * 60))}h
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Evidence Items</p>
                          <p className="text-white">{investigation.evidence.length}</p>
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
