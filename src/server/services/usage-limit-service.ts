/**
 * 使用限额服务 — 统一限额更新、重置逻辑
 *
 * 统一 tRPC router 和 Webhook handler 中重复的限额操作。
 * 优先使用 plan 表中的字段，缺失时回退到 DEFAULT_USAGE_LIMITS。
 */

import { eq } from "drizzle-orm";
import { DEFAULT_USAGE_LIMITS } from "@/constants/payment";
import { type MembershipPlan, userUsageLimits } from "@/drizzle/schemas";
import type { Database, DatabaseTransaction } from "@/lib/db";
import { logger } from "@/lib/logger";

/** 根据计划名称推测计划类型 */
function inferPlanType(planName: string): keyof typeof DEFAULT_USAGE_LIMITS {
	const name = planName.toLowerCase();
	if (name.includes("enterprise")) return "enterprise";
	if (name.includes("pro")) return "pro";
	if (name.includes("basic")) return "basic";
	return "free";
}

/** 获取计划的限额值 */
function getPlanLimits(plan: MembershipPlan) {
	// 优先使用 plan 表中的 maxApiCalls 字段
	if (plan.maxApiCalls && plan.maxApiCalls > 0) {
		const fallback = DEFAULT_USAGE_LIMITS.free;
		return {
			monthlyUseCases: fallback.monthlyUseCases,
			monthlyTutorials: fallback.monthlyTutorials,
			monthlyApiCalls: plan.maxApiCalls,
		};
	}

	// 回退到 DEFAULT_USAGE_LIMITS
	const planType = inferPlanType(plan.name);
	return {
		monthlyUseCases: DEFAULT_USAGE_LIMITS[planType].monthlyUseCases,
		monthlyTutorials: DEFAULT_USAGE_LIMITS[planType].monthlyTutorials,
		monthlyApiCalls: DEFAULT_USAGE_LIMITS[planType].monthlyApiCalls,
	};
}

/** 更新使用限额参数 */
export interface UpdateUsageLimitsParams {
	userId: string;
	plan: MembershipPlan;
	/** 是否重置已使用量（新订阅/升级时重置） */
	resetUsage?: boolean;
}

/**
 * 更新用户使用限额（使用事务确保原子性）
 * 新订阅时创建记录，已有记录时更新
 */
export async function updateUsageLimits(
	db: Database | DatabaseTransaction,
	params: UpdateUsageLimitsParams,
): Promise<void> {
	const { userId, plan, resetUsage = true } = params;

	const limits = getPlanLimits(plan);

	const now = new Date();
	const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

	// 使用事务确保限额更新的原子性
	await db.transaction(async (tx) => {
		// 使用 SELECT ... FOR UPDATE 锁定行，防止并发更新
		const [existingLimits] = await tx
			.select()
			.from(userUsageLimits)
			.where(eq(userUsageLimits.userId, userId))
			.for("update");

		const limitsData = {
			userId,
			monthlyUseCases: limits.monthlyUseCases,
			monthlyTutorials: limits.monthlyTutorials,
			monthlyApiCalls: limits.monthlyApiCalls,
			currentPeriodStart: now,
			currentPeriodEnd: periodEnd,
			updatedAt: now,
		};

		if (existingLimits) {
			await tx
				.update(userUsageLimits)
				.set({
					...limitsData,
					...(resetUsage ? { usedUseCases: 0, usedTutorials: 0, usedApiCalls: 0 } : {}),
				})
				.where(eq(userUsageLimits.userId, userId));
		} else {
			await tx.insert(userUsageLimits).values({
				...limitsData,
				usedUseCases: 0,
				usedTutorials: 0,
				usedApiCalls: 0,
				createdAt: now,
			});
		}
	});

	logger.info("用户使用限额已更新", { userId, planId: plan.id });
}

/**
 * 重置用户使用限额至默认值（降级时使用）
 */
export async function resetUsageLimits(db: Database, userId: string): Promise<void> {
	const limits = DEFAULT_USAGE_LIMITS.free;
	const now = new Date();
	const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

	await db
		.update(userUsageLimits)
		.set({
			monthlyUseCases: limits.monthlyUseCases,
			monthlyTutorials: limits.monthlyTutorials,
			monthlyApiCalls: limits.monthlyApiCalls,
			usedUseCases: 0,
			usedTutorials: 0,
			usedApiCalls: 0,
			currentPeriodStart: now,
			currentPeriodEnd: periodEnd,
			updatedAt: now,
		})
		.where(eq(userUsageLimits.userId, userId));

	logger.info("用户使用限额已重置", { userId });
}
