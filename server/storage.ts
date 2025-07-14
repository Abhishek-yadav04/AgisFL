import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { incidents, threats, systemMetrics, aiInsights, attackPaths, users } from "@shared/schema";
import { eq, desc, and, gte, sql, count } from "drizzle-orm";
import { logger } from "./logger";

const connectionConfig = {
  host: 'localhost',
  port: 5432,
  database: 'mydatabase',
  user: 'db_user',
  password: 'admin',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(connectionConfig);
const db = drizzle(pool, { 
  schema: { incidents, threats, systemMetrics, aiInsights, attackPaths, users }
});

export const storage = {
  // Dashboard metrics
  async getDashboardMetrics() {
    try {
      const [totalIncidents] = await db.select({ count: count() }).from(incidents);
      const [activeThreats] = await db.select({ count: count() }).from(threats).where(eq(threats.isActive, true));
      const [resolvedIncidents] = await db.select({ count: count() }).from(incidents).where(eq(incidents.status, 'resolved'));

      return {
        totalIncidents: totalIncidents.count || 0,
        activeThreats: activeThreats.count || 0,
        resolvedIncidents: resolvedIncidents.count || 0,
        systemHealth: 94.7 + Math.random() * 5,
        threatLevel: "Medium",
        lastUpdate: new Date().toISOString(),
        flStatus: {
          active: true,
          nodes: 3,
          accuracy: 94.7 + Math.random() * 3,
          lastTraining: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  },

  // Incidents
  async getIncidents() {
    try {
      return await db.select().from(incidents).orderBy(desc(incidents.createdAt));
    } catch (error) {
      logger.error('Error fetching incidents:', error);
      return [];
    }
  },

  async getIncident(id: number) {
    try {
      const result = await db.select().from(incidents).where(eq(incidents.id, id));
      return result[0] || null;
    } catch (error) {
      logger.error('Error fetching incident:', error);
      return null;
    }
  },

  async createIncident(data: any) {
    try {
      const incidentData = {
        incidentId: `INC-${Date.now()}`,
        title: data.title,
        description: data.description,
        severity: data.severity,
        type: data.type,
        status: data.status || 'open',
        assigneeId: data.assigneeId,
        metadata: data.metadata,
        riskScore: data.riskScore
      };

      const result = await db.insert(incidents).values(incidentData).returning();
      return result[0];
    } catch (error) {
      logger.error('Error creating incident:', error);
      throw error;
    }
  },

  async updateIncident(id: number, data: any) {
    try {
      const result = await db.update(incidents)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(incidents.id, id))
        .returning();
      return result[0] || null;
    } catch (error) {
      logger.error('Error updating incident:', error);
      return null;
    }
  },

  // Threats
  async getThreats() {
    try {
      return await db.select().from(threats).orderBy(desc(threats.detectedAt));
    } catch (error) {
      logger.error('Error fetching threats:', error);
      return [];
    }
  },

  async getActiveThreats() {
    try {
      return await db.select().from(threats)
        .where(eq(threats.isActive, true))
        .orderBy(desc(threats.detectedAt));
    } catch (error) {
      logger.error('Error fetching active threats:', error);
      return [];
    }
  },

  async getThreatFeed() {
    try {
      const recentThreats = await db.select().from(threats)
        .where(gte(threats.detectedAt, new Date(Date.now() - 24 * 60 * 60 * 1000)))
        .orderBy(desc(threats.detectedAt))
        .limit(50);

      return {
        threats: recentThreats,
        lastUpdate: new Date().toISOString(),
        totalToday: recentThreats.length
      };
    } catch (error) {
      logger.error('Error fetching threat feed:', error);
      return { threats: [], lastUpdate: new Date().toISOString(), totalToday: 0 };
    }
  },

  async createThreat(data: any) {
    try {
      const threatData = {
        threatId: `THR-${Date.now()}`,
        name: data.name,
        type: data.type,
        severity: data.severity,
        description: data.description,
        sourceIp: data.sourceIp,
        targetIp: data.targetIp,
        isActive: data.isActive !== undefined ? data.isActive : true,
        confidence: data.confidence,
        metadata: data.metadata
      };

      const result = await db.insert(threats).values(threatData).returning();
      return result[0];
    } catch (error) {
      logger.error('Error creating threat:', error);
      throw error;
    }
  },

  // System metrics
  async getSystemHealth() {
    try {
      const recentMetrics = await db.select().from(systemMetrics)
        .where(gte(systemMetrics.timestamp, new Date(Date.now() - 60 * 60 * 1000)))
        .orderBy(desc(systemMetrics.timestamp));

      const cpuMetrics = recentMetrics.filter(m => m.metricType === 'cpu');
      const memoryMetrics = recentMetrics.filter(m => m.metricType === 'memory');
      const networkMetrics = recentMetrics.filter(m => m.metricType === 'network');

      return {
        cpu: {
          current: cpuMetrics.length > 0 ? Number(cpuMetrics[0].value) : 45 + Math.random() * 30,
          average: cpuMetrics.length > 0 ? cpuMetrics.reduce((a, b) => a + Number(b.value), 0) / cpuMetrics.length : 55,
          status: 'normal'
        },
        memory: {
          current: memoryMetrics.length > 0 ? Number(memoryMetrics[0].value) : 60 + Math.random() * 25,
          average: memoryMetrics.length > 0 ? memoryMetrics.reduce((a, b) => a + Number(b.value), 0) / memoryMetrics.length : 65,
          status: 'normal'
        },
        network: {
          current: networkMetrics.length > 0 ? Number(networkMetrics[0].value) : 30 + Math.random() * 40,
          average: networkMetrics.length > 0 ? networkMetrics.reduce((a, b) => a + Number(b.value), 0) / networkMetrics.length : 45,
          status: 'normal'
        },
        overall: 'healthy',
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error fetching system health:', error);
      return {
        cpu: { current: 50, average: 55, status: 'normal' },
        memory: { current: 65, average: 68, status: 'normal' },
        network: { current: 45, average: 50, status: 'normal' },
        overall: 'healthy',
        lastUpdate: new Date().toISOString()
      };
    }
  },

  async getSystemMetrics() {
    try {
      const metrics = await db.select().from(systemMetrics)
        .orderBy(desc(systemMetrics.timestamp))
        .limit(100);

      return {
        metrics,
        summary: {
          total: metrics.length,
          lastUpdate: metrics.length > 0 ? metrics[0].timestamp : new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error fetching system metrics:', error);
      return { metrics: [], summary: { total: 0, lastUpdate: new Date().toISOString() } };
    }
  },

  async createSystemMetric(data: any) {
    try {
      const result = await db.insert(systemMetrics).values(data).returning();
      return result[0];
    } catch (error) {
      logger.error('Error creating system metric:', error);
      throw error;
    }
  },

  // AI Insights
  async getAiInsights() {
    try {
      return await db.select().from(aiInsights)
        .where(eq(aiInsights.isActive, true))
        .orderBy(desc(aiInsights.createdAt));
    } catch (error) {
      logger.error('Error fetching AI insights:', error);
      return [];
    }
  },

  async createAiInsight(data: any) {
    try {
      const result = await db.insert(aiInsights).values(data).returning();
      return result[0];
    } catch (error) {
      logger.error('Error creating AI insight:', error);
      throw error;
    }
  },

  // Attack paths
  async getAttackPaths() {
    try {
      return await db.select().from(attackPaths).orderBy(desc(attackPaths.createdAt));
    } catch (error) {
      logger.error('Error fetching attack paths:', error);
      return [];
    }
  },

  async createAttackPath(data: any) {
    try {
      const result = await db.insert(attackPaths).values(data).returning();
      return result[0];
    } catch (error) {
      logger.error('Error creating attack path:', error);
      throw error;
    }
  },

  // Users
  async getUsers() {
    try {
      return await db.select().from(users).orderBy(desc(users.createdAt));
    } catch (error) {
      logger.error('Error fetching users:', error);
      return [];
    }
  },

  // FL-IDS specific methods
  async getFLIDSStatus() {
    try {
      const activeNodes = 3 + Math.floor(Math.random() * 2);
      const accuracy = 92 + Math.random() * 6;
      const rounds = 15 + Math.floor(Math.random() * 10);

      return {
        status: 'active',
        active_nodes: activeNodes,
        total_nodes: activeNodes + Math.floor(Math.random() * 2),
        global_accuracy: accuracy,
        fl_rounds_completed: rounds,
        last_round_timestamp: new Date().toISOString(),
        node_details: [
          { id: 1, name: 'Finance-Node', status: 'active', accuracy: accuracy + Math.random() * 2 - 1, last_seen: new Date() },
          { id: 2, name: 'HR-Node', status: 'active', accuracy: accuracy + Math.random() * 2 - 1, last_seen: new Date() },
          { id: 3, name: 'IT-Node', status: 'training', accuracy: accuracy + Math.random() * 2 - 1, last_seen: new Date() }
        ]
      };
    } catch (error) {
      logger.error('Error fetching FL-IDS status:', error);
      throw error;
    }
  },

  async getFLPerformanceMetrics() {
    try {
      return {
        accuracy: 94.7 + Math.random() * 3,
        precision: 92.3 + Math.random() * 4,
        recall: 96.1 + Math.random() * 2,
        f1Score: 94.2 + Math.random() * 3,
        trainingTime: 45.2 + Math.random() * 10,
        convergenceRate: 0.95 + Math.random() * 0.04,
        communicationRounds: 15 + Math.floor(Math.random() * 5),
        dataUtilization: 87.5 + Math.random() * 10,
        modelSize: '2.3MB',
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error fetching FL performance metrics:', error);
      throw error;
    }
  }
};