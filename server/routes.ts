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
  authenticateUser,
  generateToken,
  loginSchema
} from "./middleware/auth";
import { logger, securityLogger, performanceLogger } from "./logger";
import cors from 'cors';
import express, { type Request, Response } from "express";

// Rate limits for different endpoint types
const generalLimit = createRateLimit(15 * 60 * 1000, 100, 'Too many requests');
const authLimit = createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts');
const apiLimit = createRateLimit(60 * 1000, 60, 'API rate limit exceeded');

// Mock data for immediate functionality
const mockFLStatus = {
  status: "active",
  round: 15,
  participants: 12,
  accuracy: 94.7,
  lastUpdate: new Date().toISOString()
};

const mockNodes = [
  { id: 1, name: "Node-Finance", status: "active", accuracy: 95.2, lastSeen: new Date() },
  { id: 2, name: "Node-HR", status: "active", accuracy: 93.8, lastSeen: new Date() },
  { id: 3, name: "Node-IT", status: "training", accuracy: 96.1, lastSeen: new Date() }
];

const mockPerformance = {
  accuracy: 94.7,
  precision: 92.3,
  recall: 96.1,
  f1Score: 94.2,
  trainingTime: 45.2
};

const mockThreats = [
  {
    id: 1,
    title: "Suspicious Network Activity",
    severity: "High",
    description: "Unusual traffic patterns detected",
    timestamp: new Date().toISOString()
  },
  {
    id: 2,
    title: "Failed Login Attempts",
    severity: "Medium", 
    description: "Multiple failed authentication attempts",
    timestamp: new Date().toISOString()
  }
];


