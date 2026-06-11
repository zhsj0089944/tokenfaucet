-- Migration: Remove PayPal fields and indexes
-- This migration removes all PayPal-related fields and indexes from the database

-- 1. Remove PayPal fields from membership_plans
ALTER TABLE membership_plans DROP COLUMN IF EXISTS paypal_monthly_plan_id;
ALTER TABLE membership_plans DROP COLUMN IF EXISTS paypal_yearly_plan_id;

-- 2. Remove PayPal fields and index from user_memberships
DROP INDEX IF EXISTS user_memberships_paypal_subscription_idx;
ALTER TABLE user_memberships DROP COLUMN IF EXISTS paypal_subscription_id;

-- 3. Remove PayPal fields and indexes from payment_records
DROP INDEX IF EXISTS payment_records_paypal_order_idx;
DROP INDEX IF EXISTS payment_records_paypal_capture_idx;
DROP INDEX IF EXISTS payment_records_paypal_subscription_idx;
ALTER TABLE payment_records DROP COLUMN IF EXISTS paypal_order_id;
ALTER TABLE payment_records DROP COLUMN IF EXISTS paypal_capture_id;
ALTER TABLE payment_records DROP COLUMN IF EXISTS paypal_payer_email;
ALTER TABLE payment_records DROP COLUMN IF EXISTS paypal_subscription_id;

-- 4. Add unique index for creemSubscriptionId (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS user_memberships_creem_subscription_idx 
ON user_memberships(creem_subscription_id) 
WHERE creem_subscription_id IS NOT NULL;
