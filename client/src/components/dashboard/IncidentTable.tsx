import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Edit, Download, Plus } from "lucide-react";
import { Incident } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function IncidentTable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: incidents, isLoading } = useQuery<Incident[]>({
    queryKey: ['/api/incidents'],
    refetchInterval: 30000,
  });

  const updateIncidentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Incident> }) => {
      return apiRequest('PATCH', `/api/incidents/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      toast({
        title: "Success",
        description: "Incident updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update incident",
        variant: "destructive",
      });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved': return 'bg-green-500/20 text-green-400';
      case 'investigating': return 'bg-yellow-500/20 text-yellow-400';
      case 'analyzing': return 'bg-blue-500/20 text-blue-400';
      case 'open': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (isLoading) {
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
      <CardHeader className="border-b border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-white">Recent Incidents</CardTitle>
          <div className="flex items-center space-x-2">
            <Button size="sm" className="bg-primary hover:bg-primary/80">
              <Plus className="h-4 w-4 mr-2" />
              New Incident
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="surface-variant">
              <TableRow>
                <TableHead className="text-gray-400">ID</TableHead>
                <TableHead className="text-gray-400">Severity</TableHead>
                <TableHead className="text-gray-400">Type</TableHead>
                <TableHead className="text-gray-400">Description</TableHead>
                <TableHead className="text-gray-400">Assignee</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Time</TableHead>
                <TableHead className="text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents?.map((incident) => (
                <TableRow key={incident.id} className="hover:bg-gray-800/50 transition-colors border-gray-700">
                  <TableCell>
                    <span className="text-sm font-mono text-blue-400">{incident.incidentId}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSeverityColor(incident.severity)}>
                      {incident.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-300">{incident.type}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-300 max-w-xs truncate">{incident.description}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40" />
                        <AvatarFallback>SK</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-300">Sarah Kim</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(incident.status)} border-0`}>
                      {incident.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-400">
                      {new Date(incident.createdAt).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 text-blue-400" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) || (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                    No incidents found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t border-gray-700 flex items-center justify-between">
          <span className="text-sm text-gray-400">
            Showing {incidents?.length || 0} of {incidents?.length || 0} incidents
          </span>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
