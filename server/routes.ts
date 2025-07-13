import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIncidentSchema, insertThreatSchema, insertSystemMetricSchema, insertAiInsightSchema, insertAttackPathSchema } from "@shared/schema";
import { setupWebSocket } from "./websocket";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket for real-time updates
  setupWebSocket(httpServer);

  // Dashboard metrics endpoint
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  // Incidents endpoints
  app.get("/api/incidents", async (req, res) => {
    try {
      const incidents = await storage.getIncidents();
      res.json(incidents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch incidents" });
    }
  });

  app.get("/api/incidents/:id", async (req, res) => {
    try {
      const incident = await storage.getIncident(parseInt(req.params.id));
      if (!incident) {
        return res.status(404).json({ error: "Incident not found" });
      }
      res.json(incident);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch incident" });
    }
  });

  app.post("/api/incidents", async (req, res) => {
    try {
      const data = insertIncidentSchema.parse(req.body);
      const incident = await storage.createIncident(data);
      res.status(201).json(incident);
    } catch (error) {
      res.status(400).json({ error: "Invalid incident data" });
    }
  });

  app.patch("/api/incidents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertIncidentSchema.partial().parse(req.body);
      const incident = await storage.updateIncident(id, data);
      if (!incident) {
        return res.status(404).json({ error: "Incident not found" });
      }
      res.json(incident);
    } catch (error) {
      res.status(400).json({ error: "Invalid incident data" });
    }
  });

  // Threats endpoints
  app.get("/api/threats", async (req, res) => {
    try {
      const threats = await storage.getThreats();
      res.json(threats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch threats" });
    }
  });

  app.get("/api/threats/active", async (req, res) => {
    try {
      const threats = await storage.getActiveThreats();
      res.json(threats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active threats" });
    }
  });

  app.post("/api/threats", async (req, res) => {
    try {
      const data = insertThreatSchema.parse(req.body);
      const threat = await storage.createThreat(data);
      res.status(201).json(threat);
    } catch (error) {
      res.status(400).json({ error: "Invalid threat data" });
    }
  });

  // System metrics endpoints
  app.get("/api/system/health", async (req, res) => {
    try {
      const health = await storage.getSystemHealth();
      res.json(health);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch system health" });
    }
  });

  app.get("/api/system/metrics", async (req, res) => {
    try {
      const metrics = await storage.getSystemMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch system metrics" });
    }
  });

  app.post("/api/system/metrics", async (req, res) => {
    try {
      const data = insertSystemMetricSchema.parse(req.body);
      const metric = await storage.createSystemMetric(data);
      res.status(201).json(metric);
    } catch (error) {
      res.status(400).json({ error: "Invalid metric data" });
    }
  });

  // AI Insights endpoints
  app.get("/api/ai/insights", async (req, res) => {
    try {
      const insights = await storage.getAiInsights();
      res.json(insights);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch AI insights" });
    }
  });

  app.post("/api/ai/insights", async (req, res) => {
    try {
      const data = insertAiInsightSchema.parse(req.body);
      const insight = await storage.createAiInsight(data);
      res.status(201).json(insight);
    } catch (error) {
      res.status(400).json({ error: "Invalid insight data" });
    }
  });

  // Attack path endpoints
  app.get("/api/attack-paths", async (req, res) => {
    try {
      const paths = await storage.getAttackPaths();
      res.json(paths);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attack paths" });
    }
  });

  app.post("/api/attack-paths", async (req, res) => {
    try {
      const data = insertAttackPathSchema.parse(req.body);
      const path = await storage.createAttackPath(data);
      res.status(201).json(path);
    } catch (error) {
      res.status(400).json({ error: "Invalid attack path data" });
    }
  });

  // Real-time threat feed endpoint
  app.get("/api/threats/feed", async (req, res) => {
    try {
      const feed = await storage.getThreatFeed();
      res.json(feed);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch threat feed" });
    }
  });

  // User endpoints
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // FL-IDS specific endpoints
  app.get("/api/fl-ids/status", async (req, res) => {
    try {
      const status = await storage.getFLIDSStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch FL-IDS status" });
    }
  });

  app.get("/api/fl-ids/performance", async (req, res) => {
    try {
      const performance = await storage.getFLPerformanceMetrics();
      res.json(performance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch FL performance metrics" });
    }
  });

  app.get("/api/fl-ids/nodes", async (req, res) => {
    try {
      const status = await storage.getFLIDSStatus();
      res.json({
        nodes: status.node_details || [],
        total_nodes: status.active_nodes || 0,
        federated_rounds: status.fl_rounds_completed || 0,
        global_model_info: {
          last_updated: new Date().toISOString(),
          convergence_status: "converged"
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch FL nodes" });
    }
  });

  return httpServer;
}
