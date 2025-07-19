
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Network, 
  Brain, 
  Activity, 
  Users, 
  Server, 
  Shield, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Cpu
} from 'lucide-react';

interface FLNode {
  id: string;
  name: string;
  status: 'active' | 'training' | 'offline' | 'synchronizing';
  modelAccuracy: number;
  dataPoints: number;
  lastUpdate: string;
  contribution: number;
  location: string;
}

interface TrainingRound {
  round: number;
  timestamp: string;
  participants: number;
  globalAccuracy: number;
  convergence: number;
  duration: string;
}

export default function FederatedLearning() {
  const [nodes, setNodes] = useState<FLNode[]>([]);
  const [trainingRounds, setTrainingRounds] = useState<TrainingRound[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [globalAccuracy, setGlobalAccuracy] = useState(0);
  const [isTraining, setIsTraining] = useState(false);

  useEffect(() => {
    // Simulate federated learning data
    const mockNodes: FLNode[] = [
      {
        id: 'node-001',
        name: 'Corporate HQ',
        status: 'active',
        modelAccuracy: 94.2,
        dataPoints: 15420,
        lastUpdate: new Date().toISOString(),
        contribution: 25.3,
        location: 'New York'
      },
      {
        id: 'node-002',
        name: 'European Branch',
        status: 'training',
        modelAccuracy: 91.8,
        dataPoints: 12350,
        lastUpdate: new Date(Date.now() - 300000).toISOString(),
        contribution: 22.1,
        location: 'London'
      },
      {
        id: 'node-003',
        name: 'Asia Pacific',
        status: 'active',
        modelAccuracy: 93.5,
        dataPoints: 18920,
        lastUpdate: new Date(Date.now() - 120000).toISOString(),
        contribution: 28.7,
        location: 'Singapore'
      },
      {
        id: 'node-004',
        name: 'Research Lab',
        status: 'synchronizing',
        modelAccuracy: 89.3,
        dataPoints: 8750,
        lastUpdate: new Date(Date.now() - 600000).toISOString(),
        contribution: 15.2,
        location: 'California'
      },
      {
        id: 'node-005',
        name: 'Edge Device Cluster',
        status: 'offline',
        modelAccuracy: 86.1,
        dataPoints: 5230,
        lastUpdate: new Date(Date.now() - 1800000).toISOString(),
        contribution: 8.7,
        location: 'Various'
      }
    ];

    const mockRounds: TrainingRound[] = [
      {
        round: 47,
        timestamp: new Date().toISOString(),
        participants: 4,
        globalAccuracy: 94.8,
        convergence: 98.2,
        duration: '12m 34s'
      },
      {
        round: 46,
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        participants: 5,
        globalAccuracy: 94.1,
        convergence: 96.8,
        duration: '15m 12s'
      },
      {
        round: 45,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        participants: 4,
        globalAccuracy: 93.7,
        convergence: 95.3,
        duration: '18m 45s'
      }
    ];

    setNodes(mockNodes);
    setTrainingRounds(mockRounds);
    setCurrentRound(47);
    setGlobalAccuracy(94.8);
    setIsTraining(mockNodes.some(node => node.status === 'training'));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'training': return 'bg-blue-500';
      case 'synchronizing': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'training': return <Brain className="h-4 w-4" />;
      case 'synchronizing': return <Clock className="h-4 w-4" />;
      case 'offline': return <AlertTriangle className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  const handleStartTraining = () => {
    setIsTraining(true);
    // Simulate training process
    setTimeout(() => {
      setIsTraining(false);
      setCurrentRound(prev => prev + 1);
      setGlobalAccuracy(prev => Math.min(prev + Math.random() * 0.5, 99.9));
    }, 5000);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Federated Learning</h1>
          <p className="text-muted-foreground">
            Distributed machine learning for enhanced threat detection
          </p>
        </div>
        <Button 
          onClick={handleStartTraining}
          disabled={isTraining}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isTraining ? (
            <>
              <Brain className="mr-2 h-4 w-4 animate-spin" />
              Training...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Start Training Round
            </>
          )}
        </Button>
      </div>

      {/* Global Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <Network className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{nodes.filter(n => n.status !== 'offline').length}</p>
                <p className="text-xs text-muted-foreground">Active Nodes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{globalAccuracy.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Global Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{currentRound}</p>
                <p className="text-xs text-muted-foreground">Training Rounds</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <Database className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">
                  {nodes.reduce((sum, node) => sum + node.dataPoints, 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total Data Points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="nodes" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="nodes">Federated Nodes</TabsTrigger>
          <TabsTrigger value="training">Training History</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="nodes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Federated Learning Nodes
              </CardTitle>
              <CardDescription>
                Real-time status and performance of all participating nodes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Node</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Accuracy</TableHead>
                    <TableHead>Data Points</TableHead>
                    <TableHead>Contribution</TableHead>
                    <TableHead>Last Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nodes.map((node) => (
                    <TableRow key={node.id}>
                      <TableCell className="font-medium">{node.name}</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(node.status)} text-white`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(node.status)}
                            {node.status}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>{node.location}</TableCell>
                      <TableCell>{node.modelAccuracy.toFixed(1)}%</TableCell>
                      <TableCell>{node.dataPoints.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={node.contribution} className="w-16" />
                          <span className="text-sm">{node.contribution.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(node.lastUpdate).toLocaleTimeString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Training Round History
              </CardTitle>
              <CardDescription>
                Historical performance of federated learning training rounds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Round</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Global Accuracy</TableHead>
                    <TableHead>Convergence</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainingRounds.map((round) => (
                    <TableRow key={round.round}>
                      <TableCell className="font-medium">#{round.round}</TableCell>
                      <TableCell>
                        {new Date(round.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>{round.participants}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {round.globalAccuracy.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={round.convergence} className="w-16" />
                          <span className="text-sm">{round.convergence.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{round.duration}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Model Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Global Accuracy</span>
                    <span className="font-semibold">{globalAccuracy.toFixed(1)}%</span>
                  </div>
                  <Progress value={globalAccuracy} className="w-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Model Convergence</span>
                    <span className="font-semibold">98.2%</span>
                  </div>
                  <Progress value={98.2} className="w-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Training Efficiency</span>
                    <span className="font-semibold">92.5%</span>
                  </div>
                  <Progress value={92.5} className="w-full" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Privacy Preservation</span>
                    <span className="font-semibold">99.8%</span>
                  </div>
                  <Progress value={99.8} className="w-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Byzantine Tolerance</span>
                    <span className="font-semibold">95.5%</span>
                  </div>
                  <Progress value={95.5} className="w-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Differential Privacy</span>
                    <span className="font-semibold">97.2%</span>
                  </div>
                  <Progress value={97.2} className="w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
