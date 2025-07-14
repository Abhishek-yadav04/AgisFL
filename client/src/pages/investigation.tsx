
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Download, Eye, AlertTriangle, Clock } from "lucide-react";

export default function Investigation() {
  const [searchQuery, setSearchQuery] = useState("");
  const [investigations, setInvestigations] = useState([
    {
      id: "INV-2025-001",
      title: "Suspicious Network Activity",
      status: "active",
      priority: "high", 
      created: "2025-01-14T10:30:00Z",
      updated: "2025-01-14T15:45:00Z",
      assignee: "Security Analyst"
    },
    {
      id: "INV-2025-002", 
      title: "Anomalous Login Pattern",
      status: "pending",
      priority: "medium",
      created: "2025-01-14T09:15:00Z",
      updated: "2025-01-14T14:20:00Z", 
      assignee: "SOC Team"
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Investigation</h1>
          <p className="text-gray-400">Analyze security incidents and threats</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Search className="mr-2 h-4 w-4" />
          New Investigation
        </Button>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="bg-gray-800">
          <TabsTrigger value="active">Active Cases</TabsTrigger>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="closed">Closed Cases</TabsTrigger>
          <TabsTrigger value="timeline">Timeline Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="flex space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search investigations..."
                className="pl-10 bg-gray-800 border-gray-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="border-gray-600">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>

          <div className="grid gap-4">
            {investigations.map((investigation) => (
              <Card key={investigation.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(investigation.status)}`}></div>
                      <CardTitle className="text-white">{investigation.title}</CardTitle>
                      <Badge variant={getPriorityColor(investigation.priority)}>
                        {investigation.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">ID:</span>
                      <span className="text-white ml-2 font-mono">{investigation.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Assignee:</span>
                      <span className="text-white ml-2">{investigation.assignee}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Created:</span>
                      <span className="text-white ml-2">{new Date(investigation.created).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Updated:</span>
                      <span className="text-white ml-2">{new Date(investigation.updated).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Pending Investigations</h3>
              <p className="text-gray-400">All investigations are currently being processed.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="closed">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Closed Cases</h3>
              <p className="text-gray-400">Completed investigations will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Investigation Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-white font-semibold">Investigation Started</p>
                    <p className="text-gray-400 text-sm">Initial threat detected - suspicious network activity</p>
                    <p className="text-gray-500 text-xs">Today at 10:30 AM</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-white font-semibold">Evidence Collected</p>
                    <p className="text-gray-400 text-sm">Network logs and packet captures analyzed</p>
                    <p className="text-gray-500 text-xs">Today at 2:15 PM</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
