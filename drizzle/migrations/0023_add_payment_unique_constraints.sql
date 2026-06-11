-- Migration: 为 payment_records 添加唯一约束，防止重复支付记录
-- Date: 2026-05-06

-- 为 stripe_checkout_session_id 添加唯一约束
ALTER TABLE payment_records
ADD CONSTRAINT payment_records_stripe_checkout_session_id_unique
UNIQUE (stripe_checkout_session_id);

-- 为 stripe_invoice_id 添加唯一约束（允许NULL，多个NULL不冲突）
ALTER TABLE payment_records
ADD CONSTRAINT payment_records_stripe_invoice_id_unique
UNIQUE NULLS NOT DISTINCT (stripe_invoice_id);

-- 为 stripe_payment_intent_id 添加唯一约束（允许NULL）
ALTER TABLE payment_records
ADD CONSTRAINT payment_records_stripe_payment_intent_id_unique
UNIQUE NULLS NOT DISTINCT (stripe_payment_intent_id);
