-- Add PayPal subscription fields to membership_plans
ALTER TABLE "membership_plans" ADD COLUMN "paypal_monthly_plan_id" varchar(255);
ALTER TABLE "membership_plans" ADD COLUMN "paypal_yearly_plan_id" varchar(255);

-- Add PayPal subscription ID to user_memberships
ALTER TABLE "user_memberships" ADD COLUMN "paypal_subscription_id" varchar(255);
CREATE INDEX "user_memberships_paypal_subscription_idx" ON "user_memberships" USING btree ("paypal_subscription_id");

-- Add PayPal subscription ID to payment_records
ALTER TABLE "payment_records" ADD COLUMN "paypal_subscription_id" varchar(255);
CREATE INDEX "payment_records_paypal_subscription_idx" ON "payment_records" USING btree ("paypal_subscription_id");
