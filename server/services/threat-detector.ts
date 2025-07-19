import { storage } from "../storage";
import { InsertThreat, InsertAlert } from "@shared/schema";

export class ThreatDetector {
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;
  private detectionPatterns: { [key: string]: RegExp } = {
    'DDoS': /excessive_requests|flood_pattern/i,
    'Port Scan': /port_scan|nmap_signature/i,
    'SQL Injection': /union.*select|drop.*table/i,
    'Brute Force': /failed_login_attempts|password_spray/i,
    'Malware': /suspicious_executable|trojan_signature/i,
  };

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Threat detector started');
    
    // Run threat detection every 10 seconds
    this.interval = setInterval(async () => {
      await this.runThreatDetection();
    }, 10000);

    // Initialize with some existing threats
    this.initializeThreats();
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('Threat detector stopped');
  }

  private async initializeThreats() {
    // Add some initial threats for demonstration
    const initialThreats: InsertThreat[] = [
      {
        name: 'DDoS Attack',
        severity: 'critical',
        source: '192.168.1.45',
        destination: '10.0.0.15',
        protocol: 'TCP',
        description: 'High volume of requests detected from suspicious IP',
      },
      {
        name: 'Port Scan',
        severity: 'medium',
        source: '10.0.0.23',
        protocol: 'TCP',
        description: 'Sequential port scanning activity detected',
      },
      {
        name: 'Suspicious Login',
        severity: 'low',
        source: '172.16.0.12',
        protocol: 'HTTPS',
        description: 'Multiple failed login attempts from unknown location',
      }
    ];

    for (const threat of initialThreats) {
      await storage.createThreat(threat);
    }
  }

  private async runThreatDetection() {
    try {
      // Get recent packets for analysis
      const recentPackets = await storage.getRecentPackets(50);
      
      // Analyze packets for threats
      for (const packet of recentPackets) {
        if (packet.suspicious) {
          await this.processDetectedThreat(packet);
        }
      }

      // Simulate additional threat detection
      if (Math.random() < 0.1) { // 10% chance of new threat
        await this.generateSimulatedThreat();
      }

    } catch (error) {
      console.error('Error in threat detection:', error);
    }
  }

  private async processDetectedThreat(packet: any) {
    const threatTypes = ['DDoS Attack', 'Port Scan', 'Malware Traffic', 'Suspicious Activity'];
    const severities = ['low', 'medium', 'high', 'critical'];
    
    const threat: InsertThreat = {
      name: threatTypes[Math.floor(Math.random() * threatTypes.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      source: packet.source,
      destination: packet.destination,
      protocol: packet.protocol,
      description: `Suspicious ${packet.protocol} traffic detected`,
    };

    const createdThreat = await storage.createThreat(threat);
    
    // Create alert for high and critical threats
    if (['high', 'critical'].includes(threat.severity)) {
      await this.createThreatAlert(createdThreat);
    }
  }

  private async generateSimulatedThreat() {
    const threatScenarios = [
      {
        name: 'Brute Force Attack',
        severity: 'high',
        source: '203.0.113.' + Math.floor(Math.random() * 255),
        protocol: 'SSH',
        description: 'Multiple failed authentication attempts detected',
      },
      {
        name: 'Suspicious DNS Query',
        severity: 'medium',
        source: '192.168.1.' + Math.floor(Math.random() * 255),
        protocol: 'DNS',
        description: 'Query to known malicious domain detected',
      },
      {
        name: 'Unusual Data Transfer',
        severity: 'low',
        source: '10.0.0.' + Math.floor(Math.random() * 255),
        protocol: 'FTP',
        description: 'Large data transfer outside normal hours',
      }
    ];

    const scenario = threatScenarios[Math.floor(Math.random() * threatScenarios.length)];
    const threat = await storage.createThreat(scenario);

    if (['high', 'critical'].includes(scenario.severity)) {
      await this.createThreatAlert(threat);
    }
  }

  private async createThreatAlert(threat: any) {
    const alert: InsertAlert = {
      type: threat.severity === 'critical' ? 'critical' : 'warning',
      title: `${threat.severity.toUpperCase()} Threat Detected`,
      message: `${threat.name} detected from ${threat.source}. ${threat.description}`,
      source: 'threat-detector',
    };

    await storage.createAlert(alert);
  }

  async getActiveThreats() {
    return await storage.getActiveThreats();
  }

  async mitigateThreat(threatId: number) {
    return await storage.updateThreatStatus(threatId, 'mitigated');
  }
}

export const threatDetector = new ThreatDetector();
