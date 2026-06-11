-- Migration: Add FastSpring payment fields
-- Description: 添加 FastSpring 支付相关的字段

-- Add FastSpring subscription ID to user_memberships
ALTER TABLE "user_memberships" ADD COLUMN IF NOT EXISTS "fastspring_subscription_id" varchar(255);

CREATE INDEX IF NOT EXISTS "user_memberships_fastspring_subscription_idx" ON "user_memberships"("fastspring_subscription_id");

-- Add FastSpring order and subscription ID to payment_records
ALTER TABLE "payment_records" ADD COLUMN IF NOT EXISTS "fastspring_order_id" varchar(255);
ALTER TABLE "payment_records" ADD COLUMN IF NOT EXISTS "fastspring_subscription_id" varchar(255);

CREATE INDEX IF NOT EXISTS "payment_records_fastspring_order_idx" ON "payment_records"("fastspring_order_id");
CREATE INDEX IF NOT EXISTS "payment_records_fastspring_subscription_idx" ON "payment_records"("fastspring_subscription_id");
