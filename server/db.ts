import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Local PostgreSQL connection
const connectionConfig = {
  host: 'localhost',
  port: 5432,
  database: 'mydatabase',
  user: 'db_user',
  password: 'admin',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(connectionConfig);
export const db = drizzle(pool, { schema });