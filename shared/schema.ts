import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const networkMetrics = pgTable("network_metrics", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  throughput: real("throughput").notNull(),
  packetsPerSecond: integer("packets_per_second").notNull(),
  activeConnections: integer("active_connections").notNull(),
  bytesIn: integer("bytes_in").notNull(),
  bytesOut: integer("bytes_out").notNull(),
});

export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  cpuUsage: real("cpu_usage").notNull(),
  memoryUsage: real("memory_usage").notNull(),
  networkIO: real("network_io").notNull(),
  diskUsage: real("disk_usage").notNull(),
  loadAverage: real("load_average").notNull(),
});

export const threats = pgTable("threats", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  name: text("name").notNull(),
  severity: text("severity").notNull(),
  source: text("source").notNull(),
  destination: text("destination"),
  protocol: text("protocol"),
  description: text("description"),
  status: text("status").default("active").notNull(),
  mitigated: boolean("mitigated").default(false).notNull(),
});

export const packets = pgTable("packets", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  protocol: text("protocol").notNull(),
  source: text("source").notNull(),
  destination: text("destination").notNull(),
  size: integer("size").notNull(),
  flags: text("flags"),
  suspicious: boolean("suspicious").default(false).notNull(),
});

export const flClients = pgTable("fl_clients", {
  id: serial("id").primaryKey(),
  clientId: text("client_id").notNull().unique(),
  status: text("status").notNull(), // active, training, inactive, reconnecting
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
  modelAccuracy: real("model_accuracy"),
  trainingRounds: integer("training_rounds").default(0).notNull(),
  dataContribution: integer("data_contribution").default(0).notNull(),
});

export const flModels = pgTable("fl_models", {
  id: serial("id").primaryKey(),
  version: integer("version").notNull(),
  accuracy: real("accuracy").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  participantCount: integer("participant_count").notNull(),
  trainingRound: integer("training_round").notNull(),
  modelData: jsonb("model_data"),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  type: text("type").notNull(), // critical, warning, info
  title: text("title").notNull(),
  message: text("message").notNull(),
  acknowledged: boolean("acknowledged").default(false).notNull(),
  source: text("source"), // threat-detector, fl-coordinator, system-monitor
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertNetworkMetricsSchema = createInsertSchema(networkMetrics).omit({
  id: true,
  timestamp: true,
});

export const insertSystemMetricsSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  timestamp: true,
});

export const insertThreatSchema = createInsertSchema(threats).omit({
  id: true,
  timestamp: true,
});

export const insertPacketSchema = createInsertSchema(packets).omit({
  id: true,
  timestamp: true,
});

export const insertFLClientSchema = createInsertSchema(flClients).omit({
  id: true,
  lastSeen: true,
});

export const insertFLModelSchema = createInsertSchema(flModels).omit({
  id: true,
  timestamp: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  timestamp: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertNetworkMetrics = z.infer<typeof insertNetworkMetricsSchema>;
export type NetworkMetrics = typeof networkMetrics.$inferSelect;

export type InsertSystemMetrics = z.infer<typeof insertSystemMetricsSchema>;
export type SystemMetrics = typeof systemMetrics.$inferSelect;

export type InsertThreat = z.infer<typeof insertThreatSchema>;
export type Threat = typeof threats.$inferSelect;

export type InsertPacket = z.infer<typeof insertPacketSchema>;
export type Packet = typeof packets.$inferSelect;

export type InsertFLClient = z.infer<typeof insertFLClientSchema>;
export type FLClient = typeof flClients.$inferSelect;

export type InsertFLModel = z.infer<typeof insertFLModelSchema>;
export type FLModel = typeof flModels.$inferSelect;

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;

// Real-time data interfaces
export interface LiveNetworkData {
  throughput: number;
  packetsPerSecond: number;
  activeConnections: number;
  recentPackets: Packet[];
}

export interface LiveSystemData {
  cpuUsage: number;
  memoryUsage: number;
  networkIO: number;
  diskUsage: number;
  loadAverage: number;
  uptime: number;
}

export interface LiveThreatData {
  activeThreats: Threat[];
  blockedAttacks: number;
  falsePositives: number;
  detectionRate: number;
}

export interface LiveFLData {
  activeClients: FLClient[];
  currentModel: FLModel | null;
  trainingRound: number;
  overallAccuracy: number;
  participantCount: number;
}

export interface DashboardData {
  network: LiveNetworkData;
  system: LiveSystemData;
  threats: LiveThreatData;
  fl: LiveFLData;
  recentAlerts: Alert[];
}
