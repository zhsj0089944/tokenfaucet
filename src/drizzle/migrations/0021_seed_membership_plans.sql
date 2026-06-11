-- ============================================
-- 会员计划种子数据 + 积分配置
-- 用户指定定价（来自项目情况说明书）：
--   Free: 0元, 每日1680积分
--   Lite: $4.99/月, $48/年, 1680积分/天 + 100,000积分/月
--   Pro: $16.89/月, $156.98/年, 1680积分/天 + 300,000积分/月
-- ============================================

-- 1. 插入会员计划
INSERT INTO "membership_plans" (
  "name", "name_zh", "description", "description_zh",
  "price_usd_monthly",
  "price_usd_yearly",
  "yearly_discount_percent",
  "stripe_price_id_usd_monthly",
  "stripe_price_id_usd_yearly",
  "features", "features_zh",
  "max_api_calls",
  "permissions",
  "monthly_duration_days", "yearly_duration_days",
  "is_active", "is_popular", "sort_order"
) VALUES
(
  'Free', '免费版',
  'Perfect for getting started with TTS',
  '适合入门，每日自动获得1680积分',
  '0',
  '0',
  0,
  NULL, NULL,
  '["1,680 daily points (limited time for all users!)","Basic voice library (5 voices)","Chinese & English support","Unlock exclusive voices by inviting 3 friends","Voice cloning"]'::jsonb,
  '["每日1,680积分（限时全员享用！）","基础音色库（5款音色）","支持中英文","邀请3位好友解锁限定音色","声音复刻"]'::jsonb,
  -1,
  '{"apiAccess":false,"customModels":false,"prioritySupport":false,"exportData":true,"bulkOperations":false,"advancedAnalytics":false}'::jsonb,
  30, 365,
  true, false, 0
),
(
  'Lite', 'Lite 入门版',
  'For casual users who need more credits',
  '轻度使用者首选，每日1680积分 + 每月100,000额外积分',
  '4.99',
  '48',
  20,
  NULL, NULL,
  '["1,680 daily + 100,000 monthly bonus points","Full voice library (7 voices)","👑 Exclusive English voices for subscribers","Voice cloning","Commercial license","Email support","40 languages"]'::jsonb,
  '["每日1,680积分 + 每月100,000额外积分","全部音色库（7款音色）","👑 含订阅专享英文音色","声音复刻","商业授权","Email支持","40种语言"]'::jsonb,
  -1,
  '{"apiAccess":false,"customModels":false,"prioritySupport":false,"exportData":true,"bulkOperations":false,"advancedAnalytics":false}'::jsonb,
  30, 365,
  true, true, 1
),
(
  'Pro', 'Pro 专业版',
  'For professionals and power users',
  '专业用户首选，无限创作，每日1680积分 + 每月300,000额外积分',
  '16.89',
  '156.98',
  35,
  NULL, NULL,
  '["1,680 daily + 300,000 monthly bonus points","Full voice library (7 voices)","👑 Exclusive English voices for subscribers","Voice cloning","Commercial license","Priority queue","Dedicated support","40 languages"]'::jsonb,
  '["每日1,680积分 + 每月300,000额外积分","全部音色库（7款音色）","👑 含订阅专享英文音色","声音复刻","商业授权","队列优先","专属客服","40种语言"]'::jsonb,
  -1,
  '{"apiAccess":true,"customModels":false,"prioritySupport":true,"exportData":true,"bulkOperations":true,"advancedAnalytics":true}'::jsonb,
  30, 365,
  true, false, 2
);

-- 2. 插入积分配置
-- Free计划: 无月积分，每日1680积分
INSERT INTO "membership_point_configs" ("plan_id", "monthly_points", "daily_bonus", "is_active")
SELECT id, 0, 1680, true FROM "membership_plans" WHERE "name" = 'Free';

-- Lite计划: 每月100,000积分，每日1680积分
INSERT INTO "membership_point_configs" ("plan_id", "monthly_points", "daily_bonus", "is_active")
SELECT id, 100000, 1680, true FROM "membership_plans" WHERE "name" = 'Lite';

-- Pro计划: 每月300,000积分，每日1680积分
INSERT INTO "membership_point_configs" ("plan_id", "monthly_points", "daily_bonus", "is_active")
SELECT id, 300000, 1680, true FROM "membership_plans" WHERE "name" = 'Pro';
