/**
 * Creem 支付工具库
 *
 * 封装 Creem API 调用，提供一致的接口。
 * 使用 creem_io TypeScript SDK。
 */

import crypto from "node:crypto";
import { env } from "@/env";
import { logger } from "@/lib/logger";

// Creem SDK 可能在 VM 环境中不可用，使用动态导入
let creemClient: ReturnType<typeof import("creem_io").createCreem> | null = null;

async function getCreemClient() {
	if (creemClient) return creemClient;

	if (!env.CREEM_API_KEY) {
		throw new Error("CREEM_API_KEY is not configured");
	}

	const { createCreem } = await import("creem_io");
	creemClient = createCreem({
		apiKey: env.CREEM_API_KEY,
		testMode: false, // 生产环境
	});

	return creemClient;
}

// ===============================
// Checkout 操作
// ===============================

/**
 * 创建 Creem checkout session
 */
export async function createCreemCheckout(params: {
	productId: string;
	customerEmail?: string;
	customerName?: string;
	successUrl: string;
	referenceId?: string;
	metadata?: Record<string, unknown>;
}) {
	const client = await getCreemClient();

	const checkout = await client.checkouts.create({
		productId: params.productId,
		successUrl: params.successUrl,
		customer: params.customerEmail
			? {
					email: params.customerEmail,
				}
			: undefined,
		metadata: {
			referenceId: params.referenceId ?? null,
			...params.metadata,
		},
	});

	logger.info("Creem checkout created", {
		checkoutId: checkout.id,
		productId: params.productId,
	});

	return checkout;
}

// ===============================
// Webhook 签名验证
// ===============================

/**
 * 验证 Creem webhook 签名
 */
export function verifyCreemWebhookSignature(payload: string, signature: string | null): boolean {
	if (!signature || !env.CREEM_WEBHOOK_SECRET) {
		logger.error("Creem webhook verification failed: missing signature or secret");
		return false;
	}

	const expectedSignature = crypto
		.createHmac("sha256", env.CREEM_WEBHOOK_SECRET)
		.update(payload)
		.digest("hex");

	try {
		const isValid = crypto.timingSafeEqual(
			Buffer.from(signature, "hex"),
			Buffer.from(expectedSignature, "hex"),
		);
		if (!isValid) {
			logger.error("Creem webhook signature mismatch");
		}
		return isValid;
	} catch {
		logger.error("Creem webhook signature comparison failed");
		return false;
	}
}

// ===============================
// Subscription 操作
// ===============================

/**
 * 获取 Creem 订阅详情
 */
export async function getCreemSubscription(subscriptionId: string) {
	const client = await getCreemClient();
	return client.subscriptions.get({ subscriptionId });
}

/**
 * 取消 Creem 订阅
 */
export async function cancelCreemSubscription(subscriptionId: string) {
	const client = await getCreemClient();
	const result = await client.subscriptions.cancel({ subscriptionId });

	logger.info("Creem subscription cancelled", { subscriptionId });

	return result;
}

/**
 * 升级 Creem 订阅（按比例计费）
 */
export async function upgradeCreemSubscription(params: {
	subscriptionId: string;
	productId: string;
	updateBehavior?: "proration-charge-immediately" | "proration-charge" | "proration-none";
}) {
	const client = await getCreemClient();
	const result = await client.subscriptions.upgrade({
		subscriptionId: params.subscriptionId,
		productId: params.productId,
		updateBehavior: params.updateBehavior || "proration-charge-immediately",
	});

	logger.info("Creem subscription upgraded", {
		subscriptionId: params.subscriptionId,
		newProductId: params.productId,
		updateBehavior: params.updateBehavior || "proration-charge-immediately",
	});

	return result;
}

// ===============================
// 辅助函数
// ===============================

/**
 * 从 Creem webhook metadata 中解析 referenceId (userId)
 */
export function parseCreemReferenceId(
	metadata: Record<string, unknown> | null | undefined,
): string | null {
	if (!metadata) return null;
	const ref = metadata.referenceId || metadata.internal_customer_id;
	return typeof ref === "string" ? ref : null;
}

/**
 * 从 Creem 金额（分）转换为美元
 */
export function creemAmountToUSD(amount: number): number {
	return amount / 100;
}

/**
 * 从美元转换为 Creem 金额（分）
 */
export function usdToCreemAmount(usd: number): number {
	return Math.round(usd * 100);
}
