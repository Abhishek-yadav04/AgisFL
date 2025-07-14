import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, incidents, threats, forensicEvidence, flMetrics } from "../shared/schema";

/**
 * Database connection configuration for AgiesFL Security Platform
 */
const connectionConfig = {
  host: process.env.DATABASE_HOST || '0.0.0.0',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'agiesfl_security',
  ssl: false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false
};

let db: ReturnType<typeof drizzle> | null = null;
let sql: ReturnType<typeof postgres> | null = null;

/**
 * Initialize database connection with proper error handling
 */
export async function initializeDatabase() {
  try {
    console.log('🗄️ Initializing database connection...');
    console.log(`📡 Connecting to: ${connectionConfig.host}:${connectionConfig.port}/${connectionConfig.database}`);

    // Create PostgreSQL connection
    sql = postgres({
      host: connectionConfig.host,
      port: connectionConfig.port,
      username: connectionConfig.username,
      password: connectionConfig.password,
      database: connectionConfig.database,
      ssl: connectionConfig.ssl,
      max: connectionConfig.max,
      idle_timeout: connectionConfig.idle_timeout,
      connect_timeout: connectionConfig.connect_timeout,
      prepare: connectionConfig.prepare
    });

    // Create Drizzle ORM instance
    db = drizzle(sql);

    // Test connection
    await sql`SELECT 1 as test`;
    console.log('✅ Database connection established successfully');

    return db;
  } catch (error) {
    console.log('⚠️ Database connection failed - continuing in mock mode');
    console.log('💡 Error details:', error instanceof Error ? error.message : 'Unknown error');

    // Return null to indicate database is not available
    return null;
  }
}

/**
 * Get database instance (returns null if not connected)
 */
export function getDatabase() {
  return db;
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    if (!sql) {
      return false;
    }

    await sql`SELECT 1 as test`;
    return true;
  } catch (error) {
    console.log('🔍 Database connection test failed:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

/**
 * Close database connection
 */
export async function closeDatabaseConnection() {
  try {
    if (sql) {
      await sql.end();
      console.log('✅ Database connection closed');
    }
  } catch (error) {
    console.log('⚠️ Error closing database connection:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// Export schema for use in other files
export { users, incidents, threats, forensicEvidence, flMetrics };

// Export types
export type Database = NonNullable<typeof db>;