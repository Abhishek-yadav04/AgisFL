import express from 'express';
import { createServer } from 'http';
import { serveStatic } from './vite.js';
import { createServer as createAPIServer } from './routes.js';

const app = express();
const port = process.env.PORT || 5000;

// Create HTTP server
const httpServer = createServer(app);

// Setup API routes and services
const apiApp = await createAPIServer();

// Mount API routes
app.use('/api', apiApp);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  serveStatic(app);
} else {
  // In development, just serve a basic status page
  app.get('/', (req, res) => {
    res.json({ 
      status: 'AgisFL Backend Running',
      timestamp: new Date().toISOString(),
      environment: 'development'
    });
  });
}

// Start server
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`🚀 AgisFL Server running on http://0.0.0.0:${port}`);
  console.log(`📊 Dashboard: http://0.0.0.0:${port}`);
  console.log(`🔌 WebSocket: ws://0.0.0.0:${port}/ws`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Received SIGTERM, shutting down gracefully');
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});