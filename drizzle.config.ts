import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DATABASE_HOST || "0.0.0.0",
    port: parseInt(process.env.DATABASE_PORT || "5432"),
    user: process.env.DATABASE_USER || "db_user",
    password: process.env.DATABASE_PASSWORD || "your_password_here",
    database: process.env.DATABASE_NAME || "mydatabase",
  },
});
