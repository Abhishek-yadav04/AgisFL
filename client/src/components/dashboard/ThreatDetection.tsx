import { ShieldAlert } from "lucide-react";
import { LiveThreatData } from "@shared/schema";

interface ThreatDetectionProps {
  data?: LiveThreatData;
}

export function ThreatDetection({ data }: ThreatDetectionProps) {
  const activeThreats = data?.activeThreats?.length || 0;
  const blockedAttacks = data?.blockedAttacks || 0;
  const falsePositives = data?.falsePositives || 0;
  const detectionRate = data?.detectionRate || 0;

  return (
    <div className="cyber-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center cyber-text-primary">
          <ShieldAlert className="cyber-danger mr-2 h-4 w-4" />
          Threat Detection
        </h3>
        <span className="text-2xl font-bold cyber-danger">{activeThreats}</span>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm cyber-text-muted">Blocked Attacks</span>
          <span className="text-lg font-bold cyber-success">{blockedAttacks.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm cyber-text-muted">False Positives</span>
          <span className="text-lg font-bold cyber-warning">{falsePositives}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm cyber-text-muted">Detection Rate</span>
          <span className="text-lg font-bold cyber-info">{detectionRate.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
