-- ============================================
-- 积分系统数据库迁移
-- ============================================
-- 运行方式: pnpm db:push 或手动执行

-- 1. 用户积分余额表（重构）
CREATE TABLE IF NOT EXISTS "user_points" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar(255) NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,

  -- 每日积分（每天刷新，重置为1680）
  "daily_balance" integer NOT NULL DEFAULT 1680,
  "last_daily_reset_at" timestamp DEFAULT NOW(),

  -- 每月积分（订阅用户专有，每月刷新）
  "monthly_balance" integer NOT NULL DEFAULT 0,
  "last_monthly_reset_at" timestamp DEFAULT NOW(),

  -- 累计统计
  "total_granted" integer NOT NULL DEFAULT 0,
  "total_consumed" integer NOT NULL DEFAULT 0,

  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "user_points_user_id_idx" ON "user_points"("user_id");
CREATE INDEX IF NOT EXISTS "user_points_daily_balance_idx" ON "user_points"("daily_balance");

-- 2. 积分变动记录表
CREATE TABLE IF NOT EXISTS "point_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar(255) NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "type" varchar(50) NOT NULL,
  "amount" integer NOT NULL,
  "balance_before" integer NOT NULL,
  "balance_after" integer NOT NULL,
  "business_id" varchar(255),
  "description" text,
  "expired_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "point_transactions_user_id_idx" ON "point_transactions"("user_id");
CREATE INDEX IF NOT EXISTS "point_transactions_type_idx" ON "point_transactions"("type");
CREATE INDEX IF NOT EXISTS "point_transactions_created_at_idx" ON "point_transactions"("created_at");
CREATE INDEX IF NOT EXISTS "point_transactions_business_id_idx" ON "point_transactions"("business_id");

-- 3. 会员计划积分配置表
CREATE TABLE IF NOT EXISTS "membership_point_configs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "plan_id" uuid NOT NULL REFERENCES "membership_plans"("id") ON DELETE CASCADE,
  "monthly_points" integer NOT NULL DEFAULT 0,
  "daily_bonus" integer NOT NULL DEFAULT 0,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "membership_point_configs_plan_id_idx" ON "membership_point_configs"("plan_id");

-- ============================================
-- 积分系统说明
-- ============================================
--
-- 【积分规则】
-- 1. 每日积分（所有用户）
--    - 每天发放 1680 积分
--    - 每天重置为 1680（不是叠加）
--    - 优先使用：消耗时先扣每日积分
--    - 用不完第二天也是 1680
--
-- 2. 每月积分（订阅用户专有）
--    - Lite 订阅：每月 100,000 积分
--    - Pro 订阅：每月 300,000 积分
--    - 每月刷新，订阅时一次性发放
--    - 没用完的会在第二个月清零
--
-- 3. 使用顺序
--    - 优先使用日积分（日积分用完才用月积分）
--    - 日积分第二天补回
--    - 月积分每月清零后自动补新的
--
-- 4. TTS 消耗规则
--    - 汉字：每字 3 积分
--    - 字母：每字母 2.5 积分
--    - 标点符号：每个 0.5 积分
--
-- 【积分变动类型】
-- - daily_grant: 每日发放/刷新
-- - subscription_grant: 订阅每月积分
-- - tts_consume: TTS消耗
-- - refund: 退款
-- - admin_grant: 管理员赠送
-- - admin_deduct: 管理员扣除
-- - expire: 过期清零
-- - other: 其他
--
-- 【API 端点】
-- - POST /api/points/daily-grant - 手动触发每日积分发放（需要 CRON_SECRET）
-- - GET /api/points/daily-grant - 查询积分发放状态
--
-- 【tRPC 端点】
-- - points.getBalance - 获取积分余额（日积分+月积分分开）
-- - points.getTransactionHistory - 获取积分变动记录
-- - points.grantSubscriptionPoints - 订阅月积分发放
-- - points.getUserPoints - 管理员获取用户积分
-- - points.adjustPoints - 管理员调整积分
--
-- - tts.getPointsBalance - 获取 TTS 相关积分余额
-- - tts.generateTts - 生成 TTS（已集成积分扣减）
--
