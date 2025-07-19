
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Brain, 
  TrendingUp, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  Wifi
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FLDashboardProps {
  flData?: {
    isRunning: boolean;
    currentRound: number;
    modelAccuracy: number;
    activeClients: number;
    totalClients: number;
  };
}

export function FLDashboard({ flData }: FLDashboardProps) {
  const [isTraining, setIsTraining] = useState(flData?.isRunning || false);
  const { toast } = useToast();

  const handleStartTraining = () => {
    setIsTraining(true);
    toast({
      title: "Training Started",
      description: "Federated learning training has been initiated",
    });
  };

  const handleStopTraining = () => {
    setIsTraining(false);
    toast({
      title: "Training Stopped",
      description: "Federated learning training has been paused",
    });
  };

  const handleResetModel = () => {
    toast({
      title: "Model Reset",
      description: "Federated learning model has been reset",
    });
  };

  const mockClients = [
    { id: 'client-001', status: 'active', accuracy: 0.967, lastSeen: '2 min ago' },
    { id: 'client-002', status: 'training', accuracy: 0.953, lastSeen: '1 min ago' },
    { id: 'client-003', status: 'inactive', accuracy: 0.941, lastSeen: '15 min ago' },
    { id: 'client-004', status: 'active', accuracy: 0.972, lastSeen: '3 min ago' },
    { id: 'client-005', status: 'reconnecting', accuracy: 0.938, lastSeen: '8 min ago' },
  ];

  const mockTrainingHistory = [
    { round: 152, accuracy: 0.942, participants: 4, timestamp: '10 min ago' },
    { round: 153, accuracy: 0.956, participants: 5, timestamp: '8 min ago' },
    { round: 154, accuracy: 0.961, participants: 4, timestamp: '6 min ago' },
    { round: 155, accuracy: 0.968, participants: 5, timestamp: '4 min ago' },
    { round: 156, accuracy: 0.973, participants: 4, timestamp: '2 min ago' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'training': return 'bg-blue-500';
      case 'inactive': return 'bg-gray-500';
      case 'reconnecting': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'training': return <Brain className="h-4 w-4" />;
      case 'inactive': return <AlertCircle className="h-4 w-4" />;
      case 'reconnecting': return <Wifi className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main FL Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Federated Learning Controller
              </CardTitle>
              <CardDescription>
                Manage distributed machine learning across multiple clients
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={isTraining ? handleStopTraining : handleStartTraining}
                className={isTraining ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
              >
                {isTraining ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isTraining ? 'Stop Training' : 'Start Training'}
              </Button>
              <Button variant="outline" onClick={handleResetModel}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Model
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {flData?.currentRound || 156}
              </div>
              <div className="text-sm text-muted-foreground">Training Round</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {((flData?.modelAccuracy || 0.973) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Model Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">
                {flData?.activeClients || 4}
              </div>
              <div className="text-sm text-muted-foreground">Active Clients</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {flData?.totalClients || 5}
              </div>
              <div className="text-sm text-muted-foreground">Total Clients</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed FL Information */}
      <Tabs defaultValue="clients" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clients">Client Nodes</TabsTrigger>
          <TabsTrigger value="training">Training History</TabsTrigger>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Client Network Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockClients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(client.status)}`} />
                      <div>
                        <div className="font-medium">{client.id}</div>
                        <div className="text-sm text-muted-foreground">
                          Last seen: {client.lastSeen}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getStatusIcon(client.status)}
                        {client.status}
                      </Badge>
                      <div className="text-right">
                        <div className="font-medium">{(client.accuracy * 100).toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">Accuracy</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Training Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTrainingHistory.reverse().map((entry) => (
                  <div key={entry.round} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="font-bold text-blue-500">#{entry.round}</div>
                        <div className="text-xs text-muted-foreground">Round</div>
                      </div>
                      <div>
                        <div className="font-medium">{(entry.accuracy * 100).toFixed(1)}% Accuracy</div>
                        <div className="text-sm text-muted-foreground">
                          {entry.participants} participants • {entry.timestamp}
                        </div>
                      </div>
                    </div>
                    <div className="w-24">
                      <Progress value={entry.accuracy * 100} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Model Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Overall Accuracy</span>
                    <span>97.3%</span>
                  </div>
                  <Progress value={97.3} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Precision</span>
                    <span>94.8%</span>
                  </div>
                  <Progress value={94.8} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Recall</span>
                    <span>96.1%</span>
                  </div>
                  <Progress value={96.1} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>F1-Score</span>
                    <span>95.4%</span>
                  </div>
                  <Progress value={95.4} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Network Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Total Data Points</span>
                  <span className="font-medium">2.3M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Training Samples</span>
                  <span className="font-medium">1.8M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Validation Samples</span>
                  <span className="font-medium">300K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Test Samples</span>
                  <span className="font-medium">200K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Model Parameters</span>
                  <span className="font-medium">850K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Update Size</span>
                  <span className="font-medium">245KB</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
