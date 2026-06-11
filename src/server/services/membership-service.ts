/**
 * 会员服务 — 会员激活、取消、状态管理
 *
 * 统一 tRPC router 和 Webhook handler 中重复的会员操作逻辑。
 * 所有函数接受 db 实例作为参数，不依赖请求上下文。
 */

import { eq } from "drizzle-orm";
import { membershipPlans, userMemberships } from "@/drizzle/schemas";
import type { Database } from "@/lib/db";
import { logger } from "@/lib/logger";
import { updateUsageLimits } from "./usage-limit-service";

/** 会员激活参数 */
export interface ActivateMembershipParams {
	userId: string;
	planId: string;
	paymentIntentId: string;
	amount: number;
	currency: string;
	paymentMethod: string;
	durationDays: number;
	/** 是否自动续费（仅月度订阅默认开启） */
	autoRenew?: boolean;
	/** Creem 订阅 ID */
	creemSubscriptionId?: string;
	/** Creem 客户 ID */
	creemCustomerId?: string;
}

/** 激活或续期用户会员（使用事务确保原子性） */
export async function activateMembership(
	db: Database,
	params: ActivateMembershipParams,
): Promise<void> {
	const {
		userId,
		planId,
		paymentIntentId: _paymentIntentId,
		amount,
		currency,
		paymentMethod,
		durationDays,
		autoRenew = durationDays <= 31,
		creemSubscriptionId,
		creemCustomerId,
	} = params;

	const now = new Date();
	const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
	const durationType = durationDays >= 365 ? "yearly" : "monthly";

	// 使用事务确保会员激活的原子性
	await db.transaction(async (tx) => {
		// 使用 SELECT ... FOR UPDATE NOWAIT 锁定行，防止并发更新（超时快速失败）
		const [existingMembership] = await tx
			.select()
			.from(userMemberships)
			.where(eq(userMemberships.userId, userId))
			.for("update", { noWait: true });

		const membershipData = {
			planId,
			startDate: now,
			endDate,
			status: "active" as const,
			durationType,
			durationDays,
			purchaseAmount: amount.toString(),
			currency: currency.toUpperCase(),
			paymentMethod,
			updatedAt: now,
			...(creemSubscriptionId ? { creemSubscriptionId } : {}),
			...(creemCustomerId ? { creemCustomerId } : {}),
		};

		if (existingMembership) {
			await tx
				.update(userMemberships)
				.set({
					...membershipData,
					...(autoRenew !== undefined ? { autoRenew } : {}),
				})
				.where(eq(userMemberships.userId, userId));
		} else {
			await tx.insert(userMemberships).values({
				userId,
				...membershipData,
				...(autoRenew !== undefined ? { autoRenew } : {}),
				createdAt: now,
			});
		}

		// 获取计划信息以更新使用限额
		const plan = await tx.query.membershipPlans.findFirst({
			where: eq(membershipPlans.id, planId),
		});

		if (plan) {
			await updateUsageLimits(tx, { userId, plan });
		}
	});

	logger.info("会员激活成功:", {
		userId,
		planId,
		durationDays,
		endDate: endDate.toISOString(),
	});
}

/** 取消会员（立即失效） */
export async function cancelMembership(db: Database, userId: string): Promise<void> {
	await db
		.update(userMemberships)
		.set({
			status: "cancelled",
			autoRenew: false,
			cancelledAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(userMemberships.userId, userId));

	logger.info(`会员已取消: userId=${userId}`);
}

/** 取消自动续费（保留到期访问权） */
export async function cancelAutoRenew(db: Database, userId: string): Promise<void> {
	await db
		.update(userMemberships)
		.set({
			autoRenew: false,
			updatedAt: new Date(),
		})
		.where(eq(userMemberships.userId, userId));

	logger.info(`已取消自动续费: userId=${userId}`);
}
