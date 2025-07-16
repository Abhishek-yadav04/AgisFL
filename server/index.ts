import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";
import { setupWebSocket } from "./websocket";
import { initializeDatabase, testDatabaseConnection } from "./db";
import { seedDatabase } from "./seed";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

/**
 * AgiesFL Security Platform Server
 * Enterprise-grade Federated Learning Intrusion Detection System
 */

const app = express();
const PORT = process.env.PORT || 5000;

// Global types for FL-IDS request logging
declare global {
  var requestLog: Array<{
    timestamp: string;
    method: string;
    path: string;
    ip: string;
    userAgent?: string;
    contentLength: number;
    isAttack: boolean;
  }>;
}

app.get("/api/test-db-connection", async (req, res) => {
  try {
    const isConnected = await testDatabaseConnection();
    if (isConnected) {
      res.json({ success: true, message: "Database connection successful!" });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Database connection failed!" });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Security middleware configuration for production deployment
 */
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

/**
 * Rate limiting configuration
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    error: "Too many requests from this IP",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

/**
 * CORS configuration
 */
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  }),
);

// Request parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/**
 * FL-IDS Request Logging Middleware
 */
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const clientIP = req.ip || req.connection.remoteAddress || "unknown";

  console.log(`📡 ${timestamp} - ${req.method} ${req.path} from ${clientIP}`);

  const requestData = {
    timestamp,
    method: req.method,
    path: req.path,
    ip: clientIP,
    userAgent: req.get("User-Agent"),
    contentLength: parseInt(req.get("Content-Length") || "0"),
    isAttack: false,
  };

  if (!global.requestLog) {
    global.requestLog = [];
  }
  global.requestLog.push(requestData);

  if (global.requestLog.length > 1000) {
    global.requestLog = global.requestLog.slice(-1000);
  }

  next();
});

/**
 * FL-IDS API Endpoints
 */
app.get("/api/fl-ids/requests", (req, res) => {
  res.json({
    success: true,
    data: {
      requests: global.requestLog || [],
      total: (global.requestLog || []).length,
      lastUpdate: new Date().toISOString(),
      status: "active",
    },
  });
});

// Other API endpoints and routes registration
registerRoutes(app);

const server = createServer(app);

/**
 * Initialize and start the AgiesFL Security Platform server
 */
async function initializeServer() {
  try {
    console.log("🚀 Starting AgiesFL Security Platform Server...");
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`📡 Host: ${process.env.HOST || "0.0.0.0"}`);
    console.log(`🔌 Port: ${PORT}`);

    await initializeDatabase();

    const dbConnected = await testDatabaseConnection();
    if (dbConnected) {
      console.log("🌱 Seeding database with security data...");
      await seedDatabase();
      console.log("✅ Database ready with sample data");
    } else {
      console.log("⚠️ Database offline - using mock security data");
    }

    setupWebSocket(server);
    console.log("✅ Real-time communication enabled");

    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
      console.log("✅ Development server configured");
    } else {
      serveStatic(app);
      console.log("✅ Production static serving enabled");
    }

    global.requestLog = [];
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("🚨 Server startup failed:", error);
    process.exit(1);
  }
}

initializeServer();
