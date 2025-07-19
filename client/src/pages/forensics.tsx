import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TopBar } from '@/components/layout/TopBar';
import { 
  Search, 
  Download, 
  Eye, 
  Clock, 
  AlertTriangle,
  Shield,
  FileText,
  HardDrive,
  Network,
  Fingerprint,
  Camera,
  Lock
} from 'lucide-react';

interface ForensicsEvidence {
  id: string;
  type: 'file' | 'network' | 'memory' | 'registry';
  timestamp: string;
  source: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Collected' | 'Analyzing' | 'Verified' | 'Archived';
  hash: string;
}

export default function Forensics() {
  const [evidence, setEvidence] = useState<ForensicsEvidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForensicsData = async () => {
      try {
        const response = await fetch('/api/forensics');
        if (response.ok) {
          const data = await response.json();
          setEvidence(data.evidence || []);
        } else {
          throw new Error('Failed to fetch forensics data');
        }
      } catch (err) {
        console.error('Forensics data error:', err);
        setError('Failed to connect to backend services');
        // Mock data for demonstration
        setEvidence([
          {
            id: 'EVD-001',
            type: 'file',
            timestamp: new Date().toISOString(),
            source: '/var/log/suspicious.exe',
            description: 'Malicious executable detected in system directory',
            severity: 'Critical',
            status: 'Verified',
            hash: 'a1b2c3d4e5f6789012345678901234567890'
          },
          {
            id: 'EVD-002',
            type: 'network',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            source: '192.168.1.100:8080',
            description: 'Suspicious outbound connection to unknown server',
            severity: 'High',
            status: 'Analyzing',
            hash: 'b2c3d4e5f6789012345678901234567890ab'
          },
          {
            id: 'EVD-003',
            type: 'memory',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            source: 'Process ID: 1337',
            description: 'Injection detected in system process memory',
            severity: 'Critical',
            status: 'Collected',
            hash: 'c3d4e5f6789012345678901234567890abc2'
          },
          {
            id: 'EVD-004',
            type: 'registry',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            source: 'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
            description: 'Unauthorized registry modification detected',
            severity: 'Medium',
            status: 'Verified',
            hash: 'd4e5f6789012345678901234567890abc23'
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchForensicsData();
    const interval = setInterval(fetchForensicsData, 30000);
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
            <p className="text-slate-300">Failed to load forensics data</p>
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
            <p className="text-blue-400 text-lg">Loading Digital Forensics...</p>
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
      case 'Collected': return <HardDrive className="h-4 w-4" />;
      case 'Analyzing': return <Search className="h-4 w-4" />;
      case 'Verified': return <Shield className="h-4 w-4" />;
      case 'Archived': return <FileText className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'file': return <FileText className="h-4 w-4" />;
      case 'network': return <Network className="h-4 w-4" />;
      case 'memory': return <HardDrive className="h-4 w-4" />;
      case 'registry': return <Lock className="h-4 w-4" />;
      default: return <Fingerprint className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <TopBar />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Digital Forensics</h1>
            <p className="text-slate-400 mt-2">
              Comprehensive evidence collection and analysis
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-slate-700 text-slate-300">
              <Camera className="mr-2 h-4 w-4" />
              Capture Evidence
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{evidence.length}</p>
                  <p className="text-xs text-slate-400">Total Evidence</p>
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
                    {evidence.filter(e => e.status === 'Verified').length}
                  </p>
                  <p className="text-xs text-slate-400">Verified Items</p>
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
                    {evidence.filter(e => e.severity === 'Critical').length}
                  </p>
                  <p className="text-xs text-slate-400">Critical Findings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-2">
                <Search className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {evidence.filter(e => e.status === 'Analyzing').length}
                  </p>
                  <p className="text-xs text-slate-400">Under Analysis</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="evidence" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-700">
            <TabsTrigger value="evidence" className="data-[state=active]:bg-blue-600">Evidence Collection</TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-blue-600">Analysis Results</TabsTrigger>
            <TabsTrigger value="chain" className="data-[state=active]:bg-blue-600">Chain of Custody</TabsTrigger>
          </TabsList>

          <TabsContent value="evidence" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Fingerprint className="h-5 w-5" />
                  Digital Evidence Repository
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Collected evidence from various sources and systems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">ID</TableHead>
                      <TableHead className="text-slate-300">Type</TableHead>
                      <TableHead className="text-slate-300">Source</TableHead>
                      <TableHead className="text-slate-300">Description</TableHead>
                      <TableHead className="text-slate-300">Severity</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evidence.map((item) => (
                      <TableRow key={item.id} className="border-slate-700">
                        <TableCell className="text-white font-mono">{item.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-slate-300">
                            {getTypeIcon(item.type)}
                            {item.type}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300 max-w-xs truncate">
                          {item.source}
                        </TableCell>
                        <TableCell className="text-slate-300 max-w-md truncate">
                          {item.description}
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(item.severity)}>
                            {item.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(item.status)}
                            <span className="text-slate-300">{item.status}</span>
                          </div>
                        </TableCell>
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
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Hash Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {evidence.slice(0, 3).map((item) => (
                    <div key={item.id} className="bg-slate-700 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-blue-400 font-mono text-sm">{item.id}</span>
                        <Badge className={getSeverityColor(item.severity)}>
                          {item.severity}
                        </Badge>
                      </div>
                      <p className="text-slate-300 text-sm mb-2">{item.description}</p>
                      <p className="text-slate-400 font-mono text-xs">
                        SHA-256: {item.hash}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Timeline Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {evidence.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-white text-sm">{item.type} evidence</span>
                          <span className="text-slate-400 text-xs">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs">{item.source}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="chain" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Chain of Custody Log</CardTitle>
                <CardDescription className="text-slate-400">
                  Complete audit trail for all collected evidence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {evidence.map((item) => (
                    <div key={item.id} className="bg-slate-700 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-white font-semibold">Evidence {item.id}</h3>
                        <Badge className={getSeverityColor(item.severity)}>
                          {item.severity}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Collected</p>
                          <p className="text-white">{new Date(item.timestamp).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Integrity Hash</p>
                          <p className="text-white font-mono">{item.hash.slice(0, 16)}...</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Current Status</p>
                          <div className="flex items-center gap-1 text-white">
                            {getStatusIcon(item.status)}
                            {item.status}
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