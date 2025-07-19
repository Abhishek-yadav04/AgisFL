import { 
  users, networkMetrics, systemMetrics, threats, packets, flClients, flModels, alerts,
  type User, type InsertUser, type NetworkMetrics, type InsertNetworkMetrics,
  type SystemMetrics, type InsertSystemMetrics, type Threat, type InsertThreat,
  type Packet, type InsertPacket, type FLClient, type InsertFLClient,
  type FLModel, type InsertFLModel, type Alert, type InsertAlert,
  type DashboardData, type LiveNetworkData, type LiveSystemData, 
  type LiveThreatData, type LiveFLData
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Network metrics
  createNetworkMetrics(metrics: InsertNetworkMetrics): Promise<NetworkMetrics>;
  getRecentNetworkMetrics(limit?: number): Promise<NetworkMetrics[]>;

  // System metrics
  createSystemMetrics(metrics: InsertSystemMetrics): Promise<SystemMetrics>;
  getRecentSystemMetrics(limit?: number): Promise<SystemMetrics[]>;
  getCurrentSystemMetrics(): Promise<SystemMetrics | undefined>;

  // Threats
  createThreat(threat: InsertThreat): Promise<Threat>;
  getActiveThreats(): Promise<Threat[]>;
  updateThreatStatus(id: number, status: string): Promise<Threat | undefined>;

  // Packets
  createPacket(packet: InsertPacket): Promise<Packet>;
  getRecentPackets(limit?: number): Promise<Packet[]>;

  // Federated Learning
  createOrUpdateFLClient(client: InsertFLClient): Promise<FLClient>;
  getFLClients(): Promise<FLClient[]>;
  updateFLClientStatus(clientId: string, status: string): Promise<FLClient | undefined>;

  createFLModel(model: InsertFLModel): Promise<FLModel>;
  getCurrentFLModel(): Promise<FLModel | null>;

  // Alerts
  createAlert(alert: InsertAlert): Promise<Alert>;
  getRecentAlerts(limit?: number): Promise<Alert[]>;
  acknowledgeAlert(id: number): Promise<Alert | undefined>;

  // Dashboard data
  getDashboardData(): Promise<DashboardData>;
}

import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

const sqlite = new Database('agisfl.db');
export const db = drizzle(sqlite);

// Initialize tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS threats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    source_ip TEXT,
    target_ip TEXT,
    description TEXT,
    status TEXT DEFAULT 'active',
    confidence REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    acknowledged INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS network_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    bytes_sent INTEGER DEFAULT 0,
    bytes_received INTEGER DEFAULT 0,
    packets_sent INTEGER DEFAULT 0,
    packets_received INTEGER DEFAULT 0,
    connections_active INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS fl_clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'offline',
    last_update DATETIME DEFAULT CURRENT_TIMESTAMP,
    model_version INTEGER DEFAULT 1,
    data_samples INTEGER DEFAULT 0
  );
