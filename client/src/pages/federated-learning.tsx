
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Brain, Network, Activity, Zap, AlertTriangle, CheckCircle, Users, Target } from "lucide-react";

interface FLNode {
  node_id: string;
  model_type: string;
  is_trained: boolean;
  training_samples: number;
  training_history: any[];
}

interface FLStatus {
  model_trained: boolean;
  total_processed_last_hour: number;
  anomalies_detected_last_hour: number;
  detection_rate: number;
  model_type: string;
  federated_learning_enabled: boolean;
  active_nodes: number;
  trained_nodes: number;
  fl_rounds_completed: number;
  node_details: FLNode[];
}

interface PerformanceMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  note?: string;
}

export default function FederatedLearning() {
  const [flStatus, setFlStatus] = useState<FLStatus | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [nodes, setNodes] = useState<{ nodes: FLNode[]; total_nodes: number; federated_rounds: number } | null>(null);
  const [isTraining, setIsTraining] = useState(false);

  useEffect(() => {
    fetchFLStatus();
    fetchPerformance();
    fetchNodes();
    
    const interval = setInterval(() => {
      fetchFLStatus();
      fetchPerformance();
      fetchNodes();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchFLStatus = async () => {
    try {
      const response = await fetch('/api/fl-ids/status');
      const data = await response.json();
      setFlStatus(data);
    } catch (error) {
      console.error('Failed to fetch FL status:', error);
    }
  };

  const fetchPerformance = async () => {
    try {
      const response = await fetch('/api/fl-ids/performance');
      const data = await response.json();
      setPerformance(data);
    } catch (error) {
      console.error('Failed to fetch performance:', error);
    }
  };

  const fetchNodes = async () => {
    try {
      const response = await fetch('/api/fl-ids/nodes');
      const data = await response.json();
      setNodes(data);
    } catch (error) {
      console.error('Failed to fetch nodes:', error);
    }
  };

  const startTraining = async () => {
    setIsTraining(true);
    try {
      await fetch('/api/fl-ids/train', { method: 'POST' });
      setTimeout(() => {
        fetchFLStatus();
        fetchPerformance();
        fetchNodes();
        setIsTraining(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to start training:', error);
      setIsTraining(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Brain className="h-8 w-8 text-blue-500" />
                Federated Learning IDS
              </h1>
              <p className="text-gray-400 mt-2">
                Advanced Intrusion Detection using Distributed Machine Learning
              </p>
            </div>
            <Button 
              onClick={startTraining} 
              disabled={isTraining}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isTraining ? "Training..." : "Start Training Round"}
            </Button>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">FL Status</CardTitle>
                <Network className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {flStatus?.federated_learning_enabled ? "Active" : "Inactive"}
                </div>
                <p className="text-xs text-gray-400">
                  {flStatus?.fl_rounds_completed || 0} rounds completed
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Nodes</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {flStatus?.trained_nodes || 0}/{flStatus?.active_nodes || 0}
                </div>
                <p className="text-xs text-gray-400">Trained/Total nodes</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Detection Rate</CardTitle>
                <Target className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {flStatus?.detection_rate?.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-gray-400">
                  {flStatus?.anomalies_detected_last_hour || 0} anomalies detected
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Model Accuracy</CardTitle>
                <Activity className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performance?.accuracy ? (performance.accuracy * 100).toFixed(1) : 0}%
                </div>
                <p className="text-xs text-gray-400">Overall performance</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-800">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="nodes">FL Nodes</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="training">Training</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Federated Learning Architecture
                    </CardTitle>
                    <CardDescription>
                      Distributed learning across multiple nodes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Model Type:</span>
                      <Badge variant="outline">{flStatus?.model_type}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>FL Rounds:</span>
                      <Badge variant="secondary">{flStatus?.fl_rounds_completed}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Data Processed (1h):</span>
                      <span className="font-mono">{flStatus?.total_processed_last_hour}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Real-time Monitoring
                    </CardTitle>
                    <CardDescription>
                      Live threat detection status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className={`border-l-4 ${flStatus?.model_trained ? 'border-green-500' : 'border-orange-500'}`}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Model Status</AlertTitle>
                      <AlertDescription>
                        {flStatus?.model_trained 
                          ? "Federated model is trained and active"
                          : "Model requires training to become operational"
                        }
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Training Progress</span>
                        <span>{((flStatus?.trained_nodes || 0) / Math.max(flStatus?.active_nodes || 1, 1) * 100).toFixed(0)}%</span>
                      </div>
                      <Progress 
                        value={(flStatus?.trained_nodes || 0) / Math.max(flStatus?.active_nodes || 1, 1) * 100} 
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="nodes" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {flStatus?.node_details?.map((node, index) => (
                  <Card key={node.node_id} className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-sm font-medium">{node.node_id}</span>
                        {node.is_trained ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        <Badge variant="outline" className="text-xs">
                          {node.model_type}
                        </Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Status:</span>
                        <span className={node.is_trained ? "text-green-500" : "text-orange-500"}>
                          {node.is_trained ? "Trained" : "Training"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Samples:</span>
                        <span className="font-mono">{node.training_samples}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Training Rounds:</span>
                        <span className="font-mono">{node.training_history?.length || 0}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle>Model Performance Metrics</CardTitle>
                    <CardDescription>
                      Evaluation results from federated model
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {performance ? (
                      <>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span>Accuracy:</span>
                            <span className="font-mono text-green-500">
                              {(performance.accuracy * 100).toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Precision:</span>
                            <span className="font-mono text-blue-500">
                              {(performance.precision * 100).toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Recall:</span>
                            <span className="font-mono text-purple-500">
                              {(performance.recall * 100).toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>F1-Score:</span>
                            <span className="font-mono text-orange-500">
                              {(performance.f1_score * 100).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-gray-400">
                        No performance data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle>Detection Statistics</CardTitle>
                    <CardDescription>
                      Recent intrusion detection activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Total Processed:</span>
                        <span className="font-mono">{flStatus?.total_processed_last_hour || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Anomalies Found:</span>
                        <span className="font-mono text-red-500">
                          {flStatus?.anomalies_detected_last_hour || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Detection Rate:</span>
                        <span className="font-mono text-orange-500">
                          {flStatus?.detection_rate?.toFixed(2) || 0}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="training" className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Training Control</CardTitle>
                  <CardDescription>
                    Manage federated learning training process
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <Button 
                      onClick={startTraining} 
                      disabled={isTraining}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isTraining ? "Training in Progress..." : "Start Training Round"}
                    </Button>
                  </div>
                  
                  <Alert className="border-l-4 border-blue-500">
                    <Brain className="h-4 w-4" />
                    <AlertTitle>Federated Learning Process</AlertTitle>
                    <AlertDescription>
                      Training rounds coordinate learning across all nodes without sharing raw data, 
                      ensuring privacy while improving model performance.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
