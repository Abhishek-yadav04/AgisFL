
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
  AuthenticatedRequest
} from "./middleware/auth";
import { logger, securityLogger, performanceLogger } from "./logger";
import cors from 'cors';

// Rate limits for different endpoint types
const generalLimit = createRateLimit(15 * 60 * 1000, 100, 'Too many requests'); // 100 requests per 15 minutes
const authLimit = createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts'); // 5 attempts per 15 minutes
const apiLimit = createRateLimit(60 * 1000, 30, 'API rate limit exceeded'); // 30 requests per minute

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
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Authentication endpoints
  app.post("/api/auth/login", authLimit, async (req, res, next) => {
    try {
      // Mock authentication for development
      const { email, password } = req.body;
      
      if (email === 'admin@company.com' && password === 'admin123') {
        const token = 'mock-jwt-token'; // In production, generate real JWT
        
        securityLogger.info('User login successful', {
          email,
          ip: req.ip,
          userAgent: req.get('user-agent')
        });
        
        res.json({
          token,
          user: {
            id: 1,
            email: 'admin@company.com',
            role: 'administrator',
            name: 'System Administrator'
          }
        });
      } else {
        securityLogger.warn('Login attempt failed', {
          email,
          ip: req.ip,
          userAgent: req.get('user-agent')
        });
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (error) {
      next(error);
    }
  });

  // Apply rate limiting to API routes
  app.use('/api', apiLimit);

  // Dashboard metrics endpoint
  app.get("/api/dashboard/metrics", async (req, res, next) => {
    try {
      const startTime = Date.now();
      const metrics = await storage.getDashboardMetrics();
      const duration = Date.now() - startTime;
      
      performanceLogger.info('Dashboard metrics fetched', { duration });
      res.json(metrics);
    } catch (error) {
      next(error);
    }
  });

  // Incidents endpoints
  app.get("/api/incidents", async (req, res, next) => {
    try {
      const incidents = await storage.getIncidents();
      res.json(incidents);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/incidents/:id", async (req, res, next) => {
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

  app.post("/api/incidents", validateInput(insertIncidentSchema), async (req, res, next) => {
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

  app.patch("/api/incidents/:id", validateInput(insertIncidentSchema.partial()), async (req, res, next) => {
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
  app.get("/api/threats", async (req, res, next) => {
    try {
      const threats = await storage.getThreats();
      res.json(threats);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/threats/active", async (req, res, next) => {
    try {
      const threats = await storage.getActiveThreats();
      res.json(threats);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/threats", validateInput(insertThreatSchema), async (req, res, next) => {
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
  app.get("/api/system/health", async (req, res, next) => {
    try {
      const health = await storage.getSystemHealth();
      res.json(health);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/system/metrics", async (req, res, next) => {
    try {
      const metrics = await storage.getSystemMetrics();
      res.json(metrics);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/system/metrics", validateInput(insertSystemMetricSchema), async (req, res, next) => {
    try {
      const metric = await storage.createSystemMetric(req.body);
      res.status(201).json(metric);
    } catch (error) {
      next(error);
    }
  });

  // AI Insights endpoints
  app.get("/api/ai/insights", async (req, res, next) => {
    try {
      const insights = await storage.getAiInsights();
      res.json(insights);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/ai/insights", validateInput(insertAiInsightSchema), async (req, res, next) => {
    try {
      const insight = await storage.createAiInsight(req.body);
      res.status(201).json(insight);
    } catch (error) {
      next(error);
    }
  });

  // Attack path endpoints
  app.get("/api/attack-paths", async (req, res, next) => {
    try {
      const paths = await storage.getAttackPaths();
      res.json(paths);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/attack-paths", validateInput(insertAttackPathSchema), async (req, res, next) => {
    try {
      const path = await storage.createAttackPath(req.body);
      res.status(201).json(path);
    } catch (error) {
      next(error);
    }
  });

  // Real-time threat feed endpoint
  app.get("/api/threats/feed", async (req, res, next) => {
    try {
      const feed = await storage.getThreatFeed();
      res.json(feed);
    } catch (error) {
      next(error);
    }
  });

  // User endpoints
  app.get("/api/users", async (req, res, next) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  });

  // FL-IDS specific endpoints with enhanced error handling
  app.get("/api/fl-ids/status", async (req, res, next) => {
    try {
      const startTime = Date.now();
      const status = await storage.getFLIDSStatus();
      const duration = Date.now() - startTime;
      
      performanceLogger.info('FL-IDS status fetched', { duration });
      res.json(status);
    } catch (error) {
      logger.error('Failed to fetch FL-IDS status', { error: error instanceof Error ? error.message : 'Unknown error' });
      next(error);
    }
  });

  app.get("/api/fl-ids/performance", async (req, res, next) => {
    try {
      const performance = await storage.getFLPerformanceMetrics();
      res.json(performance);
    } catch (error) {
      logger.error('Failed to fetch FL performance metrics', { error: error instanceof Error ? error.message : 'Unknown error' });
      next(error);
    }
  });

  app.get("/api/fl-ids/nodes", async (req, res, next) => {
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
      logger.error('Failed to fetch FL nodes', { error: error instanceof Error ? error.message : 'Unknown error' });
      next(error);
    }
  });

  // FL-IDS training control endpoints
  app.post("/api/fl-ids/train", async (req, res, next) => {
    try {
      // Mock training trigger
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

  app.post("/api/fl-ids/stop", async (req, res, next) => {
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
  app.get("/api/analytics/threat-trends", async (req, res, next) => {
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

  app.get("/api/analytics/performance-metrics", async (req, res, next) => {
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
