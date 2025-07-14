
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Calendar, BarChart, PieChart, TrendingUp } from "lucide-react";

export default function Reports() {
  const [reports] = useState([
    {
      id: "RPT-001",
      name: "Security Summary Report", 
      type: "security",
      generated: "2025-01-14T09:00:00Z",
      status: "ready"
    },
    {
      id: "RPT-002",
      name: "Threat Intelligence Report",
      type: "intelligence", 
      generated: "2025-01-13T16:30:00Z",
      status: "ready"
    },
    {
      id: "RPT-003", 
      name: "Compliance Audit Report",
      type: "compliance",
      generated: "2025-01-12T14:15:00Z", 
      status: "ready"
    }
  ]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'security': return 'destructive';
      case 'intelligence': return 'secondary';
      case 'compliance': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Reports</h1>
          <p className="text-gray-400">Generate and manage security reports</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <FileText className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </div>

      <Tabs defaultValue="available" className="space-y-4">
        <TabsList className="bg-gray-800">
          <TabsTrigger value="available">Available Reports</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="analytics">Report Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-6 w-6 text-blue-500" />
                      <div>
                        <CardTitle className="text-white">{report.name}</CardTitle>
                        <p className="text-sm text-gray-400">ID: {report.id}</p>
                      </div>
                      <Badge variant={getTypeColor(report.type)}>
                        {report.type}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-green-600">
                        {report.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    Generated: {new Date(report.generated).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Scheduled Reports</h3>
              <p className="text-gray-400">Set up automated report generation schedules.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <BarChart className="h-8 w-8 text-blue-500 mb-2" />
                <CardTitle className="text-white">Security Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm">Comprehensive security metrics and KPIs</p>
                <Button className="w-full mt-4" variant="outline">Use Template</Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <PieChart className="h-8 w-8 text-green-500 mb-2" />
                <CardTitle className="text-white">Threat Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm">Detailed threat intelligence report</p>
                <Button className="w-full mt-4" variant="outline">Use Template</Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-purple-500 mb-2" />
                <CardTitle className="text-white">Compliance Report</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm">Regulatory compliance assessment</p>
                <Button className="w-full mt-4" variant="outline">Use Template</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Report Generation Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">This Week</span>
                    <span className="text-white font-bold">12 reports</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">This Month</span>
                    <span className="text-white font-bold">48 reports</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Most Popular</span>
                    <span className="text-white font-bold">Security Summary</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Report Types Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Security Reports</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-gray-700 rounded">
                        <div className="w-16 h-2 bg-red-500 rounded"></div>
                      </div>
                      <span className="text-white text-sm">65%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Intelligence</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-gray-700 rounded">
                        <div className="w-8 h-2 bg-blue-500 rounded"></div>
                      </div>
                      <span className="text-white text-sm">25%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Compliance</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-gray-700 rounded">
                        <div className="w-3 h-2 bg-green-500 rounded"></div>
                      </div>
                      <span className="text-white text-sm">10%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
