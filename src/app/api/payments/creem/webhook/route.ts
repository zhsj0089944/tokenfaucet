/**
 * Creem Webhook 处理路由
 *
 * 处理 Creem 发送的支付和订阅事件。
 * 事件类型: checkout.completed, subscription.active, subscription.paid,
 *           subscription.canceled, subscription.past_due, subscription.expired,
 *           subscription.scheduled_cancel, refund.created
 */

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { membershipPlans, paymentRecords, userMemberships } from "@/drizzle/schemas";
import { creemAmountToUSD, parseCreemReferenceId, verifyCreemWebhookSignature } from "@/lib/creem";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { activateMembership, cancelMembership } from "@/server/services/membership-service";
import { createPaymentRecord, isCreemCheckoutProcessed } from "@/server/services/payment-service";

// ===============================
// 类型定义
// ===============================

interface CreemCustomer {
	id: string;
	email: string;
	name?: string;
	country?: string;
}

interface CreemProduct {
	id: string;
	name: string;
	price: number;
	currency: string;
	billing_type: string;
	billing_period?: string;
}

interface CreemOrder {
	id: string;
	amount: number;
	currency: string;
	status: string;
	type: string;
}

interface CreemSubscription {
	id: string;
	product: string;
	customer: string;
	status: string;
	collection_method?: string;
	canceled_at?: string | null;
	current_period_start_date?: string;
	current_period_end_date?: string;
	last_transaction_id?: string;
	last_transaction_date?: string;
	next_transaction_date?: string;
	metadata?: Record<string, unknown>;
}

interface CreemWebhookEvent {
	id: string;
	eventType: string;
	created_at: number;
	object: {
		id: string;
		status: string;
		metadata?: Record<string, unknown>;
		order?: CreemOrder;
		product?: CreemProduct;
		customer?: CreemCustomer;
		subscription?: CreemSubscription;
		custom_fields?: unknown[];
		mode?: string;
		collection_method?: string;
		canceled_at?: string | null;
		current_period_start_date?: string;
		current_period_end_date?: string;
		last_transaction_id?: string;
		last_transaction_date?: string;
		next_transaction_date?: string;
	};
}

// ===============================
// Webhook Handler
// ===============================

