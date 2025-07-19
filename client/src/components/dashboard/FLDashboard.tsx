import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Activity, Users, Brain, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import type { LiveFLData } from "@shared/schema";

interface FLDashboardProps {
  data?: LiveFLData;
}

export function FLDashboard({ data }: FLDashboardProps) {
  const currentModel = data?.currentModel;
  const activeClients = data?.activeClients || [];
  const accuracy = currentModel?.accuracy || 0;
  const trainingRound = data?.trainingRound || 0;
  const participantCount = data?.participantCount || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'training': return 'bg-blue-500';
      case 'reconnecting': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'training': return <Brain className="h-4 w-4" />;
      case 'reconnecting': return <Clock className="h-4 w-4" />;
      case 'offline': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model Accuracy</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(accuracy * 100).toFixed(2)}%</div>
            <Progress value={accuracy * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Round</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainingRound}</div>
            <p className="text-xs text-muted-foreground">Current iteration</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participantCount}</div>
            <p className="text-xs text-muted-foreground">Connected devices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeClients.length}</div>
            <p className="text-xs text-muted-foreground">All registered</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Clients */}
      <Card>
        <CardHeader>
          <CardTitle>Federated Learning Clients</CardTitle>
          <CardDescription>
            Real-time status of all connected FL clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeClients.map((client) => (
              <div key={`${client.id}-${client.status}-${client.clientId}`} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(client.status)}`} />
                  <div>
                    <div className="font-medium">Client {client.clientId}</div>
                    <div className="text-sm text-muted-foreground">
                      Last seen: {new Date(client.lastSeen).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(client.status)}
                      <span className="capitalize">{client.status}</span>
                    </div>
                  </Badge>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {client.modelAccuracy ? `${(client.modelAccuracy * 100).toFixed(1)}%` : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">Accuracy</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{client.trainingRounds}</div>
                    <div className="text-xs text-muted-foreground">Rounds</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{client.dataContribution}</div>
                    <div className="text-xs text-muted-foreground">Data points</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {activeClients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No active clients connected</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Information */}
      <Card>
        <CardHeader>
          <CardTitle>Current Model</CardTitle>
          <CardDescription>
            Global federated learning model status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Model Version</label>
                  <div className="text-lg font-mono">{currentModel?.version || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Accuracy</label>
                  <div className="text-lg">{currentModel ? `${(currentModel.accuracy * 100).toFixed(3)}%` : 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Participants</label>
                  <div className="text-lg">{currentModel?.participantCount || 0} clients</div>
                </div>
              </div>
            </div>
            <div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Training Round</label>
                  <div className="text-lg">{currentModel?.trainingRound || 0}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Updated</label>
                  <div className="text-lg">
                    {currentModel ? new Date(currentModel.timestamp).toLocaleString() : 'Never'}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" disabled={!currentModel}>
                    Start Training Round
                  </Button>
                  <Button size="sm" variant="outline" disabled={!currentModel}>
                    Export Model
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}