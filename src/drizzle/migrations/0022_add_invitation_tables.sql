-- Migration: Add invitation tables
-- Create invitation codes table
CREATE TABLE IF NOT EXISTS "invitation_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"inviter_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"code" varchar(16) NOT NULL UNIQUE,
	"status" varchar(20) NOT NULL DEFAULT 'active',
	"max_uses" integer NOT NULL DEFAULT 1,
	"used_count" integer NOT NULL DEFAULT 0,
	"expires_at" timestamp,
	"created_at" timestamp NOT NULL DEFAULT now(),
	"updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "invitation_codes_inviter_id_idx" ON "invitation_codes"("inviter_id");
CREATE INDEX IF NOT EXISTS "invitation_codes_code_idx" ON "invitation_codes"("code");
CREATE INDEX IF NOT EXISTS "invitation_codes_status_idx" ON "invitation_codes"("status");

-- Create invitation records table
CREATE TABLE IF NOT EXISTS "invitation_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"inviter_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"invitee_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"code" varchar(16) NOT NULL,
	"status" varchar(20) NOT NULL DEFAULT 'active',
	"reward_days_claimed" integer NOT NULL DEFAULT 0,
	"last_reward_at" timestamp,
	"first_reward_at" timestamp,
	"created_at" timestamp NOT NULL DEFAULT now(),
	"updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "invitation_records_inviter_id_idx" ON "invitation_records"("inviter_id");
CREATE INDEX IF NOT EXISTS "invitation_records_invitee_id_idx" ON "invitation_records"("invitee_id");
CREATE INDEX IF NOT EXISTS "invitation_records_code_idx" ON "invitation_records"("code");
CREATE INDEX IF NOT EXISTS "invitation_records_status_idx" ON "invitation_records"("status");

-- Add invited_by field to user table for tracking referral source
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "invited_by" text REFERENCES "user"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "user_invited_by_idx" ON "user"("invited_by");