import { 
  users, 
  incidents, 
  threats, 
  systemMetrics, 
  aiInsights, 
  attackPaths,
  type User, 
  type InsertUser,
  type Incident,
  type InsertIncident,
  type Threat,
  type InsertThreat,
  type SystemMetric,
  type InsertSystemMetric,
  type AiInsight,
  type InsertAiInsight,
  type AttackPath,
  type InsertAttackPath
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { DashboardMetrics, SystemHealthData, ThreatFeedItem } from "../client/src/types/dashboard";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  
  // Dashboard methods
  getDashboardMetrics(): Promise<DashboardMetrics>;
  
  // Incident methods
  getIncidents(): Promise<Incident[]>;
  getIncident(id: number): Promise<Incident | undefined>;
  createIncident(insertIncident: InsertIncident): Promise<Incident>;
  updateIncident(id: number, data: Partial<InsertIncident>): Promise<Incident | undefined>;
  
  // Threat methods
  getThreats(): Promise<Threat[]>;
  getActiveThreats(): Promise<Threat[]>;
  createThreat(insertThreat: InsertThreat): Promise<Threat>;
  getThreatFeed(): Promise<ThreatFeedItem[]>;
  
  // System methods
  getSystemHealth(): Promise<SystemHealthData>;
  getSystemMetrics(): Promise<SystemMetric[]>;
  createSystemMetric(insertMetric: InsertSystemMetric): Promise<SystemMetric>;
  
  // AI methods
  getAiInsights(): Promise<AiInsight[]>;
  createAiInsight(insertInsight: InsertAiInsight): Promise<AiInsight>;
  
  // Attack path methods
  getAttackPaths(): Promise<AttackPath[]>;
  createAttackPath(insertPath: InsertAttackPath): Promise<AttackPath>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    // Get incident counts
    const allIncidents = await db.select().from(incidents);
    const activeIncidents = allIncidents.filter(i => i.status !== 'resolved' && i.status !== 'closed');
    const resolvedToday = allIncidents.filter(i => {
      const today = new Date();
      const resolvedDate = i.resolvedAt ? new Date(i.resolvedAt) : null;
      return resolvedDate && resolvedDate.toDateString() === today.toDateString();
    });

    // Get threat counts  
    const activeThreats = await db.select().from(threats).where(eq(threats.isActive, true));

    // Calculate average response time (mock data for now)
    const avgResponseTime = 18; // minutes

    return {
      activeIncidents: activeIncidents.length,
      threatsDetected: activeThreats.length,
      resolvedToday: resolvedToday.length,
      avgResponseTime,
      totalIncidents: allIncidents.length,
      criticalIncidents: allIncidents.filter(i => i.severity === 'Critical').length,
      highIncidents: allIncidents.filter(i => i.severity === 'High').length,
      responseTimeImprovement: 12 // percentage improvement
    };
  }

  async getIncidents(): Promise<Incident[]> {
    return db.select().from(incidents).orderBy(desc(incidents.createdAt));
  }

  async getIncident(id: number): Promise<Incident | undefined> {
    const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
    return incident || undefined;
  }

  async createIncident(insertIncident: InsertIncident): Promise<Incident> {
    const [incident] = await db
      .insert(incidents)
      .values(insertIncident)
      .returning();
    return incident;
  }

  async updateIncident(id: number, data: Partial<InsertIncident>): Promise<Incident | undefined> {
    const [incident] = await db
      .update(incidents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(incidents.id, id))
      .returning();
    return incident || undefined;
  }

  async getThreats(): Promise<Threat[]> {
    return db.select().from(threats).orderBy(desc(threats.detectedAt));
  }

  async getActiveThreats(): Promise<Threat[]> {
    return db.select().from(threats).where(eq(threats.isActive, true)).orderBy(desc(threats.detectedAt));
  }

  async createThreat(insertThreat: InsertThreat): Promise<Threat> {
    const [threat] = await db
      .insert(threats)
      .values(insertThreat)
      .returning();
    return threat;
  }

  async getThreatFeed(): Promise<ThreatFeedItem[]> {
    const threatData = await db.select().from(threats).where(eq(threats.isActive, true)).orderBy(desc(threats.detectedAt)).limit(10);
    
    return threatData.map(threat => ({
      id: threat.threatId,
      name: threat.name,
      type: threat.type,
      severity: threat.severity,
      sourceIp: threat.sourceIp || undefined,
      targetIp: threat.targetIp || undefined,
      timestamp: threat.detectedAt.toISOString(),
      confidence: parseFloat(threat.confidence?.toString() || '0'),
      description: threat.description || undefined
    }));
  }

  async getSystemHealth(): Promise<SystemHealthData> {
    // Mock system health data
    return {
      aiEngine: 99.8,
      dataPipeline: 98.2,
      networkSensors: 94.1,
      correlationEngine: 99.9,
      cpu: 23,
      memory: 67,
      network: 45,
      storage: 78
    };
  }

  async getSystemMetrics(): Promise<SystemMetric[]> {
    return db.select().from(systemMetrics).orderBy(desc(systemMetrics.timestamp));
  }

  async createSystemMetric(insertMetric: InsertSystemMetric): Promise<SystemMetric> {
    const [metric] = await db
      .insert(systemMetrics)
      .values(insertMetric)
      .returning();
    return metric;
  }

  async getAiInsights(): Promise<AiInsight[]> {
    return db.select().from(aiInsights).where(eq(aiInsights.isActive, true)).orderBy(desc(aiInsights.createdAt));
  }

  async createAiInsight(insertInsight: InsertAiInsight): Promise<AiInsight> {
    const [insight] = await db
      .insert(aiInsights)
      .values(insertInsight)
      .returning();
    return insight;
  }

  async getAttackPaths(): Promise<AttackPath[]> {
    return db.select().from(attackPaths).orderBy(desc(attackPaths.createdAt));
  }

  async createAttackPath(insertPath: InsertAttackPath): Promise<AttackPath> {
    const [path] = await db
      .insert(attackPaths)
      .values(insertPath)
      .returning();
    return path;
  }
}

export const storage = new DatabaseStorage();