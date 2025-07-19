import { storage } from "../storage";
import { InsertSystemMetrics } from "@shared/schema";

export class SystemMonitor {
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('System monitor started');
    
    // Collect system metrics every 5 seconds
    this.interval = setInterval(async () => {
      await this.collectSystemMetrics();
    }, 5000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('System monitor stopped');
  }

  private async collectSystemMetrics() {
    try {
      // In a real implementation, you would use libraries like 'node-os-utils' 
      // or system APIs to get actual metrics
      const metrics: InsertSystemMetrics = {
        cpuUsage: this.simulateCPUUsage(),
        memoryUsage: this.simulateMemoryUsage(),
        networkIO: this.simulateNetworkIO(),
        diskUsage: this.simulateDiskUsage(),
        loadAverage: this.simulateLoadAverage(),
      };

      await storage.createSystemMetrics(metrics);
    } catch (error) {
      console.error('Error collecting system metrics:', error);
    }
  }

  private simulateCPUUsage(): number {
    // Simulate realistic CPU usage patterns
    const baseUsage = 30 + Math.random() * 40; // 30-70% base
    const spike = Math.random() < 0.1 ? Math.random() * 30 : 0; // Occasional spikes
    return Math.min(100, baseUsage + spike);
  }

  private simulateMemoryUsage(): number {
    // Simulate memory usage with gradual changes
    const baseUsage = 45 + Math.random() * 30; // 45-75% base
    return Math.min(100, baseUsage);
  }

  private simulateNetworkIO(): number {
    // Simulate network I/O with bursts during threat detection
    const baseIO = 20 + Math.random() * 40; // 20-60% base
    const burst = Math.random() < 0.15 ? Math.random() * 40 : 0; // Network bursts
    return Math.min(100, baseIO + burst);
  }

  private simulateDiskUsage(): number {
    // Simulate relatively stable disk usage
    return 65 + Math.random() * 10; // 65-75%
  }

  private simulateLoadAverage(): number {
    // Simulate load average (typically 0-2 for good performance)
    return Math.random() * 1.5 + 0.2; // 0.2-1.7
  }

  async getCurrentMetrics() {
    return await storage.getCurrentSystemMetrics();
  }
}

export const systemMonitor = new SystemMonitor();
