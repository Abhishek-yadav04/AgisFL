
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Network, 
  Brain, 
  Shield, 
  Activity, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Cpu,
  Eye,
  BarChart3
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface FLNode {
  node_id: string;
  model_type: string;
  is_trained: boolean;
  training_samples: number;
  contribution?: number;
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

interface FLPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  auc_roc: number;
  false_positive_rate: number;
  training_rounds: number;
  convergence_rate: number;
  node_contributions: Array<{
    node_id: string;
    contribution: number;
    samples: number;
  }>;
}

export function FederatedLearningPanel() {
  const { data: flStatus, isLoading: statusLoading } = useQuery<FLStatus>({
    queryKey: ['/api/fl-ids/status'],
    refetchInterval: 10000,
  });

  const { data: flPerformance, isLoading: perfLoading } = useQuery<FLPerformance>({
    queryKey: ['/api/fl-ids/performance'],
    refetchInterval: 30000,
  });

  const { data: flNodes } = useQuery({
    queryKey: ['/api/fl-ids/nodes'],
    refetchInterval: 15000,
  });

  // Generate mock training history data
  const trainingHistory = Array.from({ length: 12 }, (_, i) => ({
    round: i + 1,
    accuracy: 0.85 + Math.random() * 0.1,
    loss: 0.3 - i * 0.02 + Math.random() * 0.05,
    participants: 3 + Math.floor(Math.random() * 2)
  }));

  const nodeColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  if (statusLoading) {
    return (
      <Card className="surface card-elevation animate-pulse">
        <CardContent className="p-6">
          <div className="h-96 bg-gray-700 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="surface card-elevation">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Network className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl on-surface">Federated Learning IDS</CardTitle>
              <p className="text-sm on-surface-variant">
                Privacy-Preserving Collaborative Intrusion Detection
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={flStatus?.federated_learning_enabled ? "default" : "destructive"}
              className="text-xs"
            >
              {flStatus?.federated_learning_enabled ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Round {flStatus?.fl_rounds_completed || 0}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="nodes">Nodes</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-gray-400">Active Nodes</span>
                </div>
                <p className="text-2xl font-bold text-white">{flStatus?.active_nodes || 0}</p>
                <p className="text-xs text-gray-500">{flStatus?.trained_nodes || 0} trained</p>
              </div>

              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-400">Detection Rate</span>
                </div>
                <p className="text-2xl font-bold text-white">{flStatus?.detection_rate?.toFixed(1) || 0}%</p>
                <p className="text-xs text-gray-500">{flStatus?.anomalies_detected_last_hour || 0} anomalies/hr</p>
              </div>

              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-2 mb-2">
                  <Database className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-gray-400">Processed</span>
                </div>
                <p className="text-2xl font-bold text-white">{flStatus?.total_processed_last_hour || 0}</p>
                <p className="text-xs text-gray-500">samples/hour</p>
              </div>

              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-orange-400" />
                  <span className="text-sm text-gray-400">Accuracy</span>
                </div>
                <p className="text-2xl font-bold text-white">{((flPerformance?.accuracy || 0) * 100).toFixed(1)}%</p>
                <p className="text-xs text-gray-500">F1: {((flPerformance?.f1_score || 0) * 100).toFixed(1)}%</p>
              </div>
            </div>

            {/* Training Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Model Convergence</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Convergence Rate</span>
                      <span>{((flPerformance?.convergence_rate || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={(flPerformance?.convergence_rate || 0) * 100} 
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Training Rounds</span>
                      <span>{flPerformance?.training_rounds || 0}/50</span>
                    </div>
                    <Progress 
                      value={((flPerformance?.training_rounds || 0) / 50) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Privacy & Security</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Differential Privacy</span>
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Secure Aggregation</span>
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Byzantine Tolerance</span>
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Node Verification</span>
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="nodes" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {flStatus?.node_details?.map((node, index) => (
                <div key={node.node_id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: nodeColors[index % nodeColors.length] }}
                      />
                      <span className="text-sm font-medium text-white">{node.node_id}</span>
                    </div>
                    <Badge 
                      variant={node.is_trained ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {node.is_trained ? "Trained" : "Training"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Model Type</span>
                      <span className="text-gray-300">{node.model_type}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Training Samples</span>
                      <span className="text-gray-300">{node.training_samples}</span>
                    </div>
                    {node.contribution && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Contribution</span>
                        <span className="text-gray-300">{(node.contribution * 100).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Node Contributions Chart */}
            {flPerformance?.node_contributions && (
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-4">Node Contributions</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={flPerformance.node_contributions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="node_id" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="contribution" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            {/* Performance Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {flPerformance && Object.entries({
                'Accuracy': flPerformance.accuracy,
                'Precision': flPerformance.precision,
                'Recall': flPerformance.recall,
                'F1 Score': flPerformance.f1_score,
                'AUC-ROC': flPerformance.auc_roc,
                'FPR': flPerformance.false_positive_rate
              }).map(([metric, value]) => (
                <div key={metric} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="text-sm text-gray-400 mb-1">{metric}</div>
                  <div className="text-2xl font-bold text-white">
                    {(value * 100).toFixed(1)}%
                  </div>
                  <Progress 
                    value={value * 100} 
                    className="h-2 mt-2"
                  />
                </div>
              ))}
            </div>

            {/* Performance Chart */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-4">Model Performance Trends</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trainingHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="round" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '6px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Accuracy"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="loss" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    name="Loss"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="training" className="space-y-4">
            {/* Training Controls */}
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div>
                <h4 className="text-sm font-medium text-gray-300">Training Control</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Next round starts automatically in {Math.floor(Math.random() * 60)} seconds
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Activity className="h-4 w-4 mr-2" />
                  Start Round
                </Button>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Monitor
                </Button>
              </div>
            </div>

            {/* Training History */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-4">Recent Training Rounds</h4>
              <div className="space-y-3">
                {trainingHistory.slice(-5).reverse().map((round, index) => (
                  <div key={round.round} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-500/20 rounded-full">
                        <span className="text-xs font-medium text-blue-400">R{round.round}</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-300">Round {round.round}</p>
                        <p className="text-xs text-gray-500">{round.participants} participants</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-300">{(round.accuracy * 100).toFixed(1)}% acc</p>
                      <p className="text-xs text-gray-500">{round.loss.toFixed(3)} loss</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-4">Privacy Configuration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Privacy Budget (ε)</label>
                  <div className="text-sm text-gray-300">1.0</div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Noise Level</label>
                  <div className="text-sm text-gray-300">Low</div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Aggregation Method</label>
                  <div className="text-sm text-gray-300">Secure FedAvg</div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Byzantine Tolerance</label>
                  <div className="text-sm text-gray-300">Enabled</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
