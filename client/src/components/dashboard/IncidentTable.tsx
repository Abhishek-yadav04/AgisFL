import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Eye, MoreHorizontal } from "lucide-react";

/**
 * IncidentTable Component for AgiesFL Dashboard
 * 
 * This component displays a comprehensive table of security incidents with
 * detailed information about each incident including severity, status, and
 * assigned personnel. It provides quick access to incident management actions.
 * 
 * @author AgiesFL Development Team
 * @version 1.0.0
 * @since 2025-01-14
 */
export default function IncidentTable() {
  const incidents = [
    {
      id: "INC-2025-001",
      title: "Malware Detection on Node-247",
      severity: "High",
      status: "In Progress",
      assignee: "John Doe",
      created: "2025-01-14 08:30",
      updated: "2025-01-14 09:15"
    },
    {
      id: "INC-2025-002",
      title: "Suspicious Network Traffic",
      severity: "Medium",
      status: "New",
      assignee: "Jane Smith",
      created: "2025-01-14 07:45",
      updated: "2025-01-14 07:45"
    },
    {
      id: "INC-2025-003",
      title: "Failed Authentication Attempts",
      severity: "Critical",
      status: "Resolved",
      assignee: "Mike Johnson",
      created: "2025-01-14 06:20",
      updated: "2025-01-14 08:45"
    },
    {
      id: "INC-2025-004",
      title: "Data Exfiltration Attempt",
      severity: "High",
      status: "Investigating",
      assignee: "Sarah Wilson",
      created: "2025-01-14 05:10",
      updated: "2025-01-14 08:30"
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "High":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "Medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "In Progress":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Investigating":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "Resolved":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-orange-400" />
          <span className="text-white">Recent Security Incidents</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700">
              <TableHead className="text-gray-400">Incident ID</TableHead>
              <TableHead className="text-gray-400">Title</TableHead>
              <TableHead className="text-gray-400">Severity</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400">Assignee</TableHead>
              <TableHead className="text-gray-400">Created</TableHead>
              <TableHead className="text-gray-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.map((incident) => (
              <TableRow key={incident.id} className="border-gray-700">
                <TableCell className="font-medium text-blue-400">
                  {incident.id}
                </TableCell>
                <TableCell className="text-white">
                  {incident.title}
                </TableCell>
                <TableCell>
                  <Badge className={`${getSeverityColor(incident.severity)} border`}>
                    {incident.severity}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(incident.status)} border`}>
                    {incident.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-300">
                  {incident.assignee}
                </TableCell>
                <TableCell className="text-gray-400">
                  {incident.created}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4 text-blue-400" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}