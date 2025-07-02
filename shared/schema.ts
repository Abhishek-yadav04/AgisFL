import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("analyst"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  incidentId: varchar("incident_id", { length: 50 }).notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // Critical, High, Medium, Low
  type: text("type").notNull(), // Malware Detection, Network Intrusion, etc.
  status: text("status").notNull().default("open"), // open, investigating, analyzing, resolved, closed
  assigneeId: integer("assignee_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  metadata: jsonb("metadata"), // Additional incident data
  riskScore: decimal("risk_score", { precision: 5, scale: 2 }),
});

export const threats = pgTable("threats", {
  id: serial("id").primaryKey(),
  threatId: varchar("threat_id", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(), // malware, phishing, intrusion, etc.
  severity: text("severity").notNull(),
  description: text("description"),
  sourceIp: text("source_ip"),
  targetIp: text("target_ip"),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  metadata: jsonb("metadata"),
});

export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  metricType: text("metric_type").notNull(), // cpu, memory, network, etc.
  component: text("component").notNull(), // AI Detection Engine, Data Pipeline, etc.
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  status: text("status").notNull().default("normal"), // normal, warning, critical
});

export const aiInsights = pgTable("ai_insights", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // threat_intelligence, correlation, prediction
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

export const attackPaths = pgTable("attack_paths", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sourceNode: text("source_node").notNull(),
  targetNode: text("target_node").notNull(),
  pathData: jsonb("path_data").notNull(), // Graph structure data
  riskLevel: text("risk_level").notNull(),
  compromisedAssets: integer("compromised_assets").default(0),
  attackVectors: integer("attack_vectors").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  incidents: many(incidents),
}));

export const incidentsRelations = relations(incidents, ({ one }) => ({
  assignee: one(users, {
    fields: [incidents.assigneeId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertIncidentSchema = createInsertSchema(incidents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertThreatSchema = createInsertSchema(threats).omit({
  id: true,
  detectedAt: true,
});

export const insertSystemMetricSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  timestamp: true,
});

export const insertAiInsightSchema = createInsertSchema(aiInsights).omit({
  id: true,
  createdAt: true,
});

export const insertAttackPathSchema = createInsertSchema(attackPaths).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Threat = typeof threats.$inferSelect;
export type InsertThreat = z.infer<typeof insertThreatSchema>;
export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InsertSystemMetric = z.infer<typeof insertSystemMetricSchema>;
export type AiInsight = typeof aiInsights.$inferSelect;
export type InsertAiInsight = z.infer<typeof insertAiInsightSchema>;
export type AttackPath = typeof attackPaths.$inferSelect;
export type InsertAttackPath = z.infer<typeof insertAttackPathSchema>;
