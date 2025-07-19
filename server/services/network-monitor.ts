import { storage } from "../storage";
import { InsertNetworkMetrics, InsertPacket } from "@shared/schema";

export class NetworkMonitor {
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Network monitor started');
    
    // Simulate network monitoring every 2 seconds
    this.interval = setInterval(async () => {
      await this.collectNetworkMetrics();
      await this.capturePackets();
    }, 2000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('Network monitor stopped');
  }

  private async collectNetworkMetrics() {
    try {
      // Simulate real network metrics collection
      const metrics: InsertNetworkMetrics = {
        throughput: Math.random() * 5 + 1, // 1-6 Gbps
        packetsPerSecond: Math.floor(Math.random() * 10000 + 10000), // 10k-20k packets/sec
        activeConnections: Math.floor(Math.random() * 500 + 1000), // 1000-1500 connections
        bytesIn: Math.floor(Math.random() * 1000000 + 500000), // 500KB-1.5MB
        bytesOut: Math.floor(Math.random() * 800000 + 400000), // 400KB-1.2MB
      };

      await storage.createNetworkMetrics(metrics);
    } catch (error) {
      console.error('Error collecting network metrics:', error);
    }
  }

  private async capturePackets() {
    try {
      // Simulate packet capture
      const protocols = ['TCP', 'UDP', 'HTTP', 'HTTPS', 'ICMP', 'DNS'];
      const sources = ['192.168.1.45', '10.0.0.23', '172.16.0.12', '203.0.113.1', '198.51.100.2'];
      const destinations = ['10.0.0.15', '8.8.8.8', '192.168.1.1', '172.16.0.1', '203.0.113.100'];

      for (let i = 0; i < Math.floor(Math.random() * 3 + 1); i++) {
        const protocol = protocols[Math.floor(Math.random() * protocols.length)];
        const source = sources[Math.floor(Math.random() * sources.length)];
        const destination = destinations[Math.floor(Math.random() * destinations.length)];
        
        // Add port numbers for TCP/UDP
        const sourceWithPort = ['TCP', 'UDP'].includes(protocol) 
          ? `${source}:${Math.floor(Math.random() * 65535)}` 
          : source;
        const destWithPort = ['TCP', 'UDP'].includes(protocol) 
          ? `${destination}:${Math.floor(Math.random() * 65535)}` 
          : destination;

        const packet: InsertPacket = {
          protocol,
          source: sourceWithPort,
          destination: destWithPort,
          size: Math.floor(Math.random() * 1500 + 64), // 64-1564 bytes
          flags: protocol === 'TCP' ? 'SYN,ACK' : undefined,
          suspicious: Math.random() < 0.05, // 5% chance of suspicious packet
        };

        await storage.createPacket(packet);
      }
    } catch (error) {
      console.error('Error capturing packets:', error);
    }
  }

  // Method to get real-time network data
  async getRealtimeData() {
    const recentMetrics = await storage.getRecentNetworkMetrics(1);
    const recentPackets = await storage.getRecentPackets(10);
    
    return {
      currentMetrics: recentMetrics[0],
      recentPackets
    };
  }
}

export const networkMonitor = new NetworkMonitor();