`);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private networkMetrics: NetworkMetrics[];
  private systemMetrics: SystemMetrics[];
  private threats: Map<number, Threat>;
  private packets: Packet[];
  private flClients: Map<string, FLClient>;
  private flModels: FLModel[];
  private alerts: Map<number, Alert>;

  private currentId: number;
  private threatId: number;
  private alertId: number;
  private packetId: number;
  private flModelId: number;
  private metricsId: number;

  constructor() {
    this.users = new Map();
    this.networkMetrics = [];
    this.systemMetrics = [];
    this.threats = new Map();
    this.packets = [];
    this.flClients = new Map();
    this.flModels = [];
    this.alerts = new Map();

    this.currentId = 1;
    this.threatId = 1;
    this.alertId = 1;
    this.packetId = 1;
    this.flModelId = 1;
    this.metricsId = 1;

    this.initializeTestData();
  }

  private initializeTestData() {
    // Initialize with some FL clients
    this.flClients.set("client-001", {
      id: 1,
      clientId: "client-001",
      status: "active",
      lastSeen: new Date(),
      modelAccuracy: 0.973,
      trainingRounds: 24,
      dataContribution: 1500
    });

    this.flClients.set("client-002", {
      id: 2,
      clientId: "client-002",
      status: "training",
      lastSeen: new Date(),
      modelAccuracy: 0.968,
      trainingRounds: 23,
      dataContribution: 1200
    });

    this.flClients.set("client-003", {
      id: 3,
      clientId: "client-003",
      status: "reconnecting",
      lastSeen: new Date(Date.now() - 30000),
      modelAccuracy: 0.965,
      trainingRounds: 22,
      dataContribution: 900
    });

    // Initialize current FL model
    this.flModels.push({
      id: 1,
      version: 1,
      accuracy: 0.973,
      timestamp: new Date(),
      participantCount: 12,
      trainingRound: 156,
      modelData: { weights: "base64_encoded_weights" }
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createNetworkMetrics(metrics: InsertNetworkMetrics): Promise<NetworkMetrics> {
    const networkMetric: NetworkMetrics = {
      id: this.metricsId++,
      timestamp: new Date(),
      ...metrics
    };
    this.networkMetrics.push(networkMetric);
    // Keep only last 1000 entries
    if (this.networkMetrics.length > 1000) {
      this.networkMetrics = this.networkMetrics.slice(-1000);
    }
    return networkMetric;
  }

  async getRecentNetworkMetrics(limit: number = 50): Promise<NetworkMetrics[]> {
    return this.networkMetrics.slice(-limit);
  }

  async createSystemMetrics(metrics: InsertSystemMetrics): Promise<SystemMetrics> {
    const systemMetric: SystemMetrics = {
      id: this.metricsId++,
      timestamp: new Date(),
      ...metrics
    };
    this.systemMetrics.push(systemMetric);
    // Keep only last 1000 entries
    if (this.systemMetrics.length > 1000) {
      this.systemMetrics = this.systemMetrics.slice(-1000);
    }
    return systemMetric;
  }

  async getRecentSystemMetrics(limit: number = 50): Promise<SystemMetrics[]> {
    return this.systemMetrics.slice(-limit);
  }

  async getCurrentSystemMetrics(): Promise<SystemMetrics | undefined> {
    return this.systemMetrics[this.systemMetrics.length - 1];
  }

  async createThreat(threat: InsertThreat): Promise<Threat> {
    const id = this.threatId++;
    const newThreat: Threat = {
      id,
      timestamp: new Date(),
      status: "active",
      mitigated: false,
      description: threat.description || null,
      destination: threat.destination || null,
      protocol: threat.protocol || null,
      ...threat
    };
    this.threats.set(id, newThreat);
    return newThreat;
  }

  async getActiveThreats(): Promise<Threat[]> {
    return Array.from(this.threats.values()).filter(t => t.status === "active");
  }

  async updateThreatStatus(id: number, status: string): Promise<Threat | undefined> {
    const threat = this.threats.get(id);
    if (threat) {
      threat.status = status;
      threat.mitigated = status === "mitigated";
      this.threats.set(id, threat);
      return threat;
    }
    return undefined;
  }

  async createPacket(packet: InsertPacket): Promise<Packet> {
    const newPacket: Packet = {
      id: this.packetId++,
      timestamp: new Date(),
      suspicious: false,
      flags: packet.flags || null,
      ...packet
    };
    this.packets.push(newPacket);
    // Keep only last 1000 packets
    if (this.packets.length > 1000) {
      this.packets = this.packets.slice(-1000);
    }
    return newPacket;
  }

  async getRecentPackets(limit: number = 10): Promise<Packet[]> {
    return this.packets.slice(-limit);
  }

  async createOrUpdateFLClient(client: InsertFLClient): Promise<FLClient> {
    const existing = this.flClients.get(client.clientId);
    if (existing) {
      const updated = { ...existing, ...client, lastSeen: new Date() };
      this.flClients.set(client.clientId, updated);
      return updated;
    } else {
      const newClient: FLClient = {
        id: this.currentId++,
        lastSeen: new Date(),
        modelAccuracy: null,
        trainingRounds: 0,
        dataContribution: 0,
        ...client
      };
      this.flClients.set(client.clientId, newClient);
      return newClient;
    }
  }

  async getFLClients(): Promise<FLClient[]> {
    return Array.from(this.flClients.values());
  }

  async updateFLClientStatus(clientId: string, status: string): Promise<FLClient | undefined> {
    const client = this.flClients.get(clientId);
    if (client) {
      client.status = status;
      client.lastSeen = new Date();
      this.flClients.set(clientId, client);
      return client;
    }
    return undefined;
  }

  async createFLModel(model: InsertFLModel): Promise<FLModel> {
    const newModel: FLModel = {
      id: this.flModelId++,
      timestamp: new Date(),
      modelData: model.modelData || {},
      ...model
    };
    this.flModels.push(newModel);
    return newModel;
  }

  async getCurrentFLModel(): Promise<FLModel | null> {
    const model = this.flModels[this.flModels.length - 1];
    return model || null;
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const id = this.alertId++;
    const newAlert: Alert = {
      id,
      timestamp: new Date(),
      acknowledged: false,
      source: alert.source || null,
      ...alert
    };
    this.alerts.set(id, newAlert);
    return newAlert;
  }

  async getRecentAlerts(limit: number = 10): Promise<Alert[]> {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async acknowledgeAlert(id: number): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (alert) {
      alert.acknowledged = true;
      this.alerts.set(id, alert);
      return alert;
    }
    return undefined;
  }

  async getDashboardData(): Promise<DashboardData> {
    const currentSystem = await this.getCurrentSystemMetrics();
    const recentNetwork = await this.getRecentNetworkMetrics(1);
    const activeThreats = await this.getActiveThreats();
    const flClients = await this.getFLClients();
    const currentModel = await this.getCurrentFLModel();
    const recentPackets = await this.getRecentPackets(5);
    const recentAlerts = await this.getRecentAlerts(5);

    const network: LiveNetworkData = {
      throughput: recentNetwork[0]?.throughput || 2.4,
      packetsPerSecond: recentNetwork[0]?.packetsPerSecond || 14523,
      activeConnections: recentNetwork[0]?.activeConnections || 1247,
      recentPackets
    };

    const system: LiveSystemData = {
      cpuUsage: currentSystem?.cpuUsage || Math.random() * 100,
      memoryUsage: currentSystem?.memoryUsage || Math.random() * 100,
      networkIO: currentSystem?.networkIO || Math.random() * 100,
      diskUsage: currentSystem?.diskUsage || Math.random() * 100,
      loadAverage: currentSystem?.loadAverage || Math.random() * 2,
      uptime: 99.98
    };

    const threats: LiveThreatData = {
      activeThreats,
      blockedAttacks: 1234,
      falsePositives: 23,
      detectionRate: 99.1
    };

    const fl: LiveFLData = {
      activeClients: flClients,
      currentModel,
      trainingRound: currentModel?.trainingRound || 156,
      overallAccuracy: currentModel?.accuracy || 0.973,
      participantCount: flClients.filter(c => c.status === "active").length
    };

    return {
      network,
      system,
      threats,
      fl,
      recentAlerts
    };
  }
}

export const storage = new MemStorage();