export async function POST(req: NextRequest) {
	try {
		const body = await req.text();
		const signature = req.headers.get("creem-signature");

		// 1. 验证签名
		if (!verifyCreemWebhookSignature(body, signature)) {
			logger.error("Creem webhook signature verification failed");
			return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
		}

		let event: CreemWebhookEvent;
		try {
			event = JSON.parse(body);
		} catch {
			logger.error("Creem webhook: invalid JSON body");
			return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
		}

		logger.info("Creem webhook received", {
			eventType: event.eventType,
			eventId: event.id,
		});

		// 2. 根据事件类型处理
		switch (event.eventType) {
			case "checkout.completed":
				await handleCheckoutCompleted(event);
				break;

			case "subscription.active":
				// 仅同步用，激活由 checkout.completed 处理
				logger.info("Creem subscription.active event (sync only)", {
					subscriptionId: event.object.id,
				});
				break;

			case "subscription.paid":
				await handleSubscriptionPaid(event);
				break;

			case "subscription.canceled":
				await handleSubscriptionCanceled(event);
				break;

			case "subscription.scheduled_cancel":
				await handleSubscriptionScheduledCancel(event);
				break;

			case "subscription.past_due":
				await handleSubscriptionPastDue(event);
				break;

			case "subscription.expired":
				await handleSubscriptionExpired(event);
				break;

			case "refund.created":
				await handleRefundCreated(event);
				break;

			default:
				logger.info("Creem webhook: unhandled event type", {
					eventType: event.eventType,
				});
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		logger.error("Creem webhook error:", error as Error);
		return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
	}
}

// ===============================
// 事件处理函数
// ===============================

/**
 * 处理 checkout.completed 事件
 * - 首次支付成功（一次性或订阅首笔）
 */
async function handleCheckoutCompleted(event: CreemWebhookEvent) {
	const { object } = event;
	const checkoutId = object.id;
	const order = object.order;
	const product = object.product;
	const customer = object.customer;
	const subscription = object.subscription;
	const metadata = object.metadata;

	// 幂等性检查
	if (await isCreemCheckoutProcessed(db, checkoutId)) {
		logger.info(`Creem checkout ${checkoutId} already processed, skipping`);
		return;
	}

	// 从 metadata 中获取 userId
	const userId = parseCreemReferenceId(metadata);
	if (!userId) {
		logger.error("Creem checkout.completed: missing userId in metadata", undefined, {
			checkoutId,
			metadata,
		});
		return;
	}

	// 从 metadata 中获取 planId 和 durationType
	const planId = (metadata?.planId as string) || "";
	const durationType = (metadata?.durationType as string) || "monthly";

	// 查找计划
	const plan = planId
		? await db.query.membershipPlans.findFirst({
				where: eq(membershipPlans.id, planId),
			})
		: null;

	const planName = plan?.name || product?.name || "Unknown Plan";
	const durationDays = durationType === "yearly" ? 365 : 30;

	// 金额（Creem 以分为单位）
	const amount = order
		? creemAmountToUSD(order.amount)
		: product
			? creemAmountToUSD(product.price)
			: 0;
	const currency = order?.currency || product?.currency || "USD";

	// 判断是否为订阅
	const isSubscription = subscription?.id != null || product?.billing_type === "recurring";

	// 创建支付记录
	await createPaymentRecord(db, {
		userId,
		amount,
		currency,
		status: "succeeded",
		paymentMethod: isSubscription ? "creem_subscription" : "creem",
		planName,
		durationType: durationType as "monthly" | "yearly",
		membershipDurationDays: durationDays,
		creemCheckoutId: checkoutId,
		creemOrderId: order?.id,
		creemCustomerId: customer?.id,
		creemSubscriptionId: subscription?.id,
		paidAt: new Date(),
		metadata: {
			eventId: event.id,
			creemProductId: product?.id,
		},
	});

	// 激活会员
	if (plan) {
		await activateMembership(db, {
			userId,
			planId: plan.id,
			paymentIntentId: checkoutId,
			amount,
			currency,
			paymentMethod: isSubscription ? "creem_subscription" : "creem",
			durationDays,
			autoRenew: isSubscription,
			creemSubscriptionId: subscription?.id,
			creemCustomerId: customer?.id,
		});
	}

	logger.info("Creem checkout completed: membership activated", {
		checkoutId,
		userId,
		planId,
		amount,
		currency,
		isSubscription,
		subscriptionId: subscription?.id,
	});
}

/**
 * 处理 subscription.paid 事件
 * - 订阅续费成功
 */
async function handleSubscriptionPaid(event: CreemWebhookEvent) {
	const { object } = event;
	const subscriptionId = object.id;
	const productId = typeof object.product === "string" ? object.product : object.product?.id;
	const customerId = typeof object.customer === "string" ? object.customer : object.customer?.id;
	const metadata = object.metadata;

	// 幂等性检查（按 transaction ID）
	const transactionId = object.last_transaction_id;
	if (transactionId) {
		const existing = await db.query.paymentRecords.findFirst({
			where: eq(paymentRecords.creemOrderId, transactionId),
		});
		if (existing) {
			logger.info(`Creem transaction ${transactionId} already processed, skipping`);
			return;
		}
	}

	// 从 metadata 或查找用户
	let userId = parseCreemReferenceId(metadata);

	if (!userId && customerId) {
		// 通过 creemCustomerId 查找用户会员记录
		const membership = await db.query.userMemberships.findFirst({
			where: eq(userMemberships.creemCustomerId, customerId),
		});
		userId = membership?.userId || null;
	}

	if (!userId) {
		logger.error("Creem subscription.paid: cannot find userId", undefined, {
			subscriptionId,
			customerId,
			metadata,
		});
		return;
	}

	// 查找计划
	let planId = (metadata?.planId as string) || "";
	let planName = "Unknown Plan";
	let durationDays = 30;
	let amount = 0;

	if (productId) {
		const plan = await db.query.membershipPlans.findFirst({
			where: eq(membershipPlans.creemMonthlyProductId, productId),
		});
		if (!plan) {
			const yearlyPlan = await db.query.membershipPlans.findFirst({
				where: eq(membershipPlans.creemYearlyProductId, productId),
			});
			if (yearlyPlan) {
				planId = yearlyPlan.id;
				planName = yearlyPlan.name;
				durationDays = 365;
				amount = Number(yearlyPlan.priceUSDYearly) || 0;
			}
		} else {
			planId = plan.id;
			planName = plan.name;
			amount = Number(plan.priceUSDMonthly) || 0;
		}
	}

	// 获取当前会员记录以确定 durationType
	const currentMembership = await db.query.userMemberships.findFirst({
		where: eq(userMemberships.userId, userId),
		orderBy: (members, { desc }) => [desc(members.createdAt)],
	});

	const durationType = currentMembership?.durationType || "monthly";

	// 续费会员
	if (planId) {
		await activateMembership(db, {
			userId,
			planId,
			paymentIntentId: transactionId || subscriptionId,
			amount,
			currency: "USD",
			paymentMethod: "creem_subscription",
			durationDays,
			autoRenew: true,
			creemSubscriptionId: subscriptionId,
			creemCustomerId: customerId,
		});
	}

	// 创建支付记录
	await createPaymentRecord(db, {
		userId,
		amount,
		currency: "USD",
		status: "succeeded",
		paymentMethod: "creem_subscription",
		planName,
		durationType: durationType as "monthly" | "yearly",
		membershipDurationDays: durationDays,
		creemCheckoutId: undefined,
		creemOrderId: transactionId,
		creemCustomerId: customerId,
		creemSubscriptionId: subscriptionId,
		paidAt: new Date(),
		description: "Creem subscription renewal",
		metadata: {
			eventId: event.id,
			isRenewal: true,
		},
	});

	logger.info("Creem subscription renewal processed", {
		subscriptionId,
		userId,
		planId,
		transactionId,
	});
}

/**
 * 处理 subscription.canceled 事件
 * - 设置 autoRenew = false，保留用户访问权限直到当前周期结束
 */
async function handleSubscriptionCanceled(event: CreemWebhookEvent) {
	const { object } = event;
	const subscriptionId = object.id;
	const customerId = typeof object.customer === "string" ? object.customer : object.customer?.id;

	// 查找会员记录
	const membership = await db.query.userMemberships.findFirst({
		where: eq(userMemberships.creemSubscriptionId, subscriptionId),
	});

	if (membership) {
		await db
			.update(userMemberships)
			.set({
				autoRenew: false,
				updatedAt: new Date(),
			})
			.where(eq(userMemberships.id, membership.id));
		logger.info("Creem subscription canceled: autoRenew disabled, access until period end", {
			subscriptionId,
			userId: membership.userId,
			endDate: membership.endDate,
		});
	} else if (customerId) {
		const membershipByCustomer = await db.query.userMemberships.findFirst({
			where: eq(userMemberships.creemCustomerId, customerId),
		});
		if (membershipByCustomer) {
			await db
				.update(userMemberships)
				.set({
					autoRenew: false,
					updatedAt: new Date(),
				})
				.where(eq(userMemberships.id, membershipByCustomer.id));
			logger.info("Creem subscription canceled by customerId: autoRenew disabled", {
				subscriptionId,
				userId: membershipByCustomer.userId,
			});
		}
	}
}

/**
 * 处理 subscription.scheduled_cancel 事件
 * - 订阅将在当前周期结束时取消
 */
async function handleSubscriptionScheduledCancel(event: CreemWebhookEvent) {
	const { object } = event;
	const subscriptionId = object.id;

	logger.info("Creem subscription scheduled for cancellation", {
		subscriptionId,
		currentPeriodEnd: object.current_period_end_date,
	});

	// 更新 autoRenew 为 false（保留到周期结束）
	const membership = await db.query.userMemberships.findFirst({
		where: eq(userMemberships.creemSubscriptionId, subscriptionId),
	});

	if (membership) {
		await db
			.update(userMemberships)
			.set({
				autoRenew: false,
				updatedAt: new Date(),
			})
			.where(eq(userMemberships.id, membership.id));
	}
}

/**
 * 处理 subscription.past_due 事件
 * - 订阅支付失败
 */
async function handleSubscriptionPastDue(event: CreemWebhookEvent) {
	const { object } = event;
	const subscriptionId = object.id;

	logger.warn("Creem subscription past due", {
		subscriptionId,
	});

	// Creem 会自动重试，我们只记录日志
	// 如果所有重试都失败，会触发 subscription.canceled
}

/**
 * 处理 subscription.expired 事件
 */
async function handleSubscriptionExpired(event: CreemWebhookEvent) {
	const { object } = event;
	const subscriptionId = object.id;

	const membership = await db.query.userMemberships.findFirst({
		where: eq(userMemberships.creemSubscriptionId, subscriptionId),
	});

	if (membership && membership.status === "active") {
		await cancelMembership(db, membership.userId);
		logger.info("Creem subscription expired: membership deactivated", {
			subscriptionId,
			userId: membership.userId,
		});
	}
}

/**
 * 处理 refund.created 事件
 * - 查找对应的支付记录
 * - 验证退款金额
 * - 更新状态为 refunded
 * - 取消会员
 */
async function handleRefundCreated(event: CreemWebhookEvent) {
	const { object } = event;
	const subscriptionId = object.id;
	const customerId = typeof object.customer === "string" ? object.customer : object.customer?.id;
	const refundAmount = object.order?.amount || 0;

	logger.info("Creem refund.created processing", {
		eventId: event.id,
		subscriptionId,
		customerId,
		refundAmount,
	});

	// 查找对应的支付记录
	const paymentRecord = await db.query.paymentRecords.findFirst({
		where: eq(paymentRecords.creemSubscriptionId, subscriptionId),
		orderBy: (records, { desc }) => [desc(records.createdAt)],
	});

	if (!paymentRecord) {
		logger.error("Creem refund.created: cannot find payment record", undefined, {
			subscriptionId,
			customerId,
		});
		return;
	}

	// 验证退款金额是否与原始支付金额匹配
	const originalAmount = Number(paymentRecord.amount);
	if (refundAmount > 0 && originalAmount > 0 && Math.abs(refundAmount - originalAmount) > 0.01) {
		logger.error("Creem refund.created: amount mismatch", undefined, {
			subscriptionId,
			paymentRecordId: paymentRecord.id,
			originalAmount,
			refundAmount,
		});
		// 金额不匹配仍继续处理，但记录警告
	}

	// 更新支付记录状态为 refunded
	await db
		.update(paymentRecords)
		.set({
			status: "refunded",
			refundAmount: refundAmount.toString(),
			refundedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(paymentRecords.id, paymentRecord.id));

	// 取消会员
	if (paymentRecord.userId) {
		await cancelMembership(db, paymentRecord.userId);
	}

	logger.info("Creem refund processed", {
		subscriptionId,
		paymentRecordId: paymentRecord.id,
		userId: paymentRecord.userId,
		refundAmount,
	});
}
