
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
import fs from "fs";
import path from "path";

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

        // Log successful login for FL-IDS
        const loginEvent = {
          timestamp: new Date().toISOString(),
          event: 'successful_login',
          username: defaultUser.username,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          isAttack: false
        };
        
        global.securityLog = global.securityLog || [];
        global.securityLog.push(loginEvent);

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
          // Log failed login attempt for FL-IDS
          const failedLoginEvent = {
            timestamp: new Date().toISOString(),
            event: 'failed_login',
            username: username,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            isAttack: true // Potential attack
          };
          
          global.securityLog = global.securityLog || [];
          global.securityLog.push(failedLoginEvent);
          
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

  // FL-IDS specific endpoints
  app.get("/api/fl-ids/status", authenticateToken, async (req, res) => {
    try {
      const requestLog = global.requestLog || [];
      const securityLog = global.securityLog || [];
      
      const totalRequests = requestLog.length;
      const suspiciousRequests = securityLog.filter(log => log.isAttack).length;
      const detectionRate = totalRequests > 0 ? (suspiciousRequests / totalRequests) * 100 : 0;
      
      res.json({
        status: 'active',
        total_processed_last_hour: totalRequests,
        anomalies_detected_last_hour: suspiciousRequests,
        detection_rate: detectionRate,
        model_accuracy: 94.7,
        last_training: new Date().toISOString(),
        nodes_active: 3,
        privacy_budget_remaining: 0.85,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('FL-IDS status error:', error);
      res.status(500).json({ error: "Failed to get FL-IDS status" });
    }
  });

  app.get("/api/fl-ids/logs", authenticateToken, async (req, res) => {
    try {
      const requestLog = global.requestLog || [];
      const securityLog = global.securityLog || [];
      
      // Combine and sort logs
      const allLogs = [
        ...requestLog.map(log => ({ ...log, type: 'request' })),
        ...securityLog.map(log => ({ ...log, type: 'security' }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      res.json({
        logs: allLogs.slice(0, 100), // Return last 100 logs
        total: allLogs.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('FL-IDS logs error:', error);
      res.status(500).json({ error: "Failed to get FL-IDS logs" });
    }
  });

  app.post("/api/fl-ids/train", authenticateToken, async (req, res) => {
    try {
      // Simulate FL-IDS training
      const trainingData = global.requestLog || [];
      
      // Mock training process
      const trainingResult = {
        rounds_completed: 5,
        model_accuracy: 94.7 + Math.random() * 2, // Slight improvement
        training_samples: trainingData.length,
        nodes_participated: 3,
        privacy_budget_used: 0.15,
        training_time: Math.random() * 30 + 10, // 10-40 seconds
        improvement: Math.random() * 5 + 1, // 1-6% improvement
        timestamp: new Date().toISOString()
      };
      
      // Log training completion
      console.log('FL-IDS Training completed:', trainingResult);
      
      res.json({
        status: 'completed',
        result: trainingResult,
        message: 'Federated learning training completed successfully'
      });
    } catch (error) {
      console.error('FL-IDS training error:', error);
      res.status(500).json({ error: "Failed to start FL-IDS training" });
    }
  });

  app.post("/api/fl-ids/simulate-attack", authenticateToken, async (req, res) => {
    try {
      const { attackType = 'brute_force', intensity = 'medium' } = req.body;
      
      // Simulate attack data
      const attackEvents = [];
      const attackCount = intensity === 'high' ? 50 : intensity === 'medium' ? 25 : 10;
      
      for (let i = 0; i < attackCount; i++) {
        const attackEvent = {
          timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          event: attackType,
          ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'AttackBot/1.0',
          isAttack: true,
          severity: intensity,
          blocked: Math.random() > 0.3 // 70% blocked
        };
        attackEvents.push(attackEvent);
      }
      
      // Add to security log
      global.securityLog = global.securityLog || [];
      global.securityLog.push(...attackEvents);
      
      res.json({
        status: 'simulated',
        attack_type: attackType,
        events_generated: attackCount,
        blocked: attackEvents.filter(e => e.blocked).length,
        detected: attackCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Attack simulation error:', error);
      res.status(500).json({ error: "Failed to simulate attack" });
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

        const requestLog = global.requestLog || [];
        const securityLog = global.securityLog || [];
        const attacksBlocked = securityLog.filter(log => log.isAttack && log.blocked).length;

        metrics = {
          activeThreats: threatCount.length + securityLog.filter(log => log.isAttack).length,
          protectedNodes: nodeCount.length || 1247,
          systemHealth: 98.7,
          activeUsers: 156,
          totalIncidents: incidentCount.length + securityLog.length,
          resolvedIncidents: Math.floor((incidentCount.length + securityLog.length) * 0.8),
          attacksBlocked: attacksBlocked,
          flIdsActive: true,
          lastUpdated: new Date().toISOString()
        };
      } catch (dbError) {
        console.warn('Database query failed, using mock data');
        const securityLog = global.securityLog || [];
        const attacksBlocked = securityLog.filter(log => log.isAttack && log.blocked).length;
        
        metrics = {
          activeThreats: 23 + securityLog.filter(log => log.isAttack).length,
          protectedNodes: 1247,
          systemHealth: 98.7,
          activeUsers: 156,
          totalIncidents: 45 + securityLog.length,
          resolvedIncidents: 36 + Math.floor(securityLog.length * 0.8),
          attacksBlocked: attacksBlocked,
          flIdsActive: true,
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
        
        // Add FL-IDS detected threats
        const securityLog = global.securityLog || [];
        const flThreats = securityLog.filter(log => log.isAttack).slice(0, 5).map(log => ({
          id: `FL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: log.event || "FL-IDS Detection",
          severity: log.severity || "medium",
          source: log.ip || "Unknown",
          timestamp: log.timestamp,
          status: log.blocked ? "blocked" : "active",
          confidence: 0.95,
          flDetected: true
        }));
        
        threats_data = [...threats_data, ...flThreats];
      } catch (dbError) {
        console.warn('Database query failed, using mock data');
        const securityLog = global.securityLog || [];
        const flThreats = securityLog.filter(log => log.isAttack).slice(0, 3).map(log => ({
          id: `FL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: log.event || "FL-IDS Detection",
          severity: log.severity || "medium", 
          source: log.ip || "Unknown",
          timestamp: log.timestamp,
          status: log.blocked ? "blocked" : "active",
          confidence: 0.95,
          flDetected: true
        }));
        
        threats_data = [
          {
            id: "THR-001",
            type: "Malware Detection",
            severity: "high",
            source: "Node-247",
            timestamp: new Date().toISOString(),
            status: "active",
            flDetected: false
          },
          {
            id: "THR-002", 
            type: "Anomalous Traffic",
            severity: "medium",
            source: "Node-103",
            timestamp: new Date(Date.now() - 300000).toISOString(),
            status: "investigating",
            flDetected: false
          },
          ...flThreats
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
        
        // Add FL-IDS incidents
        const securityLog = global.securityLog || [];
        const flIncidents = securityLog.filter(log => log.isAttack).slice(0, 3).map(log => ({
          id: `FL-INC-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          title: `FL-IDS: ${log.event || 'Security Event'}`,
          severity: log.severity || "medium",
          status: log.blocked ? "resolved" : "open",
          assignee: "FL-IDS System",
          createdAt: log.timestamp,
          updatedAt: log.timestamp,
          source: log.ip,
          flGenerated: true
        }));
        
        incidents_data = [...incidents_data, ...flIncidents];
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
            updatedAt: new Date().toISOString(),
            flGenerated: false
          },
          {
            id: "INC-002",
            title: "Failed Authentication Attempts", 
            severity: "medium",
            status: "investigating",
            assignee: "SOC Analyst",
            createdAt: new Date(Date.now() - 600000).toISOString(),
            updatedAt: new Date(Date.now() - 300000).toISOString(),
            flGenerated: false
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
        const securityLog = global.securityLog || [];
        const recentActivity = securityLog.length;
        
        nodes_data = [
          {
            id: "node-001",
            name: "Security-Node-Alpha",
            status: "active",
            lastSync: new Date().toISOString(),
            modelAccuracy: 94.2 + (recentActivity * 0.01),
            trainingSamples: 15420 + recentActivity
          },
          {
            id: "node-002", 
            name: "Security-Node-Beta",
            status: "active",
            lastSync: new Date(Date.now() - 120000).toISOString(),
            modelAccuracy: 92.8 + (recentActivity * 0.01),
            trainingSamples: 12350 + recentActivity
          },
          {
            id: "node-003",
            name: "Security-Node-Gamma",
            status: "active",
            lastSync: new Date(Date.now() - 60000).toISOString(),
            modelAccuracy: 93.5 + (recentActivity * 0.01),
            trainingSamples: 14200 + recentActivity
          }
        ];
      }

      res.json(nodes_data);
    } catch (error) {
      console.error('Nodes fetch error:', error);
      res.status(500).json({ error: "Failed to fetch federated learning nodes" });
    }
  });

  // Export logs for analysis
  app.get("/api/fl-ids/export-logs", authenticateToken, async (req, res) => {
    try {
      const requestLog = global.requestLog || [];
      const securityLog = global.securityLog || [];
      
      const exportData = {
        export_timestamp: new Date().toISOString(),
        request_logs: requestLog,
        security_logs: securityLog,
        summary: {
          total_requests: requestLog.length,
          total_security_events: securityLog.length,
          attacks_detected: securityLog.filter(log => log.isAttack).length,
          attacks_blocked: securityLog.filter(log => log.isAttack && log.blocked).length
        }
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="fl-ids-logs-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    } catch (error) {
      console.error('Export logs error:', error);
      res.status(500).json({ error: "Failed to export logs" });
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
      service: "AgiesFL Security Platform",
      fl_ids: "active",
      requests_processed: (global.requestLog || []).length,
      security_events: (global.securityLog || []).length
    });
  });

  // Apply security middleware
  app.use(securityHeaders);
  app.use(cors({
    origin: true, // Allow all origins for demo
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));
  app.use(requestLogger);

  const httpServer = createServer(app);

  // Setup WebSocket for real-time updates
  setupWebSocket(httpServer);

  // Apply rate limiting to API routes
  app.use('/api', createRateLimit(60 * 1000, 1000, 'API rate limit exceeded')); // Increased for demo

  // Error handling middleware (must be last)
  app.use(errorHandler);

  // Initialize global variables for FL-IDS
  global.requestLog = global.requestLog || [];
  global.securityLog = global.securityLog || [];
}
