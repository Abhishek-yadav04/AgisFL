import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupWebSocket, startMonitoringServices } from "./websocket";
import { networkMonitor } from "./services/network-monitor";
import { systemMonitor } from "./services/system-monitor";
import { threatDetector } from "./services/threat-detector";
import { flCoordinator } from "./services/fl-coordinator";
import { realSystemMonitor } from "./services/real-system-monitor";
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { z } from 'zod';

// Authentication schemas
const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().optional(),
  password: z.string().min(6),
});

// JWT secret (use env variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      // For demo purposes, accept any login or create demo user
      const demoUser = {
        id: 1,
        username,
        role: 'admin',
        email: `${username}@agisfl.com`,
        permissions: ['read', 'write', 'admin']
      };

      // Generate JWT token
      const token = jwt.sign(demoUser, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        success: true,
        token,
        user: demoUser
      });

    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password } = registerSchema.parse(req.body);
      
      // For demo purposes, always succeed with registration
      const newUser = {
        id: Math.floor(Math.random() * 1000),
        username,
        email: email || `${username}@agisfl.com`,
        role: 'user',
        permissions: ['read']
      };

      const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        success: true,
        token,
        user: newUser
      });

    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ 
        success: false,
        message: "Registration failed" 
      });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({ success: true, message: "Logged out successfully" });
  });

  // Dashboard data endpoint
  app.get("/api/dashboard", async (req, res) => {
    try {
      const dashboardData = await storage.getDashboardData();
      
      // Add real system information
      const systemInfo = realSystemMonitor.getSystemInfo();
      
      res.json({
        ...dashboardData,
        systemInfo,
        realTimeMonitoring: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error getting dashboard data:", error);
      res.status(500).json({ error: "Failed to get dashboard data" });
    }
  });

  // Network metrics endpoints
  app.get("/api/network/metrics", async (req, res) => {
    try {
      const metrics = await storage.getRecentNetworkMetrics(50);
      res.json(metrics);
    } catch (error) {
      console.error("Error getting network metrics:", error);
      res.status(500).json({ error: "Failed to get network metrics" });
    }
  });

  app.get("/api/network/packets", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const packets = await storage.getRecentPackets(limit);
      res.json(packets);
    } catch (error) {
      console.error("Error getting packets:", error);
      res.status(500).json({ error: "Failed to get packets" });
    }
  });

  // System metrics endpoints
  app.get("/api/system/metrics", async (req, res) => {
    try {
      const metrics = await storage.getRecentSystemMetrics(50);
      res.json(metrics);
    } catch (error) {
      console.error("Error getting system metrics:", error);
      res.status(500).json({ error: "Failed to get system metrics" });
    }
  });

  app.get("/api/system/current", async (req, res) => {
    try {
      const current = await storage.getCurrentSystemMetrics();
      res.json(current);
    } catch (error) {
      console.error("Error getting current system metrics:", error);
      res.status(500).json({ error: "Failed to get current system metrics" });
    }
  });

  // Threat detection endpoints
  app.get("/api/threats", async (req, res) => {
    try {
      const threats = await storage.getActiveThreats();
      res.json(threats);
    } catch (error) {
      console.error("Error getting threats:", error);
      res.status(500).json({ error: "Failed to get threats" });
    }
  });

  app.patch("/api/threats/:id/mitigate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const threat = await storage.updateThreatStatus(id, "mitigated");
      if (threat) {
        res.json(threat);
      } else {
        res.status(404).json({ error: "Threat not found" });
      }
    } catch (error) {
      console.error("Error mitigating threat:", error);
      res.status(500).json({ error: "Failed to mitigate threat" });
    }
  });

  // Federated Learning endpoints
  app.get("/api/fl/clients", async (req, res) => {
    try {
      const clients = await storage.getFLClients();
      res.json(clients);
    } catch (error) {
      console.error("Error getting FL clients:", error);
      res.status(500).json({ error: "Failed to get FL clients" });
    }
  });

  app.get("/api/fl/model", async (req, res) => {
    try {
      const model = await storage.getCurrentFLModel();
      res.json(model);
    } catch (error) {
      console.error("Error getting FL model:", error);
      res.status(500).json({ error: "Failed to get FL model" });
    }
  });

  app.post("/api/fl/clients", async (req, res) => {
    try {
      const { clientId, status } = req.body;
      const client = await storage.createOrUpdateFLClient({ clientId, status });
      res.json(client);
    } catch (error) {
      console.error("Error creating/updating FL client:", error);
      res.status(500).json({ error: "Failed to create/update FL client" });
    }
  });

  // Alerts endpoints
  app.get("/api/alerts", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const alerts = await storage.getRecentAlerts(limit);
      res.json(alerts);
    } catch (error) {
      console.error("Error getting alerts:", error);
      res.status(500).json({ error: "Failed to get alerts" });
    }
  });

  app.patch("/api/alerts/:id/acknowledge", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const alert = await storage.acknowledgeAlert(id);
      if (alert) {
        res.json(alert);
      } else {
        res.status(404).json({ error: "Alert not found" });
      }
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      res.status(500).json({ error: "Failed to acknowledge alert" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      services: {
        networkMonitor: networkMonitor ? "running" : "stopped",
        systemMonitor: systemMonitor ? "running" : "stopped",
        threatDetector: threatDetector ? "running" : "stopped",
        flCoordinator: flCoordinator ? "running" : "stopped",
      }
    });
  });

  const httpServer = createServer(app);

  // Setup WebSocket server
  setupWebSocket(httpServer);

  // Start monitoring services
  startMonitoringServices();

  return httpServer;
}
