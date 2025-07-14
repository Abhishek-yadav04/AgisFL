
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

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP"
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Database connection status endpoint
app.get('/api/db-status', async (req, res) => {
  try {
    const isConnected = await testDatabaseConnection();
    res.json({ 
      connected: isConnected,
      timestamp: new Date().toISOString(),
      host: process.env.DATABASE_HOST || 'localhost',
      database: process.env.DATABASE_NAME || 'agiesfl_security'
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
    
    // Initialize database
    console.log('\n📊 Database Setup:');
    await initializeDatabase();
    
    // Test connection and seed if needed
    const dbConnected = await testDatabaseConnection();
    if (dbConnected) {
      console.log('🌱 Seeding database with initial data...');
      await seedDatabase();
      console.log('✅ Database seeded successfully');
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
        database: 'connected',
        version: '1.0.0'
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
    
    const port = process.env.PORT || 5000;
    server.listen(port, '0.0.0.0', () => {
      console.log(`\n🎉 AgiesFL Server running on port ${port}`);
      console.log(`📱 Web Interface: http://localhost:${port}`);
      console.log(`🔌 WebSocket: ws://localhost:${port}/ws`);
      console.log(`🩺 Health Check: http://localhost:${port}/health`);
      console.log(`🔑 Default Credentials: http://localhost:${port}/api/credentials`);
      console.log('\n✅ Server initialization complete!\n');
    });
    
  } catch (error) {
    console.error('🚨 Server initialization failed:', error);
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

// Initialize the server
initializeServer();
