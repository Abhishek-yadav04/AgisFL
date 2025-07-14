import express, { type Request, Response } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { logger } from "./logger";
import path from "path";

const app = express();

// Enhanced middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for proper IP handling
app.set('trust proxy', 1);

// Enhanced error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

try {
  // Register API routes and WebSocket
  const server = await registerRoutes(app);

  // Setup Vite or static serving
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = process.env.PORT || 5000;

  server.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server successfully started on port ${PORT}`);
    console.log(`✅ AgiesFL Server running on http://0.0.0.0:${PORT}`);
    console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API Health Check: http://0.0.0.0:${PORT}/health`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      process.exit(0);
    });
  });

} catch (error) {
  logger.error('Failed to start server:', error);
  console.error('❌ Server startup failed:', error);
  process.exit(1);
}