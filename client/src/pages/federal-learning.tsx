
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Users, Activity, Zap, Shield, AlertTriangle, CheckCircle, Play, Pause, RotateCcw } from "lucide-react";
import { LiveFLData } from "@shared/schema";

export function FederalLearning() {
  const { data: flData, isLoading, error } = useQuery<LiveFLData>({
    queryKey: ["/api/fl"],
    refetchInterval: 3000,
  });

  const { data: realTimeData, isConnected, sendMessage } = useWebSocket("/api/ws");

  // Use real-time data if available, otherwise fallback to REST API data
  const data = realTimeData?.fl || flData;

  const handleStartTraining = () => {
    sendMessage({ type: 'start_fl_training' });
  };

  const handlePauseTraining = () => {
    sendMessage({ type: 'pause_fl_training' });
  };

  const handleResetTraining = () => {
    sendMessage({ type: 'reset_fl_training' });
  };

  if (error) {
    return (
      <div className="min-h-screen cyber-gradient">
        <TopBar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-500 mb-2">Connection Error</h2>
            <p className="text-gray-300">Failed to load Federal Learning data</p>
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
            <p className="cyber-text-primary text-lg">Loading Federal Learning Module...</p>
          </div>
        </div>
      </div>
    );
  }

  const activeClients = data?.participantCount || 0;
  const accuracy = data?.overallAccuracy || 0;
  const round = data?.trainingRound || 0;
  const isTraining = data?.isRunning || false;

  return (
    <div className="min-h-screen cyber-gradient">
      <TopBar />
      
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold cyber-text-primary flex items-center">
                <Brain className="mr-3 h-8 w-8 text-blue-500" />
                Federal Learning Console
              </h1>
              <p className="cyber-text-muted mt-2">
                Distributed AI training for cybersecurity threat detection
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
              <Badge variant={isTraining ? "default" : "secondary"}>
                {isTraining ? "Training Active" : "Training Paused"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5" />
              Training Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                onClick={handleStartTraining}
                disabled={isTraining}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Training
              </Button>
              <Button 
                onClick={handlePauseTraining}
                disabled={!isTraining}
                variant="outline"
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause Training
              </Button>
              <Button 
                onClick={handleResetTraining}
                variant="destructive"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Training
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium cyber-text-muted">Active Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold cyber-success">{activeClients}</div>
              <div className="flex items-center mt-2">
                <Users className="mr-1 h-4 w-4 text-blue-500" />
                <span className="text-sm cyber-text-muted">Connected Nodes</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium cyber-text-muted">Model Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold cyber-info">{(accuracy * 100).toFixed(1)}%</div>
              <Progress value={accuracy * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium cyber-text-muted">Training Round</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold cyber-warning">{round}</div>
              <div className="flex items-center mt-2">
                <Activity className="mr-1 h-4 w-4 text-yellow-500" />
                <span className="text-sm cyber-text-muted">Current Iteration</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium cyber-text-muted">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                {isTraining ? (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    <span className="cyber-success">Active</span>
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-5 w-5 text-gray-500" />
                    <span className="cyber-text-muted">Standby</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clients">Client Nodes</TabsTrigger>
            <TabsTrigger value="training">Training History</TabsTrigger>
            <TabsTrigger value="model">Model Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Training Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Overall Progress</span>
                        <span>{(accuracy * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={accuracy * 100} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Convergence Rate</span>
                        <span>94.2%</span>
                      </div>
                      <Progress value={94.2} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Privacy Budget</span>
                        <span>73.5%</span>
                      </div>
                      <Progress value={73.5} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Byzantine Tolerance</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Differential Privacy</span>
                      <Badge variant="default">ε = 1.0</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Secure Aggregation</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Threat Detection</span>
                      <Badge variant="default">99.2%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>Connected Client Nodes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.clients?.slice(0, 10).map((client, index) => (
                    <div key={client.clientId || index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          client.status === 'active' ? 'bg-green-500' :
                          client.status === 'training' ? 'bg-blue-500' :
                          client.status === 'reconnecting' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`} />
                        <div>
                          <div className="font-medium">{client.clientId}</div>
                          <div className="text-sm cyber-text-muted">
                            Accuracy: {((client.modelAccuracy || 0) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          client.status === 'active' ? 'default' :
                          client.status === 'training' ? 'default' :
                          client.status === 'reconnecting' ? 'secondary' : 'outline'
                        }>
                          {client.status}
                        </Badge>
                        <div className="text-sm cyber-text-muted mt-1">
                          {client.trainingRounds || 0} rounds
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 cyber-text-muted">
                      No client data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training">
            <Card>
              <CardHeader>
                <CardTitle>Training History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.trainingHistory?.slice(0, 10).map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Round {entry.round}</div>
                        <div className="text-sm cyber-text-muted">
                          {new Date(entry.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{(entry.accuracy * 100).toFixed(1)}%</div>
                        <div className="text-sm cyber-text-muted">
                          {entry.participants} participants
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 cyber-text-muted">
                      No training history available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="model">
            <Card>
              <CardHeader>
                <CardTitle>Current Model Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium cyber-text-muted">Model Version</label>
                      <div className="text-lg font-mono">{data?.currentModel?.version || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium cyber-text-muted">Algorithm</label>
                      <div className="text-lg">Neural Network + Random Forest Ensemble</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium cyber-text-muted">Parameters</label>
                      <div className="text-lg">{data?.currentModel?.modelData?.parameters?.toLocaleString() || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium cyber-text-muted">Last Update</label>
                      <div className="text-lg">
                        {data?.currentModel?.timestamp ? 
                          new Date(data.currentModel.timestamp).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium cyber-text-muted">Update Size</label>
                      <div className="text-lg">{data?.currentModel?.modelData?.updateSize || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium cyber-text-muted">Weights Checksum</label>
                      <div className="text-lg font-mono text-sm">
                        {data?.currentModel?.modelData?.weights || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