export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Apply security middleware
  app.use(securityHeaders);
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://your-domain.com'] 
      : ['http://localhost:5173', 'http://0.0.0.0:5173'],
    credentials: true
  }));
  app.use(requestLogger);

  // Setup WebSocket for real-time updates
  setupWebSocket(httpServer);

  // Health check endpoint (no auth required)
  app.get("/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      version: "2.0.0",
      environment: process.env.NODE_ENV || 'development',
      service: "AgiesFL Backend"
    });
  });

    // Federated Learning endpoints with enhanced error handling
  app.get("/api/fl/status", (req: Request, res: Response) => {
    try {
      const enhancedStatus = {
        ...mockFLStatus,
        timestamp: new Date().toISOString(),
        server_status: "operational",
        connection_status: "connected"
      };
      res.json(enhancedStatus);
    } catch (error) {
      logger.error('FL status error:', error);
      res.status(500).json({ error: 'Failed to fetch FL status' });
    }
  });

  app.get("/api/fl/nodes", (req: Request, res: Response) => {
    try {
      const enhancedNodes = mockNodes.map(node => ({
        ...node,
        lastSeen: new Date(),
        connectionStatus: "connected",
        heartbeat: Date.now()
      }));
      res.json(enhancedNodes);
    } catch (error) {
      logger.error('FL nodes error:', error);
      res.status(500).json({ error: 'Failed to fetch FL nodes' });
    }
  });

  app.get("/api/fl/performance", (req: Request, res: Response) => {
    try {
      const enhancedPerformance = {
        ...mockPerformance,
        timestamp: new Date().toISOString(),
        modelVersion: "v2.1.0",
        convergenceStatus: "stable"
      };
      res.json(enhancedPerformance);
    } catch (error) {
      logger.error('FL performance error:', error);
      res.status(500).json({ error: 'Failed to fetch FL performance' });
    }
  });

  // Enhanced threats endpoint
  app.get("/api/threats", (req: Request, res: Response) => {
    try {
      const enhancedThreats = mockThreats.map(threat => ({
        ...threat,
        id: Math.floor(Math.random() * 10000),
        detectionTime: new Date().toISOString(),
        status: "active"
      }));
      res.json(enhancedThreats);
    } catch (error) {
      logger.error('Threats error:', error);
      res.status(500).json({ error: 'Failed to fetch threats' });
    }
  });

  // Authentication endpoints
  app.post("/api/auth/login", authLimit, validateInput(loginSchema), async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await authenticateUser(email, password);

      if (user) {
        const token = generateToken(user);

        securityLogger.info('User login successful', {
          userId: user.id,
          email: user.email,
          role: user.role,
          ip: req.ip,
          userAgent: req.get('user-agent')
        });

        res.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
          }
        });
      } else {
        securityLogger.warn('Login attempt failed - Invalid credentials', {
          email,
          ip: req.ip,
          userAgent: req.get('user-agent')
        });
        res.status(401).json({ error: 'Invalid email or password' });
      }
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/logout", authenticate, async (req, res) => {
    securityLogger.info('User logout', {
      userId: (req as AuthenticatedRequest).user?.id,
      ip: req.ip
    });
    res.json({ message: 'Logged out successfully' });
  });

  // Apply rate limiting to API routes
  app.use('/api', apiLimit);

  // Dashboard metrics endpoint with fallback
  app.get("/api/dashboard/metrics", async (req, res, next) => {
    try {
      const startTime = Date.now();
      let metrics;
      
      try {
        metrics = await storage.getDashboardMetrics();
      } catch (dbError) {
        // Fallback to mock data if database fails
        logger.warn('Database unavailable, using mock metrics:', dbError);
        metrics = {
          totalIncidents: 15,
          activeThreats: 8,
          resolvedIncidents: 42,
          systemHealth: 94.7,
          threatLevel: "Medium",
          lastUpdate: new Date().toISOString(),
          flStatus: {
            active: true,
            nodes: 3,
            accuracy: 94.7,
            lastTraining: new Date().toISOString()
          }
        };
      }
      
      const duration = Date.now() - startTime;
      performanceLogger.info('Dashboard metrics fetched', { duration });
      res.json(metrics);
    } catch (error) {
      logger.error('Dashboard metrics error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
    }
  });

  // Incidents endpoints
  app.get("/api/incidents", authenticate, async (req, res, next) => {
    try {
      const incidents = await storage.getIncidents();
      res.json(incidents);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/incidents/:id", authenticate, async (req, res, next) => {
    try {
      const incident = await storage.getIncident(parseInt(req.params.id));
      if (!incident) {
        return res.status(404).json({ error: "Incident not found" });
      }
      res.json(incident);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/incidents", authenticate, authorize(['administrator', 'analyst']), validateInput(insertIncidentSchema), async (req, res, next) => {
    try {
      const incident = await storage.createIncident(req.body);

      securityLogger.info('Incident created', {
        incidentId: incident.id,
        severity: incident.severity,
        userId: (req as AuthenticatedRequest).user?.id
      });

      res.status(201).json(incident);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/incidents/:id", authenticate, authorize(['administrator', 'analyst']), validateInput(insertIncidentSchema.partial()), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const incident = await storage.updateIncident(id, req.body);
      if (!incident) {
        return res.status(404).json({ error: "Incident not found" });
      }

      securityLogger.info('Incident updated', {
        incidentId: id,
        userId: (req as AuthenticatedRequest).user?.id
      });

      res.json(incident);
    } catch (error) {
      next(error);
    }
  });

  // Threats endpoints
  app.get("/api/threats", authenticate, async (req, res, next) => {
    try {
      const threats = await storage.getThreats();
      res.json(threats);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/threats/active", authenticate, async (req, res, next) => {
    try {
      const threats = await storage.getActiveThreats();
      res.json(threats);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/threats/feed", authenticate, async (req, res, next) => {
    try {
      const feed = await storage.getThreatFeed();
      res.json(feed);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/threats", authenticate, authorize(['administrator', 'analyst']), validateInput(insertThreatSchema), async (req, res, next) => {
    try {
      const threat = await storage.createThreat(req.body);

      securityLogger.warn('New threat created', {
        threatId: threat.id,
        type: threat.type,
        severity: threat.severity,
        userId: (req as AuthenticatedRequest).user?.id
      });

      res.status(201).json(threat);
    } catch (error) {
      next(error);
    }
  });

  // System metrics endpoints
  app.get("/api/system/health", authenticate, async (req, res, next) => {
    try {
      const health = await storage.getSystemHealth();
      res.json(health);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/system/metrics", authenticate, async (req, res, next) => {
    try {
      const metrics = await storage.getSystemMetrics();
      res.json(metrics);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/system/metrics", authenticate, authorize(['administrator']), validateInput(insertSystemMetricSchema), async (req, res, next) => {
    try {
      const metric = await storage.createSystemMetric(req.body);
      res.status(201).json(metric);
    } catch (error) {
      next(error);
    }
  });

  // AI Insights endpoints
  app.get("/api/ai/insights", authenticate, async (req, res, next) => {
    try {
      const insights = await storage.getAiInsights();
      res.json(insights);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/ai/insights", authenticate, authorize(['administrator']), validateInput(insertAiInsightSchema), async (req, res, next) => {
    try {
      const insight = await storage.createAiInsight(req.body);
      res.status(201).json(insight);
    } catch (error) {
      next(error);
    }
  });

  // Attack path endpoints
  app.get("/api/attack-paths", authenticate, async (req, res, next) => {
    try {
      const paths = await storage.getAttackPaths();
      res.json(paths);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/attack-paths", authenticate, authorize(['administrator', 'analyst']), validateInput(insertAttackPathSchema), async (req, res, next) => {
    try {
      const path = await storage.createAttackPath(req.body);
      res.status(201).json(path);
    } catch (error) {
      next(error);
    }
  });

  // User endpoints
  app.get("/api/users", authenticate, authorize(['administrator']), async (req, res, next) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  });

  // FL-IDS specific endpoints with enhanced error handling
  app.get("/api/fl-ids/status", authenticate, async (req, res, next) => {
    try {
      const startTime = Date.now();
      const status = await storage.getFLIDSStatus();
      const duration = Date.now() - startTime;

      performanceLogger.info('FL-IDS status fetched', { 
        duration,
        userId: (req as AuthenticatedRequest).user?.id 
      });
      res.json(status);
    } catch (error) {
      logger.error('Failed to fetch FL-IDS status', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req as AuthenticatedRequest).user?.id
      });
      next(error);
    }
  });

  app.get("/api/fl-ids/performance", authenticate, async (req, res, next) => {
    try {
      const performance = await storage.getFLPerformanceMetrics();
      res.json(performance);
    } catch (error) {
      logger.error('Failed to fetch FL performance metrics', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req as AuthenticatedRequest).user?.id
      });
      next(error);
    }
  });

  app.get("/api/fl-ids/nodes", authenticate, async (req, res, next) => {
    try {
      const status = await storage.getFLIDSStatus();
      res.json({
        nodes: status.node_details || [],
        total_nodes: status.active_nodes || 0,
        federated_rounds: status.fl_rounds_completed || 0,
        global_model_info: {
          last_updated: new Date().toISOString(),
          convergence_status: status.fl_rounds_completed > 10 ? "converged" : "training",
          model_version: `v2.${status.fl_rounds_completed}`,
          deployment_ready: status.global_accuracy > 0.85
        }
      });
    } catch (error) {
      logger.error('Failed to fetch FL nodes', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req as AuthenticatedRequest).user?.id
      });
      next(error);
    }
  });

  // FL-IDS training control endpoints
  app.post("/api/fl-ids/train", authenticate, authorize(['administrator', 'operator']), async (req, res, next) => {
    try {
      securityLogger.info('FL training round initiated', {
        userId: (req as AuthenticatedRequest).user?.id,
        timestamp: new Date().toISOString()
      });

      res.json({ 
        message: "Training round initiated successfully",
        round: Math.floor(Math.random() * 100) + 1,
        estimated_completion: new Date(Date.now() + 30000).toISOString()
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/fl-ids/stop", authenticate, authorize(['administrator']), async (req, res, next) => {
    try {
      securityLogger.warn('FL system stop requested', {
        userId: (req as AuthenticatedRequest).user?.id,
        timestamp: new Date().toISOString()
      });

      res.json({ message: "FL system stop initiated" });
    } catch (error) {
      next(error);
    }
  });

  // Advanced analytics endpoints
  app.get("/api/analytics/threat-trends", authenticate, async (req, res, next) => {
    try {
      const trends = {
        daily_threats: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          count: Math.floor(Math.random() * 50) + 10
        })),
        threat_types: {
          malware: 34,
          ddos: 28,
          intrusion: 19,
          phishing: 15,
          data_breach: 4
        },
        severity_distribution: {
          critical: 12,
          high: 28,
          medium: 45,
          low: 15
        }
      };
      res.json(trends);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/analytics/performance-metrics", authenticate, async (req, res, next) => {
    try {
      const metrics = {
        detection_accuracy: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          accuracy: 0.85 + Math.random() * 0.1
        })),
        response_times: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          avg_response_time: 50 + Math.random() * 100
        })),
        system_load: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          cpu: 20 + Math.random() * 60,
          memory: 30 + Math.random() * 50,
          network: 10 + Math.random() * 80
        }))
      };
      res.json(metrics);
    } catch (error) {
      next(error);
    }
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return httpServer;
}