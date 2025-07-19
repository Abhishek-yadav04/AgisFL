import { Network } from "lucide-react";

export function NetworkTopology() {
  return (
    <div className="cyber-card">
      <h3 className="font-semibold mb-4 flex items-center cyber-text-primary">
        <Network className="cyber-info mr-2 h-4 w-4" />
        Network Topology
      </h3>
      <div className="chart-container p-4 rounded-lg h-64 relative">
        <div className="relative w-full h-full">
          {/* Central Server */}
          <div className="network-node bg-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4">
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-mono cyber-text-primary">Server</div>
          </div>
          
          {/* Client Nodes */}
          <div className="network-node absolute top-4 left-4">
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-mono cyber-text-primary">C1</div>
          </div>
          <div className="network-node absolute top-4 right-4">
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-mono cyber-text-primary">C2</div>
          </div>
          <div className="network-node absolute bottom-4 left-4">
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-xs font-mono cyber-text-primary">C3</div>
          </div>
          <div className="network-node bg-red-500 absolute bottom-4 right-4 pulse-animation">
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-xs font-mono cyber-danger">Threat</div>
          </div>
          
          {/* Connections */}
          <div className="network-connection top-1/2 left-6 w-32 transform -translate-y-1/2 rotate-45"></div>
          <div className="network-connection top-1/2 right-6 w-32 transform -translate-y-1/2 -rotate-45"></div>
          <div className="network-connection bottom-1/2 left-6 w-32 transform translate-y-1/2 -rotate-45"></div>
          <div className="network-connection bottom-1/2 right-6 w-32 transform translate-y-1/2 rotate-45 opacity-30"></div>
        </div>
      </div>
      <div className="flex justify-between text-sm mt-3">
        <span className="cyber-text-muted">
          Active Nodes: <span className="font-mono cyber-success">12</span>
        </span>
        <span className="cyber-text-muted">
          Compromised: <span className="font-mono cyber-danger">1</span>
        </span>
      </div>
    </div>
  );
}
