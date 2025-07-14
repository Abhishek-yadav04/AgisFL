import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Local PostgreSQL connection
const connectionString = process.env.DATABASE_URL || 
  `postgresql://db_user:admin@localhost:5432/mydatabase`;

const poolConfig = {
    connectionString: connectionString,
};

const pool = new Pool(poolConfig);

export const db = drizzle(pool, { schema });