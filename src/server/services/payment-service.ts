/**
 * 支付服务 — 支付记录创建与幂等校验
 *
 * 统一 tRPC router 和 Webhook handler 中重复的支付记录相关逻辑。
 */

import { eq } from "drizzle-orm";
import { paymentRecords } from "@/drizzle/schemas";
import type { Database } from "@/lib/db";
import { logger } from "@/lib/logger";

/** 支付记录创建参数 */
export interface CreatePaymentRecordParams {
	userId: string;
	amount: number;
	currency: string;
	status: "pending" | "succeeded" | "failed" | "refunded" | "cancelled";
	paymentMethod: string;
	planName: string;
	durationType: "monthly" | "yearly";
	membershipDurationDays: number;
	creemCheckoutId?: string;
	creemOrderId?: string;
	creemCustomerId?: string;
	creemSubscriptionId?: string;
	metadata?: Record<string, unknown>;
	failedAt?: Date;
	paidAt?: Date;
	description?: string;
}

/**
 * 创建支付记录
 */
export async function createPaymentRecord(
	db: Database,
	params: CreatePaymentRecordParams,
): Promise<void> {
	const record = {
		userId: params.userId,
		amount: params.amount.toString(),
		currency: params.currency.toUpperCase(),
		status: params.status,
		paymentMethod: params.paymentMethod,
		planName: params.planName,
		durationType: params.durationType,
		membershipDurationDays: params.membershipDurationDays,
		creemCheckoutId: params.creemCheckoutId,
		creemOrderId: params.creemOrderId,
		creemCustomerId: params.creemCustomerId,
		creemSubscriptionId: params.creemSubscriptionId,
		metadata: params.metadata,
		failedAt: params.failedAt,
		paidAt: params.paidAt,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	await db.insert(paymentRecords).values(record);

	logger.info("Payment record created", {
		userId: params.userId,
		status: params.status,
		amount: params.amount,
		currency: params.currency,
	});
}

/**
 * 检查 Creem Checkout 是否已处理（幂等校验）
 * @returns true = 已处理（应跳过）
 */
export async function isCreemCheckoutProcessed(db: Database, checkoutId: string): Promise<boolean> {
	const existing = await db.query.paymentRecords.findFirst({
		where: eq(paymentRecords.creemCheckoutId, checkoutId),
	});
	if (existing) {
		logger.info(`Creem checkout ${checkoutId} already processed, skipping`);
		return true;
	}
	return false;
}

/**
 * 检查 Creem Subscription 是否已处理（幂等校验）
 * @returns true = 已处理（应跳过）
 */
export async function isCreemSubscriptionProcessed(
	db: Database,
	subscriptionId: string,
): Promise<boolean> {
	const existing = await db.query.paymentRecords.findFirst({
		where: eq(paymentRecords.creemSubscriptionId, subscriptionId),
	});
	if (existing) {
		logger.info(`Creem subscription ${subscriptionId} already processed, skipping`);
		return true;
	}
	return false;
}

export { paymentRecords };
