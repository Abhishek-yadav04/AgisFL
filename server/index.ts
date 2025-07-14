
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

const app = express();
const server = createServer(app);

// Security middleware with production settings
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for demo purposes
  message: "Too many requests from this IP"
});
app.use('/api/', limiter);

// CORS configuration for client connectivity
app.use(cors({
  origin: true, // Allow all origins for demo
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom middleware to log requests with FL-IDS integration
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} from ${req.ip}`);
  
  // Log for FL-IDS analysis
  const requestData = {
    timestamp,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentLength: req.get('Content-Length') || 0,
    isAttack: false // Will be determined by FL-IDS
  };
  
  // Store request for FL-IDS processing
  global.requestLog = global.requestLog || [];
  global.requestLog.push(requestData);
  
  // Keep only last 1000 requests in memory
  if (global.requestLog.length > 1000) {
    global.requestLog = global.requestLog.slice(-1000);
  }
  
  next();
});

// FL-IDS request data endpoint
app.get('/api/fl-ids/requests', (req, res) => {
  res.json({
    requests: global.requestLog || [],
    total: (global.requestLog || []).length,
    timestamp: new Date().toISOString()
  });
});

// Database connection status endpoint
app.get('/api/db-status', async (req, res) => {
  try {
    const isConnected = await testDatabaseConnection();
    res.json({ 
      connected: isConnected,
      timestamp: new Date().toISOString(),
      host: process.env.DATABASE_HOST || '0.0.0.0',
      database: process.env.DATABASE_NAME || 'agiesfl_security',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({ 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Initialize server with comprehensive setup
 */
async function initializeServer() {
  try {
    console.log('🚀 Starting AgiesFL Security Platform Server...');
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 Host: ${process.env.HOST || '0.0.0.0'}`);
    console.log(`🔌 Port: ${process.env.PORT || 5000}`);

    // Initialize database
    console.log('\n📊 Database Setup:');
    await initializeDatabase();

    // Test connection and seed if needed
    const dbConnected = await testDatabaseConnection();
    if (dbConnected) {
      console.log('🌱 Seeding database with initial data...');
      await seedDatabase();
      console.log('✅ Database seeded successfully');
    } else {
      console.log('⚠️ Database not connected - using mock data');
    }

    // Setup WebSocket for real-time communication
    console.log('\n🔗 WebSocket Setup:');
    setupWebSocket(server);
    console.log('✅ WebSocket server initialized');

    // Register API routes
    console.log('\n🛣️ API Routes Setup:');
    registerRoutes(app);
    console.log('✅ API routes registered');

    // Setup Vite for development or serve static files for production
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
      console.log('✅ Vite development server configured');
    } else {
      serveStatic(app);
      console.log('✅ Static file serving configured');
    }

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        database: dbConnected ? 'connected' : 'offline',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        fl_ids: 'active'
      });
    });

    // Default credentials endpoint for development
    app.get('/api/credentials', (req, res) => {
      res.json({
        admin: {
          username: 'admin',
          password: 'SecureAdmin123!',
          role: 'administrator'
        },
        user: {
          username: 'analyst', 
          password: 'AnalystPass456!',
          role: 'analyst'
        }
      });
    });

    // Client connection info endpoint
    app.get('/api/connection-info', (req, res) => {
      res.json({
        serverHost: process.env.HOST || '0.0.0.0',
        serverPort: process.env.PORT || 5000,
        websocketUrl: `ws://${process.env.HOST || '0.0.0.0'}:${process.env.PORT || 5000}/ws`,
        apiBaseUrl: `http://${process.env.HOST || '0.0.0.0'}:${process.env.PORT || 5000}/api`,
        timestamp: new Date().toISOString()
      });
    });

    // Start server
    const port = process.env.PORT || 5000;
    const HOST = process.env.HOST || '0.0.0.0';

    server.listen(port, HOST, () => {
      console.log(`\n✅ Server running on ${HOST}:${port}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: ${dbConnected ? 'Connected' : 'Offline (Mock Data)'}`);
      console.log(`🔗 WebSocket: Enabled`);
      console.log(`🛡️ FL-IDS: Active`);
      console.log('\n🎯 AgiesFL Security Platform is ready!');
      console.log(`🔗 Local Access: http://localhost:${port}`);
      console.log(`🌍 External Access: http://${HOST}:${port}`);
      console.log('👤 Admin Login: admin / SecureAdmin123!');
      console.log('👤 Analyst Login: analyst / AnalystPass456!');
    });

  } catch (error) {
    console.error('🚨 Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Initialize FL-IDS request logging
global.requestLog = [];

// Initialize the server
initializeServer();
