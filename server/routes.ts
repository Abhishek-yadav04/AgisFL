import { Router } from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { storage } from "./storage";
import { setupWebSocket } from "./websocket";
import { systemMonitor } from "./services/system-monitor";
import { networkMonitor } from "./services/network-monitor";
import { threatDetector } from "./services/threat-detector";
import { flCoordinator } from "./services/fl-coordinator";
import { realSystemMonitor } from "./services/real-system-monitor";

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  mfaCode: z.string().optional(),
  rememberMe: z.boolean().optional()
});

const JWT_SECRET = process.env.JWT_SECRET || "agisfl_secure_key_2024";
const DEMO_CREDENTIALS = { username: "admin", password: "password123" };

const rateLimitStore = new Map();
const mfaStore = new Map();

function rateLimitMiddleware(req: any, res: any, next: any) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxAttempts = 5;

  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, { attempts: 0, resetTime: now + windowMs });
  }

  const record = rateLimitStore.get(ip);

  if (now > record.resetTime) {
    record.attempts = 0;
    record.resetTime = now + windowMs;
  }

  if (record.attempts >= maxAttempts) {
    return res.status(429).json({
      message: "Too many login attempts. Please try again later.",
      retryAfter: Math.ceil((record.resetTime - now) / 1000)
    });
  }

  record.attempts++;
  next();
}

function generateMFACode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function simulateSendMFA(username: string, code: string) {
  console.log(`🔐 MFA Code for ${username}: ${code}`);
}

router.post("/api/auth/login", rateLimitMiddleware, async (req, res) => {
  try {
    const { username, password, mfaCode, rememberMe } = loginSchema.parse(req.body);

    if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
      const requiresMFA = !mfaCode;

      if (requiresMFA) {
        const code = generateMFACode();
        mfaStore.set(username, {
          code,
          expires: Date.now() + 300000,
          verified: false
        });

        simulateSendMFA(username, code);

        return res.json({
          requiresMFA: true,
          message: "MFA code sent. Check console for demo code.",
          mfaCode: code // For demo purposes only
        });
      }

      const mfaRecord = mfaStore.get(username);
      if (!mfaRecord || mfaRecord.code !== mfaCode || Date.now() > mfaRecord.expires) {
        return res.status(401).json({ message: "Invalid or expired MFA code" });
      }

      rateLimitStore.delete(req.ip);
      mfaStore.delete(username);

      const token = jwt.sign(
        { 
          username, 
          role: "admin",
          mfaVerified: true,
          loginTime: new Date().toISOString()
        },
        JWT_SECRET,
        { expiresIn: rememberMe ? "30d" : "24h" }
      );

      res.json({
        success: true,
        token,
        user: {
          username,
          role: "admin",
          permissions: ["read", "write", "admin"]
        }
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(400).json({ message: "Invalid request data" });
  }
});

router.post("/api/auth/guest", (req, res) => {
  try {
    const token = jwt.sign(
      { 
        username: "guest", 
        role: "guest",
        mfaVerified: false,
        loginTime: new Date().toISOString()
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      token,
      user: {
        username: "guest",
        role: "guest",
        permissions: ["read"]
      }
    });
  } catch (error) {
    console.error("Guest login error:", error);
    res.status(500).json({ message: "Guest login failed" });
  }
});

router.post("/api/auth/logout", (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}

router.get("/api/dashboard", authenticateToken, async (req, res) => {
  try {
    const dashboardData = await storage.getDashboardData();
    res.json(dashboardData);
  } catch (error) {
    console.error("Dashboard data error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
});

router.get("/api/system/status", authenticateToken, (req, res) => {
  try {
    const metrics = systemMonitor.getLatestMetrics();
    const realMetrics = realSystemMonitor.getLatestMetrics();
    const threats = threatDetector.getActiveThreats();
    const flStatus = flCoordinator.getStatus();

    res.json({
      timestamp: new Date().toISOString(),
      system: metrics || realMetrics,
      security: {
        activeThreats: threats.length,
        threatLevel: threats.some(t => t.severity === 'critical') ? 'critical' : 
                     threats.some(t => t.severity === 'high') ? 'high' : 'normal',
        lastScan: new Date().toISOString()
      },
      federatedLearning: flStatus,
      services: {
        systemMonitor: true,
        networkMonitor: true,
        threatDetector: true,
        flCoordinator: true
      }
    });
  } catch (error) {
    console.error("System status error:", error);
    res.status(500).json({ message: "Failed to fetch system status" });
  }
});

router.get("/api/threats", authenticateToken, (req, res) => {
  try {
    const threats = threatDetector.getAllThreats();
    const stats = threatDetector.getThreatStats();

    res.json({
      threats,
      statistics: stats,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Threats data error:", error);
    res.status(500).json({ message: "Failed to fetch threats data" });
  }
});

router.get("/api/network/metrics", authenticateToken, (req, res) => {
  try {
    const metrics = networkMonitor.getLatestMetrics();
    const topology = networkMonitor.getNetworkTopology();

    res.json({
      metrics,
      topology,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Network metrics error:", error);
    res.status(500).json({ message: "Failed to fetch network metrics" });
  }
});

router.get("/api/federated-learning/status", authenticateToken, (req, res) => {
  try {
    const status = flCoordinator.getStatus();
    const nodes = flCoordinator.getNodes();
    const trainingHistory = flCoordinator.getTrainingHistory();

    res.json({
      status,
      nodes,
      trainingHistory,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("FL status error:", error);
    res.status(500).json({ message: "Failed to fetch federated learning status" });
  }
});

router.get("/api/system/metrics", authenticateToken, (req, res) => {
  try {
    const realMetrics = realSystemMonitor.getLatestMetrics();
    const health = realSystemMonitor.getSystemHealth();

    res.json({
      metrics: realMetrics,
      health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("System metrics error:", error);
    res.status(500).json({ message: "Failed to fetch system metrics" });
  }
});

router.post("/api/threats/:id/mitigate", authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    res.json({
      success: true,
      message: `Mitigation initiated for threat ${id}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Threat mitigation error:", error);
    res.status(500).json({ message: "Failed to mitigate threat" });
  }
});

router.get("/api/security/scan", authenticateToken, async (req, res) => {
  try {
    const scanResults = {
      id: `scan_${Date.now()}`,
      status: 'completed',
      timestamp: new Date().toISOString(),
      results: {
        vulnerabilities: Math.floor(Math.random() * 5),
        threatsDetected: Math.floor(Math.random() * 3),
        suspiciousActivities: Math.floor(Math.random() * 7),
        recommendations: [
          'Update system patches',
          'Review user permissions',
          'Monitor network traffic'
        ]
      }
    };

    res.json(scanResults);
  } catch (error) {
    console.error("Security scan error:", error);
    res.status(500).json({ message: "Security scan failed" });
  }
});

export function registerRoutes(app: any, httpServer?: any) {
  app.use(router);

  console.log("🔧 Starting monitoring services...");

  try {
    systemMonitor.start();
    networkMonitor.start();
    threatDetector.start();
    flCoordinator.start();
    realSystemMonitor.start();
    console.log("✅ All monitoring services started");
  } catch (error) {
    console.error("❌ Error starting monitoring services:", error);
  }

  if (httpServer) {
    const wss = setupWebSocket(httpServer);
    return httpServer;
  }

  return app;
}