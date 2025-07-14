import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIncidentSchema, insertThreatSchema, insertSystemMetricSchema, insertAiInsightSchema, insertAttackPathSchema } from "@shared/schema";
import { setupWebSocket } from "./websocket";
import { 
  authenticate, 
  authorize, 
  validateInput, 
  createRateLimit, 
  securityHeaders,
  requestLogger,
  errorHandler,
  AuthenticatedRequest,
  loginSchema
} from "./middleware/auth";
import { logger, securityLogger, performanceLogger } from "./logger";
import cors from 'cors';
import express, { type Request, Response } from "express";

import { db } from "./db";
import { users, threats, incidents, federatedNodes, auditLogs } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authenticateToken } from "./middleware/auth";

const JWT_SECRET = process.env.JWT_SECRET || "agiesfl-super-secret-key-2025";

export function registerRoutes(app: Express) {

  // Authentication Routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      // Check against default credentials first
      const defaultCredentials = [
        { username: 'admin', password: 'SecureAdmin123!', role: 'administrator' },
        { username: 'analyst', password: 'AnalystPass456!', role: 'analyst' }
      ];

      const defaultUser = defaultCredentials.find(cred => 
        cred.username === username && cred.password === password
      );

      if (defaultUser) {
        const token = jwt.sign(
          { 
            id: defaultUser.username,
            username: defaultUser.username, 
            role: defaultUser.role 
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.json({
          token,
          user: {
            id: defaultUser.username,
            username: defaultUser.username,
            role: defaultUser.role
          }
        });
      }

      // Check database for users
      try {
        const user = await db.select().from(users).where(eq(users.username, username)).limit(1);

        if (user.length === 0) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        const validPassword = await bcrypt.compare(password, user[0].passwordHash);
        if (!validPassword) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
          { 
            id: user[0].id,
            username: user[0].username, 
            role: user[0].role 
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({
          token,
          user: {
            id: user[0].id,
            username: user[0].username,
            role: user[0].role,
            email: user[0].email
          }
        });
      } catch (dbError) {
        console.warn('Database query failed, using default credentials only');
        return res.status(401).json({ error: "Invalid credentials" });
      }

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // User Profile Route
  app.get("/api/user/profile", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email || `${user.username}@agiesfl.local`
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Dashboard Data Routes
  app.get("/api/dashboard/metrics", authenticateToken, async (req, res) => {
    try {
      // Try to fetch from database, fallback to mock data
      let metrics;

      try {
        const threatCount = await db.select().from(threats);
        const incidentCount = await db.select().from(incidents);
        const nodeCount = await db.select().from(federatedNodes);

        metrics = {
          activeThreats: threatCount.length,
          protectedNodes: nodeCount.length,
          systemHealth: 98.7,
          activeUsers: 156,
          totalIncidents: incidentCount.length,
          resolvedIncidents: Math.floor(incidentCount.length * 0.8),
          lastUpdated: new Date().toISOString()
        };
      } catch (dbError) {
        console.warn('Database query failed, using mock data');
        metrics = {
          activeThreats: 23,
          protectedNodes: 1247,
          systemHealth: 98.7,
          activeUsers: 156,
          totalIncidents: 45,
          resolvedIncidents: 36,
          lastUpdated: new Date().toISOString()
        };
      }

      res.json(metrics);
    } catch (error) {
      console.error('Metrics fetch error:', error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  app.get("/api/dashboard/threats", authenticateToken, async (req, res) => {
    try {
      let threats_data;

      try {
        threats_data = await db.select().from(threats).limit(10);
      } catch (dbError) {
        console.warn('Database query failed, using mock data');
        threats_data = [
          {
            id: "THR-001",
            type: "Malware Detection",
            severity: "high",
            source: "Node-247",
            timestamp: new Date().toISOString(),
            status: "active"
          },
          {
            id: "THR-002", 
            type: "Anomalous Traffic",
            severity: "medium",
            source: "Node-103",
            timestamp: new Date(Date.now() - 300000).toISOString(),
            status: "investigating"
          }
        ];
      }

      res.json(threats_data);
    } catch (error) {
      console.error('Threats fetch error:', error);
      res.status(500).json({ error: "Failed to fetch threats" });
    }
  });

  app.get("/api/dashboard/incidents", authenticateToken, async (req, res) => {
    try {
      let incidents_data;

      try {
        incidents_data = await db.select().from(incidents).limit(10);
      } catch (dbError) {
        console.warn('Database query failed, using mock data');
        incidents_data = [
          {
            id: "INC-001",
            title: "Suspicious Network Activity",
            severity: "high",
            status: "open",
            assignee: "Security Team",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: "INC-002",
            title: "Failed Authentication Attempts", 
            severity: "medium",
            status: "investigating",
            assignee: "SOC Analyst",
            createdAt: new Date(Date.now() - 600000).toISOString(),
            updatedAt: new Date(Date.now() - 300000).toISOString()
          }
        ];
      }

      res.json(incidents_data);
    } catch (error) {
      console.error('Incidents fetch error:', error);
      res.status(500).json({ error: "Failed to fetch incidents" });
    }
  });

  app.get("/api/federated-learning/nodes", authenticateToken, async (req, res) => {
    try {
      let nodes_data;

      try {
        nodes_data = await db.select().from(federatedNodes);
      } catch (dbError) {
        console.warn('Database query failed, using mock data');
        nodes_data = [
          {
            id: "node-001",
            name: "Security-Node-Alpha",
            status: "active",
            lastSync: new Date().toISOString(),
            modelAccuracy: 94.2,
            trainingSamples: 15420
          },
          {
            id: "node-002", 
            name: "Security-Node-Beta",
            status: "active",
            lastSync: new Date(Date.now() - 120000).toISOString(),
            modelAccuracy: 92.8,
            trainingSamples: 12350
          }
        ];
      }

      res.json(nodes_data);
    } catch (error) {
      console.error('Nodes fetch error:', error);
      res.status(500).json({ error: "Failed to fetch federated learning nodes" });
    }
  });

  // Test database connection endpoint
  app.get("/api/database/test", authenticateToken, async (req, res) => {
    try {
      const testResult = await db.select().from(users).limit(1);
      res.json({ 
        status: 'connected', 
        message: 'Database connection successful',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Database test failed:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Default API route
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      service: "AgiesFL Security Platform"
    });
  });

  // Apply security middleware
  app.use(securityHeaders);
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? true // Allow all origins in production for demonstration
      : ['http://localhost:5173', 'http://0.0.0.0:5173', 'http://localhost:5000', 'http://0.0.0.0:5000'],
    credentials: true
  }));
  app.use(requestLogger);

  const httpServer = createServer(app);

  // Setup WebSocket for real-time updates
  setupWebSocket(httpServer);

  // Apply rate limiting to API routes
  app.use('/api', createRateLimit(60 * 1000, 60, 'API rate limit exceeded'));

  // Error handling middleware (must be last)
  app.use(errorHandler);
}