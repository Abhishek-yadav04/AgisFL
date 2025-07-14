import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Brain, RefreshCw, Play, Pause, Settings, AlertTriangle } from "lucide-react";
import { useState } from "react";

/**
 * FederatedLearningPanel Component for AgiesFL Dashboard
 * 
 * This component provides comprehensive control and monitoring of the federated
 * learning system. It displays real-time information about training progress,
 * node participation, model performance, and system health.
 * 
 * @author AgiesFL Development Team
 * @version 1.0.0
 * @since 2025-01-14
 */
export default function FederatedLearningPanel() {
  const [isTraining, setIsTraining] = useState(true);
  const [trainingProgress, setTrainingProgress] = useState(67);
  const [isSystemHealthy, setIsSystemHealthy] = useState(true);

  const federatedMetrics = {
    activeNodes: 247,
    totalNodes: 300,
    currentRound: 15,
    totalRounds: 25,
    modelAccuracy: 94.7,
    avgLatency: 125,
    dataPoints: 1245678
  };

  const nodeStatus = [
    { region: "North America", nodes: 89, active: 87, status: "healthy" },
    { region: "Europe", nodes: 76, active: 74, status: "healthy" },
    { region: "Asia Pacific", nodes: 82, active: 78, status: "warning" },
    { region: "South America", nodes: 53, active: 48, status: "warning" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "warning":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "error":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const handleTrainingToggle = () => {
    setIsTraining(!isTraining);
    console.log(`🧠 Federated learning ${isTraining ? 'paused' : 'resumed'}`);
  };

  const handleRefreshData = () => {
    console.log('🔄 Refreshing federated learning data...');
    // In production, this would trigger a data refresh
  };

  if (!isSystemHealthy) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Federated Learning Control Panel
          </CardTitle>
          <CardDescription>
            Advanced AI-powered distributed learning system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive" className="border-red-700 bg-red-900/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>System Connectivity Issue</AlertTitle>
            <AlertDescription>
              Unable to establish connection with federated learning nodes. 
              This may be due to network connectivity or server maintenance.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col space-y-3">
            <Button 
              onClick={handleRefreshData} 
              variant="outline" 
              className="w-full border-blue-600 text-blue-400 hover:bg-blue-900/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>

            <Button 
              onClick={() => setIsSystemHealthy(true)} 
              variant="outline" 
              className="w-full border-green-600 text-green-400 hover:bg-green-900/20"
            >
              Simulate Connection Restored
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-400" />
          Federated Learning Control Panel
        </CardTitle>
        <CardDescription>
          Advanced AI-powered distributed learning system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Training Status */}
        <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Training Status</h3>
            <Badge className={isTraining ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>
              {isTraining ? "Active" : "Paused"}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Round Progress</span>
              <span className="text-white">{federatedMetrics.currentRound} / {federatedMetrics.totalRounds}</span>
            </div>
            <Progress value={(federatedMetrics.currentRound / federatedMetrics.totalRounds) * 100} className="h-2" />

            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Overall Progress</span>
              <span className="text-white">{trainingProgress}%</span>
            </div>
            <Progress value={trainingProgress} className="h-2" />
          </div>

          <div className="flex space-x-2 mt-4">
            <Button 
              onClick={handleTrainingToggle}
              variant="outline" 
              size="sm"
              className={isTraining ? "border-yellow-600 text-yellow-400" : "border-green-600 text-green-400"}
            >
              {isTraining ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isTraining ? "Pause" : "Resume"}
            </Button>
            <Button onClick={handleRefreshData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-400">Model Accuracy</p>
            <p className="text-lg font-semibold text-green-400">{federatedMetrics.modelAccuracy}%</p>
          </div>
          <div className="p-3 bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-400">Avg Latency</p>
            <p className="text-lg font-semibold text-blue-400">{federatedMetrics.avgLatency}ms</p>
          </div>
          <div className="p-3 bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-400">Active Nodes</p>
            <p className="text-lg font-semibold text-purple-400">{federatedMetrics.activeNodes}/{federatedMetrics.totalNodes}</p>
          </div>
          <div className="p-3 bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-400">Data Points</p>
            <p className="text-lg font-semibold text-yellow-400">{federatedMetrics.dataPoints.toLocaleString()}</p>
          </div>
        </div>

        {/* Regional Node Status */}
        <div>
          <h3 className="text-sm font-medium text-white mb-3">Regional Node Status</h3>
          <div className="space-y-2">
            {nodeStatus.map((region, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-300">{region.region}</span>
                  <Badge className={`${getStatusColor(region.status)} border text-xs`}>
                    {region.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-400">
                  {region.active}/{region.nodes} active
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <Button variant="outline" size="sm" className="border-blue-600 text-blue-400 hover:bg-blue-900/20">
            <Settings className="h-4 w-4 mr-2" />
            Configure Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}