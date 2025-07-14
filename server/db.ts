
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema';

// Database configuration with proper error handling
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'agiesfl_security',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

console.log('🔌 Database Configuration:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  password: '***hidden***'
});

// Create connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('🚨 Unexpected database pool error:', err);
});

pool.on('connect', () => {
  console.log('✅ Database client connected');
});

// Initialize Drizzle ORM
export const db = drizzle(pool, { schema });

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    console.log('🔍 Testing database connection...');
    
    // Try to connect and run a simple query
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    client.release();
    
    console.log('✅ Database connection successful!');
    console.log('📅 Current time:', result.rows[0].current_time);
    console.log('🐘 PostgreSQL version:', result.rows[0].pg_version.split(' ')[0]);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        console.error('🚨 Database server is not running or not accessible');
        console.error('💡 Make sure PostgreSQL is running on:', `${dbConfig.host}:${dbConfig.port}`);
      } else if (error.message.includes('authentication failed')) {
        console.error('🔐 Authentication failed - check username and password');
      } else if (error.message.includes('database') && error.message.includes('does not exist')) {
        console.error('🗄️ Database does not exist - check database name');
      }
    }
    
    return false;
  }
}

/**
 * Initialize database connection and test it
 */
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('🚀 Initializing database connection...');
    
    const isConnected = await testDatabaseConnection();
    
    if (!isConnected) {
      console.warn('⚠️ Database connection failed, but server will continue with limited functionality');
      return;
    }
    
    // Test basic table access
    try {
      await db.select().from(schema.users).limit(1);
      console.log('✅ Database schema validation successful');
    } catch (schemaError) {
      console.warn('⚠️ Database schema not ready, you may need to run migrations');
      console.log('💡 Run: npm run db:push');
    }
    
  } catch (error) {
    console.error('🚨 Database initialization error:', error);
  }
}

/**
 * Graceful shutdown
 */
export async function closeDatabase(): Promise<void> {
  try {
    await pool.end();
    console.log('✅ Database pool closed gracefully');
  } catch (error) {
    console.error('❌ Error closing database pool:', error);
  }
}

// Handle process termination
process.on('SIGINT', closeDatabase);
process.on('SIGTERM', closeDatabase);

export default db;
