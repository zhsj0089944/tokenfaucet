-- 将 paypalSubscriptionId 改为唯一索引，防止同一订阅绑定多个用户
DROP INDEX IF EXISTS "user_memberships_paypal_subscription_idx";
CREATE UNIQUE INDEX "user_memberships_paypal_subscription_idx" ON "user_memberships" USING btree ("paypal_subscription_id");
