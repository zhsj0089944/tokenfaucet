-- 审计日志表
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" serial PRIMARY KEY,
	"user_id" varchar(255) NOT NULL,
	"user_email" varchar(255),
	"action" varchar(100) NOT NULL,
	"resource" varchar(100),
	"resource_id" varchar(255),
	"details" jsonb,
	"success" boolean DEFAULT true,
	"error_message" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"module" varchar(50),
	"severity" varchar(20) DEFAULT 'INFO',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"context" jsonb
);

CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs" ("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs" ("action");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs" ("created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_severity_idx" ON "audit_logs" ("severity");

-- 配置历史表
CREATE TABLE IF NOT EXISTS "config_history" (
	"id" serial PRIMARY KEY,
	"config_key" varchar(255) NOT NULL,
	"category" varchar(50) NOT NULL,
	"old_value" text,
	"new_value" text NOT NULL,
	"change_type" varchar(20) NOT NULL,
	"changed_by" varchar(255),
	"changed_by_email" varchar(255),
	"change_reason" text,
	"ip_address" varchar(45),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"context" jsonb
);

CREATE INDEX IF NOT EXISTS "config_history_key_idx" ON "config_history" ("config_key");
CREATE INDEX IF NOT EXISTS "config_history_created_at_idx" ON "config_history" ("created_at");

-- 用户表新增字段
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp;