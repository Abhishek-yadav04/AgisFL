CREATE TABLE "ai_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"severity" text NOT NULL,
	"confidence" numeric(5, 2),
	"data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "attack_paths" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"source_node" text NOT NULL,
	"target_node" text NOT NULL,
	"path_data" jsonb NOT NULL,
	"risk_level" text NOT NULL,
	"compromised_assets" integer DEFAULT 0,
	"attack_vectors" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"incident_id" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"severity" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"assignee_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"metadata" jsonb,
	"risk_score" numeric(5, 2),
	CONSTRAINT "incidents_incident_id_unique" UNIQUE("incident_id")
);
--> statement-breakpoint
CREATE TABLE "system_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"metric_type" text NOT NULL,
	"component" text NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"unit" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'normal' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "threats" (
	"id" serial PRIMARY KEY NOT NULL,
	"threat_id" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"severity" text NOT NULL,
	"description" text,
	"source_ip" text,
	"target_ip" text,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true,
	"confidence" numeric(5, 2),
	"metadata" jsonb,
	CONSTRAINT "threats_threat_id_unique" UNIQUE("threat_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'analyst' NOT NULL,
	"avatar" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;