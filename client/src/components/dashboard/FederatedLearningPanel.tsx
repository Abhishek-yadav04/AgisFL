
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Activity, 
  Shield, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database,
  Network,
  Eye,
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface Node {
  id: string;
  name: string;
  status: string;
  model_type: string;
  accuracy: number;
  samples: number;
  threats_detected: number;
  false_positives: number;
  privacy_budget: number;
  last_update: string;
  location: string;
  latency: number;
}

interface PerformanceMetric {
  timestamp: string;
  round: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  threats_detected: number;
  false_positives: number;
  training_time: number;
  convergence_score: number;
}

interface ThreatData {
  id: string;
  type: string;
  severity: string;
  source_ip: string;
  target: string;
  timestamp: string;
  status: string;
  confidence: number;
}

export function FederatedLearningPanel() {
  const [flStatus, setFlStatus] = useState<any>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetric[]>([]);
  const [threats, setThreats] = useState<ThreatData[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('accuracy');

  const fetchFLStatus = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/fl-ids/status');
      if (response.ok) {
        const data = await response.json();
        setFlStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch FL status:', error);
    }
  };

  const fetchNodes = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/fl-ids/nodes');
      if (response.ok) {
        const data = await response.json();
        setNodes(data.nodes || []);
      }
    } catch (error) {
      console.error('Failed to fetch nodes:', error);
    }
  };

  const fetchPerformance = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/fl-ids/performance');
      if (response.ok) {
        const data = await response.json();
        setPerformance(data.performance_history || []);
        setSystemHealth(data.system_health);
      }
    } catch (error) {
      console.error('Failed to fetch performance:', error);
    }
  };

  const fetchThreats = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/fl-ids/threats');
      if (response.ok) {
        const data = await response.json();
        setThreats(data.threats || []);
      }
    } catch (error) {
      console.error('Failed to fetch threats:', error);
    }
  };

  const startFLSystem = async () => {
    try {
      await fetch('http://localhost:5001/api/fl-ids/start', { method: 'POST' });
      await fetchFLStatus();
    } catch (error) {
      console.error('Failed to start FL system:', error);
    }
  };

  const stopFLSystem = async () => {
    try {
      await fetch('http://localhost:5001/api/fl-ids/stop', { method: 'POST' });
      await fetchFLStatus();
    } catch (error) {
      console.error('Failed to stop FL system:', error);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchFLStatus(),
        fetchNodes(),
        fetchPerformance(),
        fetchThreats()
      ]);
      setIsLoading(false);
    };

    fetchAllData();

    if (autoRefresh) {
      const interval = setInterval(fetchAllData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'text-green-400';
      case 'training': return 'text-blue-400';
      case 'stopped': return 'text-red-400';
      case 'error': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-400">Loading FL-IDS System...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Status Header */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-400" />
              Federated Learning Intrusion Detection System
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                  className="data-[state=checked]:bg-blue-600"
                />
                <span className="text-sm text-gray-400">Auto Refresh</span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={startFLSystem}
                  disabled={flStatus?.status === 'active'}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Start
                </Button>
                <Button
                  onClick={stopFLSystem}
                  disabled={flStatus?.status === 'stopped'}
                  className="bg-red-600 hover:bg-red-700"
                  size="sm"
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">System Status</p>
                <p className={`font-semibold ${getStatusColor(flStatus?.status || 'unknown')}`}>
                  {(flStatus?.status || 'Unknown').toUpperCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RotateCcw className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">FL Rounds</p>
                <p className="text-xl font-bold text-white">{flStatus?.fl_rounds_completed || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-sm text-gray-400">Active Nodes</p>
                <p className="text-xl font-bold text-white">{flStatus?.active_nodes || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-400">Global Accuracy</p>
                <p className="text-xl font-bold text-white">
                  {(flStatus?.global_accuracy * 100 || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 bg-gray-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="nodes">Node Details</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="threats">Threats</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-400" />
                  Threats Detected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-2">
                  {flStatus?.threats_detected || 0}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">{threats.filter(t => t.severity === 'Critical').length} Critical</Badge>
                  <Badge variant="secondary">{threats.filter(t => t.severity === 'High').length} High</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  False Positives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-2">
                  {flStatus?.false_positives || 0}
                </div>
                <p className="text-sm text-gray-400">
                  Rate: {((flStatus?.false_positives / (flStatus?.threats_detected + flStatus?.false_positives)) * 100 || 0).toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-400" />
                  System Uptime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-2">
                  {Math.floor((flStatus?.system_uptime || 0) / 3600)}h {Math.floor(((flStatus?.system_uptime || 0) % 3600) / 60)}m
                </div>
                <p className="text-sm text-gray-400">Continuous Operation</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Performance Chart */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Performance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <p className="text-gray-400">Real-time performance visualization</p>
                  <p className="text-sm text-gray-500">Latest accuracy: {(flStatus?.global_accuracy * 100 || 0).toFixed(2)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nodes" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {nodes.map((node) => (
              <Card key={node.id} className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">{node.name}</CardTitle>
                    <Badge variant={node.status === 'active' ? 'default' : 'secondary'}>
                      {node.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Model Type</p>
                      <p className="text-white font-medium">{node.model_type}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Location</p>
                      <p className="text-white font-medium">{node.location}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Data Samples</p>
                      <p className="text-white font-medium">{node.samples.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Latency</p>
                      <p className="text-white font-medium">{node.latency.toFixed(1)}ms</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Local Accuracy</span>
                      <span className="text-sm text-white font-medium">
                        {(node.accuracy * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={node.accuracy * 100} className="h-2" />
                  </div>

                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-gray-400">Threats: </span>
                      <span className="text-white">{node.threats_detected}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      <span className="text-gray-400">FP: </span>
                      <span className="text-white">{node.false_positives}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Performance Metrics History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performance.slice(-5).map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-400">Round</p>
                        <p className="text-white font-bold">{metric.round}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-400">Accuracy</p>
                        <p className="text-white font-bold">{(metric.accuracy * 100).toFixed(1)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-400">F1 Score</p>
                        <p className="text-white font-bold">{(metric.f1_score * 100).toFixed(1)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-400">Threats</p>
                        <p className="text-white font-bold">{metric.threats_detected}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        {new Date(metric.timestamp).toLocaleTimeString()}
                      </p>
                      <Badge variant="outline">
                        {metric.training_time.toFixed(0)}s training
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Eye className="h-5 w-5 text-red-400" />
                Live Threat Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {threats.map((threat) => (
                  <div key={threat.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant={getSeverityColor(threat.severity)}>
                        {threat.severity}
                      </Badge>
                      <div>
                        <p className="text-white font-medium">{threat.type}</p>
                        <p className="text-sm text-gray-400">
                          {threat.source_ip} → {threat.target}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">
                        {new Date(threat.timestamp).toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Confidence: {(threat.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-400" />
                  System Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">CPU Usage</span>
                    <span className="text-white">{systemHealth?.cpu_usage?.toFixed(1) || 0}%</span>
                  </div>
                  <Progress value={systemHealth?.cpu_usage || 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Memory Usage</span>
                    <span className="text-white">{systemHealth?.memory_usage?.toFixed(1) || 0}%</span>
                  </div>
                  <Progress value={systemHealth?.memory_usage || 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Disk Usage</span>
                    <span className="text-white">{systemHealth?.disk_usage?.toFixed(1) || 0}%</span>
                  </div>
                  <Progress value={systemHealth?.disk_usage || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Network className="h-5 w-5 text-green-400" />
                  Network Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Average Latency</span>
                  <span className="text-white">{systemHealth?.network_latency?.toFixed(1) || 0}ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Active Connections</span>
                  <span className="text-white">{nodes.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Data Throughput</span>
                  <span className="text-white">1.2 GB/s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Last Health Check</span>
                  <span className="text-white">
                    {systemHealth?.timestamp ? new Date(systemHealth.timestamp).toLocaleTimeString() : 'Unknown'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
