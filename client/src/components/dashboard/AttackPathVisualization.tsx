import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch } from "lucide-react";
import { AttackPath } from "@shared/schema";

export function AttackPathVisualization() {
  const { data: attackPaths, isLoading } = useQuery<AttackPath[]>({
    queryKey: ['/api/attack-paths'],
    refetchInterval: 120000, // Refresh every 2 minutes
  });

  if (isLoading) {
    return (
      <Card className="surface card-elevation animate-pulse">
        <CardContent className="p-6">
          <div className="h-80 bg-gray-700 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  // Calculate aggregated metrics
  const totalNodes = attackPaths?.reduce((sum, path) => sum + (path.compromisedAssets || 0), 0) || 24;
  const totalPaths = attackPaths?.length || 7;
  const highestRiskLevel = attackPaths?.find(path => path.riskLevel === 'Critical')?.riskLevel || 'High';

  return (
    <Card className="surface card-elevation">
      <CardHeader className="border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <GitBranch className="h-4 w-4 text-orange-400" />
          </div>
          <div>
            <CardTitle className="text-lg font-medium text-white">Attack Path Visualization</CardTitle>
            <p className="text-sm text-gray-400">Network analysis insights</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Attack path visualization placeholder */}
        <div className="h-64 bg-gradient-to-br from-orange-500/20 to-blue-500/20 rounded-lg flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0">
            {/* Animated network nodes */}
            <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
            <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-red-400 rounded-full animate-pulse delay-300"></div>
            <div className="absolute bottom-1/3 left-1/2 w-4 h-4 bg-yellow-400 rounded-full animate-pulse delay-700"></div>
            <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-1000"></div>
            
            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full">
              <line x1="25%" y1="25%" x2="66%" y2="33%" stroke="rgba(251, 146, 60, 0.5)" strokeWidth="1" strokeDasharray="4,4">
                <animate attributeName="stroke-dashoffset" values="0;8" dur="2s" repeatCount="indefinite"/>
              </line>
              <line x1="66%" y1="33%" x2="50%" y2="66%" stroke="rgba(251, 146, 60, 0.5)" strokeWidth="1" strokeDasharray="4,4">
                <animate attributeName="stroke-dashoffset" values="0;8" dur="2s" repeatCount="indefinite" begin="0.5s"/>
              </line>
              <line x1="50%" y1="66%" x2="75%" y2="75%" stroke="rgba(251, 146, 60, 0.5)" strokeWidth="1" strokeDasharray="4,4">
                <animate attributeName="stroke-dashoffset" values="0;8" dur="2s" repeatCount="indefinite" begin="1s"/>
              </line>
            </svg>
          </div>
          
          <div className="relative z-10 text-center text-white">
            <GitBranch className="h-12 w-12 opacity-50 mb-4 mx-auto" />
            <p className="text-lg font-medium mb-2">Interactive Attack Graph</p>
            <p className="text-sm opacity-75">Graph neural network analysis</p>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-white">{totalNodes}</p>
            <p className="text-xs text-gray-400">Compromised Assets</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">{totalPaths}</p>
            <p className="text-xs text-gray-400">Attack Vectors</p>
          </div>
          <div>
            <p className={`text-lg font-bold ${
              highestRiskLevel === 'Critical' ? 'text-red-400' :
              highestRiskLevel === 'High' ? 'text-orange-400' :
              'text-yellow-400'
            }`}>
              {highestRiskLevel}
            </p>
            <p className="text-xs text-gray-400">Risk Level</p>
          </div>
        </div>

        {/* Attack path summary */}
        {attackPaths && attackPaths.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="text-sm font-medium text-white">Active Attack Paths</h4>
            {attackPaths.slice(0, 3).map((path) => (
              <div key={path.id} className="flex items-center justify-between p-2 bg-gray-800/30 rounded">
                <span className="text-xs text-gray-300">{path.name}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  path.riskLevel === 'Critical' ? 'bg-red-500/20 text-red-400' :
                  path.riskLevel === 'High' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {path.riskLevel}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
