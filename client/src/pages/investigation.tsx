
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  FileText, 
  Database, 
  Network, 
  Clock, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  Eye,
  Filter
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ForensicEvidence {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  size: string;
  hash: string;
  status: 'processing' | 'analyzed' | 'corrupted';
  findings?: string[];
}

interface Investigation {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'suspended';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: string;
  createdAt: string;
  updatedAt: string;
  evidence: ForensicEvidence[];
  timeline: Array<{
    timestamp: string;
    event: string;
    actor: string;
    details: string;
  }>;
}

const mockInvestigations: Investigation[] = [
  {
    id: "INV-001",
    title: "Data Exfiltration Investigation",
    description: "Investigating suspicious data transfer patterns detected by our ML models",
    status: "active",
    priority: "critical",
    assignee: "Senior Analyst",
    createdAt: "2025-01-13T10:00:00Z",
    updatedAt: "2025-01-13T14:30:00Z",
    evidence: [
      {
        id: "EVD-001",
        type: "Network Traffic",
        source: "Firewall Logs",
        timestamp: "2025-01-13T09:45:00Z",
        size: "2.4 GB",
        hash: "sha256:a1b2c3d4...",
        status: "analyzed",
        findings: ["Unusual outbound traffic", "Encrypted payload detected"]
      },
      {
        id: "EVD-002",
        type: "System Logs",
        source: "Server-01",
        timestamp: "2025-01-13T09:50:00Z",
        size: "156 MB",
        hash: "sha256:e5f6g7h8...",
        status: "processing"
      }
    ],
    timeline: [
      {
        timestamp: "2025-01-13T09:30:00Z",
        event: "Anomaly Detected",
        actor: "ML Detection System",
        details: "Unusual data access patterns identified"
      },
      {
        timestamp: "2025-01-13T10:00:00Z",
        event: "Investigation Initiated",
        actor: "Security Team",
        details: "Formal investigation case opened"
      }
    ]
  }
];

export default function Investigation() {
  const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: investigations = mockInvestigations, isLoading } = useQuery({
    queryKey: ["investigations"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/investigations");
        if (!response.ok) throw new Error("Failed to fetch investigations");
        return await response.json();
      } catch (error) {
        console.warn("Using mock data for investigations");
        return mockInvestigations;
      }
    }
  });

  const filteredInvestigations = investigations.filter(inv => {
    const matchesSearch = inv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || inv.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'suspended': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Search className="h-8 w-8 text-blue-500" />
            Digital Forensics & Investigation
          </h1>
          <p className="text-gray-400 mt-1">
            Conduct detailed security investigations and forensic analysis
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Upload className="h-4 w-4 mr-2" />
          New Investigation
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Investigations List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Active Investigations</CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="Search investigations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterStatus(filterStatus === "all" ? "active" : "all")}
                  className="border-gray-600"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredInvestigations.map((investigation) => (
                <div
                  key={investigation.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedInvestigation?.id === investigation.id
                      ? 'border-blue-500 bg-gray-700'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedInvestigation(investigation)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-white truncate">{investigation.title}</h4>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(investigation.status)}
                      <Badge className={getPriorityColor(investigation.priority)}>
                        {investigation.priority}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                    {investigation.description}
                  </p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{investigation.assignee}</span>
                    <span>{new Date(investigation.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Investigation Details */}
        <div className="lg:col-span-2">
          {selectedInvestigation ? (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="bg-gray-800">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="evidence">Evidence</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">{selectedInvestigation.title}</CardTitle>
                      <Badge className={getPriorityColor(selectedInvestigation.priority)}>
                        {selectedInvestigation.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription className="text-gray-400">
                      {selectedInvestigation.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-300">Investigation ID</label>
                        <p className="text-white">{selectedInvestigation.id}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-300">Status</label>
                        <p className="text-white capitalize">{selectedInvestigation.status}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-300">Assignee</label>
                        <p className="text-white">{selectedInvestigation.assignee}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-300">Created</label>
                        <p className="text-white">{new Date(selectedInvestigation.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-300">Investigation Notes</label>
                      <Textarea 
                        placeholder="Add investigation notes..."
                        className="mt-2 bg-gray-700 border-gray-600 text-white"
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="evidence">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Digital Evidence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedInvestigation.evidence.map((evidence) => (
                        <div
                          key={evidence.id}
                          className="p-4 border border-gray-600 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Database className="h-5 w-5 text-blue-500" />
                              <h4 className="font-medium text-white">{evidence.type}</h4>
                            </div>
                            <Badge 
                              variant={evidence.status === 'analyzed' ? 'default' : 'secondary'}
                            >
                              {evidence.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <span className="text-gray-400">Source:</span>
                              <span className="text-white ml-2">{evidence.source}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Size:</span>
                              <span className="text-white ml-2">{evidence.size}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Timestamp:</span>
                              <span className="text-white ml-2">
                                {new Date(evidence.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Hash:</span>
                              <span className="text-white ml-2 font-mono text-xs">
                                {evidence.hash}
                              </span>
                            </div>
                          </div>

                          {evidence.findings && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-gray-300 mb-2">Key Findings:</h5>
                              <ul className="space-y-1">
                                {evidence.findings.map((finding, index) => (
                                  <li key={index} className="text-sm text-gray-400 flex items-center gap-2">
                                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                    {finding}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="border-gray-600">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="outline" className="border-gray-600">
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
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
                      {selectedInvestigation.timeline.map((event, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            {index < selectedInvestigation.timeline.length - 1 && (
                              <div className="w-px h-12 bg-gray-600 mt-2"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-white">{event.event}</h4>
                              <span className="text-xs text-gray-400">
                                {new Date(event.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 mb-1">{event.details}</p>
                            <span className="text-xs text-blue-400">{event.actor}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analysis">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">AI-Powered Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                      <h4 className="font-medium text-blue-300 mb-2">Threat Intelligence Summary</h4>
                      <p className="text-gray-300 text-sm">
                        ML models have identified patterns consistent with advanced persistent threat (APT) activity.
                        The attack vector shows sophisticated lateral movement techniques.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                      <h4 className="font-medium text-yellow-300 mb-2">Risk Assessment</h4>
                      <p className="text-gray-300 text-sm">
                        High probability of data exfiltration. Recommend immediate containment and further analysis
                        of affected systems.
                      </p>
                    </div>

                    <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                      <h4 className="font-medium text-green-300 mb-2">Recommended Actions</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• Isolate affected systems immediately</li>
                        <li>• Preserve forensic evidence</li>
                        <li>• Reset credentials for affected accounts</li>
                        <li>• Deploy additional monitoring on critical systems</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="bg-gray-800 border-gray-700 h-96 flex items-center justify-center">
              <div className="text-center">
                <Search className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  Select an Investigation
                </h3>
                <p className="text-gray-500">
                  Choose an investigation from the list to view details
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
