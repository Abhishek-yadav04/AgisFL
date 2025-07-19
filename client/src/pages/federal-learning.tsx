import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useWebSocket } from "@/hooks/use-websocket";
import { Activity, Users, Brain, Shield, TrendingUp, Server } from "lucide-react";

export default function FederatedLearningPage() {
  const { data, isConnected, error } = useWebSocket('/api/ws');

  const federatedNodes = [
    {
      id: "node-001",
      clientId: "FL-CLIENT-001",
      status: "active",
      lastSeen: "2 minutes ago",
      modelAccuracy: 0.87,
      trainingRounds: 42,
      dataContribution: 1250
    },
    {
      id: "node-002", 
      clientId: "FL-CLIENT-002",
      status: "training",
      lastSeen: "1 minute ago",
      modelAccuracy: 0.84,
      trainingRounds: 38,
      dataContribution: 980
    },
    {
      id: "node-003",
      clientId: "FL-CLIENT-003", 
      status: "idle",
      lastSeen: "5 minutes ago",
      modelAccuracy: 0.91,
      trainingRounds: 55,
      dataContribution: 1456
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'training': return 'bg-blue-500';
      case 'idle': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const overallAccuracy = data?.federatedLearning?.modelVersion ? 
    (federatedNodes.reduce((sum, node) => sum + node.modelAccuracy, 0) / federatedNodes.length) * 100 : 87;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Federated Learning</h1>
          <p className="text-gray-600 mt-2">Distributed machine learning for threat detection</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">⚠️ {error}</p>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Nodes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.federatedLearning?.activeNodes || federatedNodes.length}</div>
            <p className="text-xs text-muted-foreground">Participating in training</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model Accuracy</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallAccuracy.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Global model performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Rounds</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.federatedLearning?.trainingRounds || 127}</div>
            <p className="text-xs text-muted-foreground">Total completed rounds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {federatedNodes.reduce((sum, node) => sum + node.dataContribution, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Contributed samples</p>
          </CardContent>
        </Card>
      </div>

      {/* Federated Nodes Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Federated Learning Nodes
          </CardTitle>
          <CardDescription>
            Real-time status of participating nodes in the federated learning network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {federatedNodes.map((node) => (
              <div key={node.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(node.status)}`}></div>
                  <div>
                    <h3 className="font-medium">{node.clientId}</h3>
                    <p className="text-sm text-gray-600">Last seen: {node.lastSeen}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium">Accuracy</p>
                    <p className="text-sm text-gray-600">{(node.modelAccuracy * 100).toFixed(1)}%</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium">Rounds</p>
                    <p className="text-sm text-gray-600">{node.trainingRounds}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium">Data</p>
                    <p className="text-sm text-gray-600">{node.dataContribution.toLocaleString()}</p>
                  </div>

                  <Badge variant={node.status === 'active' ? 'default' : 'secondary'}>
                    {node.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Training Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Global Model Training Progress</CardTitle>
          <CardDescription>Current training round progress and model convergence</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Training Progress</span>
              <span>Round {data?.federatedLearning?.trainingRounds || 127}/200</span>
            </div>
            <Progress value={((data?.federatedLearning?.trainingRounds || 127) / 200) * 100} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Model Convergence</span>
              <span>{overallAccuracy.toFixed(1)}%</span>
            </div>
            <Progress value={overallAccuracy} className="h-2" />
          </div>

          <div className="flex gap-4 pt-4">
            <Button className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Start Training Round
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Deploy Model
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}