export interface DashboardMetrics {
  activeIncidents: number;
  threatsDetected: number;
  resolvedToday: number;
  avgResponseTime: number;
  totalIncidents: number;
  criticalIncidents: number;
  highIncidents: number;
  responseTimeImprovement: number;
}

export interface SystemHealthData {
  aiEngine: number;
  dataPipeline: number;
  networkSensors: number;
  correlationEngine: number;
  cpu: number;
  memory: number;
  network: number;
  storage: number;
}

export interface ThreatFeedItem {
  id: string;
  name: string;
  type: string;
  severity: string;
  sourceIp?: string;
  targetIp?: string;
  timestamp: string;
  confidence: number;
  description?: string;
}

export interface RealTimeMetric {
  component: string;
  metric: string;
  value: number;
  unit: string;
  timestamp: string;
  status: 'normal' | 'warning' | 'critical';
}

export interface NetworkNode {
  id: string;
  name: string;
  type: 'endpoint' | 'server' | 'router' | 'firewall';
  compromised: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  connections: string[];
}

export interface AttackVector {
  id: string;
  source: string;
  target: string;
  method: string;
  severity: string;
  blocked: boolean;
  timestamp: string;
}

export interface CorrelationResult {
  id: string;
  events: string[];
  confidence: number;
  description: string;
  recommendations: string[];
  riskScore: number;
}

export interface PredictiveAnalysis {
  id: string;
  type: 'incident_volume' | 'response_time' | 'threat_trend';
  prediction: number;
  confidence: number;
  timeframe: string;
  factors: string[];
}
