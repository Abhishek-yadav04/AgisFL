import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "5432"),
    user: process.env.DATABASE_USER || "agiesfl_admin",
    password: process.env.DATABASE_PASSWORD || "SecurePass123!",
    database: process.env.DATABASE_NAME || "agiesfl_security",
  },
});
