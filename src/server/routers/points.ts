// ===============================
// 月积分发放机制说明（2026-05-10 优化）
// ===============================
// 核心逻辑：按用户开通日期每月发放，精确到毫秒
//
// 触发条件（同时满足）：
// 1. 会员未过期：endDate > now
// 2. 当月未发放过：!isSameMonth(lastMonthlyReset, now)
// 3. 已过发放日：now >= 本月发放日（含时分秒毫秒）
//
// 示例：
// - 3月10日15:00:00.000开通 → 每月10日15:00:00.000发放
// - 4月10日14:00登录 → 未到发放时间，不发放
// - 4月10日15:00:01登录 → 触发发放
//
// 两个入口：
// - points.getBalance: 用户查余额时触发
// - tts.ensurePointsAccount: 用户使用TTS时触发
// - grantSubscriptionPoints: 订阅激活时直接发放（不依赖刷新判断）
// ===============================

import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import {
	type PointTransactionType,
	pointTransactions,
	systemConfigs,
	userPoints,
} from "@/drizzle/schemas";
import { getUserMembershipInfo, isSameDay, isSameMonth } from "@/lib/shared-utils";
import type { Context } from "../server";
import { adminProcedure, createTRPCRouter, protectedProcedure } from "../server";

// ===============================
// 积分配置辅助函数
// ===============================
async function getPointsConfig(ctx: Context) {
	const configs = await ctx.db
		.select()
		.from(systemConfigs)
		.where(eq(systemConfigs.category, "points"));

	const configMap = new Map(configs.map((c) => [c.key, c.value]));

	return {
		freeDailyPoints: Number(configMap.get("points.dailyFreePoints")) || 1680,
		liteMonthlyPoints: Number(configMap.get("points.liteMonthlyPoints")) || 100000,
		proMonthlyPoints: Number(configMap.get("points.proMonthlyPoints")) || 300000,
	};
}

/**
 * 积分路由
 */
export const pointsRouter = createTRPCRouter({
	/**
	 * 获取用户当前积分余额（使用事务 + FOR UPDATE 防止并发竞态）
	 */
	getBalance: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.userId;
		const now = new Date();

		// 从数据库读取积分配置
		const pointsConfig = await getPointsConfig(ctx);
		const { freeDailyPoints, liteMonthlyPoints, proMonthlyPoints } = pointsConfig;

		// 先查询会员信息（只读，不需要锁）
		const membership = await getUserMembershipInfo(ctx, userId);
		const isSubscribed = Boolean(membership?.membership);
		const planName = membership?.plan?.name || null;
		const planMonthlyPoints: Record<string, number> = {
			lite: liteMonthlyPoints,
			pro: proMonthlyPoints,
		};
		const monthlyPoints =
			isSubscribed && planName ? planMonthlyPoints[planName.toLowerCase()] || 0 : 0;

		// 使用事务确保积分账户创建、每日/每月重置的原子性
		const result = await ctx.db.transaction(async (tx) => {
			// 使用 SELECT ... FOR UPDATE 锁定行
			let [record] = await tx
				.select()
				.from(userPoints)
				.where(eq(userPoints.userId, userId))
				.for("update");

			if (!record) {
				// 创建新的积分记录
				await tx.insert(userPoints).values({
					userId,
					dailyBalance: freeDailyPoints,
					lastDailyResetAt: now,
					monthlyBalance: 0,
					lastMonthlyResetAt: now,
					totalGranted: freeDailyPoints,
					totalConsumed: 0,
					createdAt: now,
					updatedAt: now,
				});

				// 记录积分发放
				await tx.insert(pointTransactions).values({
					userId,
					type: "daily_grant" as PointTransactionType,
					amount: freeDailyPoints,
					balanceBefore: 0,
					balanceAfter: freeDailyPoints,
					description: "每日积分发放（新用户）",
					createdAt: now,
				});

				record = {
					id: "",
					userId,
					dailyBalance: freeDailyPoints,
					lastDailyResetAt: now,
					monthlyBalance: 0,
					lastMonthlyResetAt: now,
					totalGranted: freeDailyPoints,
					totalConsumed: 0,
					createdAt: now,
					updatedAt: now,
				};
			}

			let dailyBalance = record.dailyBalance;
			let monthlyBalance = record.monthlyBalance;

			// 检查每日积分是否需要重置
			const lastDailyReset = record.lastDailyResetAt ? new Date(record.lastDailyResetAt) : null;

			if (!lastDailyReset || !isSameDay(lastDailyReset, now)) {
				dailyBalance = freeDailyPoints;

				await tx
					.update(userPoints)
					.set({
						dailyBalance,
						lastDailyResetAt: now,
						updatedAt: now,
					})
					.where(eq(userPoints.userId, userId));

				await tx.insert(pointTransactions).values({
					userId,
					type: "daily_grant" as PointTransactionType,
					amount: freeDailyPoints,
					balanceBefore: record.dailyBalance + record.monthlyBalance,
					balanceAfter: freeDailyPoints + record.monthlyBalance,
					description: `每日积分刷新（${freeDailyPoints}）`,
					createdAt: now,
				});
			}

			// 检查每月积分是否需要重置（按开通日期每月发放）
			if (monthlyPoints > 0 && membership?.membership?.startDate) {
				const startDate = new Date(membership.membership.startDate);
				const endDate = new Date(membership.membership.endDate);
				const lastMonthlyReset = record.lastMonthlyResetAt
					? new Date(record.lastMonthlyResetAt)
					: null;

				const grantDayOfMonth = startDate.getDate();
				const thisMonthGrantDate = new Date(
					now.getFullYear(),
					now.getMonth(),
					grantDayOfMonth,
					startDate.getHours(),
					startDate.getMinutes(),
					startDate.getSeconds(),
					startDate.getMilliseconds(),
				);
				if (thisMonthGrantDate.getMonth() !== now.getMonth()) {
					thisMonthGrantDate.setDate(0);
				}

				const isSameMonthAsLastReset = lastMonthlyReset && isSameMonth(lastMonthlyReset, now);
				const hasPassedGrantDay = now.getTime() >= thisMonthGrantDate.getTime();
				const shouldRefresh = endDate > now && !isSameMonthAsLastReset && hasPassedGrantDay;

				if (shouldRefresh) {
					monthlyBalance = monthlyPoints;

					await tx
						.update(userPoints)
						.set({
							monthlyBalance,
							lastMonthlyResetAt: now,
							updatedAt: now,
						})
						.where(eq(userPoints.userId, userId));

					await tx.insert(pointTransactions).values({
						userId,
						type: "subscription_grant" as PointTransactionType,
						amount: monthlyPoints,
						balanceBefore: dailyBalance + record.monthlyBalance,
						balanceAfter: dailyBalance + monthlyPoints,
						description: `每月积分刷新（${planName}会员，${monthlyPoints}）`,
						createdAt: now,
					});
				}
			}

			return { dailyBalance, monthlyBalance };
		});

		return {
			dailyBalance: result.dailyBalance,
			monthlyBalance: result.monthlyBalance,
			totalBalance: result.dailyBalance + result.monthlyBalance,
			dailyPoints: freeDailyPoints,
			monthlyPoints,
			isSubscribed,
			planName,
		};
	}),

	/**
	 * 获取积分变动记录
	 */
	getTransactionHistory: protectedProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(100).default(20),
				page: z.number().min(1).default(1),
				type: z.string().optional(),
				startDate: z.date().optional(),
				endDate: z.date().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const userId = ctx.userId;
			const { limit, page, type, startDate, endDate } = input;
			const offset = (page - 1) * limit;

			const conditions = [eq(pointTransactions.userId, userId)];

			if (type) {
				conditions.push(eq(pointTransactions.type, type));
			}

			if (startDate) {
				conditions.push(gte(pointTransactions.createdAt, startDate));
			}

			if (endDate) {
				conditions.push(lte(pointTransactions.createdAt, endDate));
			}

			const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

			const transactions = await ctx.db
				.select()
				.from(pointTransactions)
				.where(whereClause)
				.orderBy(desc(pointTransactions.createdAt))
				.limit(limit)
				.offset(offset);

			const countResult = await ctx.db
				.select({ count: sql<number>`count(*)` })
				.from(pointTransactions)
				.where(whereClause);

			const total = Number(countResult[0]?.count) || 0;

			return {
				transactions,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
					hasMore: offset + transactions.length < total,
				},
			};
		}),

	/**
	 * 订阅激活时发放每月积分（一次性发放到月积分）
	 */
	grantSubscriptionPoints: adminProcedure
		.input(
			z.object({
				userId: z.string(),
				planName: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { userId, planName } = input;
			const now = new Date();

			// 从数据库读取积分配置
			const pointsConfig = await getPointsConfig(ctx);
			const { freeDailyPoints, liteMonthlyPoints, proMonthlyPoints } = pointsConfig;

			const planKey = planName.toLowerCase();
			const planMonthlyPoints: Record<string, number> = {
				lite: liteMonthlyPoints,
				pro: proMonthlyPoints,
			};
			const monthlyPoints = planMonthlyPoints[planKey] || 0;

			if (monthlyPoints === 0) {
				ctx.logger.warn("未知的会员计划，不发放积分", { planName });
				return { success: false, message: "未知的会员计划" };
			}

			// 使用事务确保积分发放的原子性
			await ctx.db.transaction(async (tx) => {
				// 使用 SELECT ... FOR UPDATE 锁定行
				const [record] = await tx
					.select()
					.from(userPoints)
					.where(eq(userPoints.userId, userId))
					.for("update");

				if (!record) {
					await tx.insert(userPoints).values({
						userId,
						dailyBalance: freeDailyPoints,
						lastDailyResetAt: now,
						monthlyBalance: monthlyPoints,
						lastMonthlyResetAt: now,
						totalGranted: freeDailyPoints + monthlyPoints,
						totalConsumed: 0,
						createdAt: now,
						updatedAt: now,
					});

					await tx.insert(pointTransactions).values({
						userId,
						type: "subscription_grant" as PointTransactionType,
						amount: monthlyPoints,
						balanceBefore: freeDailyPoints,
						balanceAfter: freeDailyPoints + monthlyPoints,
						description: `订阅 ${planName} 会员，每月积分（${monthlyPoints}）`,
						createdAt: now,
					});
				} else {
					const newMonthlyBalance = monthlyPoints; // 月积分直接覆盖，不是叠加

					await tx
						.update(userPoints)
						.set({
							monthlyBalance: newMonthlyBalance,
							lastMonthlyResetAt: now,
							totalGranted: record.totalGranted + monthlyPoints,
							updatedAt: now,
						})
						.where(eq(userPoints.userId, userId));

					await tx.insert(pointTransactions).values({
						userId,
						type: "subscription_grant" as PointTransactionType,
						amount: monthlyPoints,
						balanceBefore: record.dailyBalance + record.monthlyBalance,
						balanceAfter: record.dailyBalance + newMonthlyBalance,
						description: `订阅 ${planName} 会员，每月积分刷新（${monthlyPoints}）`,
						createdAt: now,
					});
				}
			});

			ctx.logger.info("订阅月积分发放成功", {
				userId,
				planName,
				monthlyPoints,
			});

			return {
				success: true,
				amount: monthlyPoints,
				message: `获得 ${monthlyPoints} 每月积分`,
			};
		}),

	/**
	 * 管理员：获取任意用户积分信息
	 */
	getUserPoints: adminProcedure
		.input(z.object({ userId: z.string() }))
		.query(async ({ ctx, input }) => {
			const { userId } = input;

			// 从数据库读取积分配置
			const pointsConfig = await getPointsConfig(ctx);
			const { freeDailyPoints, liteMonthlyPoints, proMonthlyPoints } = pointsConfig;

			const pointsRecord = await ctx.db
				.select()
				.from(userPoints)
				.where(eq(userPoints.userId, userId))
				.limit(1);

			const record = pointsRecord[0];

			if (!record) {
				return null;
			}

			const membership = await getUserMembershipInfo(ctx, userId);
			const planMonthlyPoints: Record<string, number> = {
				lite: liteMonthlyPoints,
				pro: proMonthlyPoints,
			};

			return {
				dailyBalance: record.dailyBalance,
				monthlyBalance: record.monthlyBalance,
				totalBalance: record.dailyBalance + record.monthlyBalance,
				dailyPoints: freeDailyPoints,
				monthlyPoints: planMonthlyPoints[membership?.plan?.name?.toLowerCase() || ""] || 0,
				isSubscribed: Boolean(membership?.membership),
				planName: membership?.plan?.name || null,
				lastDailyResetAt: record.lastDailyResetAt,
				lastMonthlyResetAt: record.lastMonthlyResetAt,
				totalGranted: record.totalGranted,
				totalConsumed: record.totalConsumed,
			};
		}),

	/**
	 * 管理员：手动调整用户积分
	 */
	adjustPoints: adminProcedure
		.input(
			z.object({
				userId: z.string(),
				amount: z.number().int(),
				targetType: z.enum(["daily", "monthly", "total"]).default("daily"),
				reason: z.string().min(1, "请填写调整原因"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { userId, amount, targetType, reason } = input;
			const now = new Date();

			// 使用事务确保积分调整的原子性
			const result = await ctx.db.transaction(async (tx) => {
				// 使用 SELECT ... FOR UPDATE 锁定行
				const [record] = await tx
					.select()
					.from(userPoints)
					.where(eq(userPoints.userId, userId))
					.for("update");

				if (!record) {
					if (amount < 0) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "用户积分账户不存在，无法扣除积分",
						});
					}

					// 创建新记录
					await tx.insert(userPoints).values({
						userId,
						dailyBalance: targetType === "monthly" ? 0 : amount,
						lastDailyResetAt: now,
						monthlyBalance: targetType === "daily" ? 0 : amount,
						lastMonthlyResetAt: now,
						totalGranted: amount,
						totalConsumed: 0,
						createdAt: now,
						updatedAt: now,
					});

					await tx.insert(pointTransactions).values({
						userId,
						type: "admin_grant",
						amount,
						balanceBefore: 0,
						balanceAfter: amount,
						description: `[管理员] ${reason}`,
						createdAt: now,
					});

					return {
						newDailyBalance: targetType === "monthly" ? 0 : amount,
						newMonthlyBalance: targetType === "daily" ? 0 : amount,
					};
				}

				let newDailyBalance = record.dailyBalance;
				let newMonthlyBalance = record.monthlyBalance;

				if (targetType === "daily") {
					newDailyBalance += amount;
				} else if (targetType === "monthly") {
					newMonthlyBalance += amount;
				} else {
					// 按比例分配
					const ratio =
						record.dailyBalance + record.monthlyBalance > 0
							? record.dailyBalance / (record.dailyBalance + record.monthlyBalance)
							: 0.5;
					newDailyBalance += Math.round(amount * ratio);
					newMonthlyBalance += amount - Math.round(amount * ratio);
				}

				if (newDailyBalance < 0 || newMonthlyBalance < 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "积分不能为负数",
					});
				}

				await tx
					.update(userPoints)
					.set({
						dailyBalance: newDailyBalance,
						monthlyBalance: newMonthlyBalance,
						totalGranted: amount > 0 ? record.totalGranted + amount : record.totalGranted,
						totalConsumed:
							amount < 0 ? record.totalConsumed + Math.abs(amount) : record.totalConsumed,
						updatedAt: now,
					})
					.where(eq(userPoints.userId, userId));

				await tx.insert(pointTransactions).values({
					userId,
					type: amount > 0 ? "admin_grant" : "admin_deduct",
					amount,
					balanceBefore: record.dailyBalance + record.monthlyBalance,
					balanceAfter: newDailyBalance + newMonthlyBalance,
					description: `[管理员] ${reason}`,
					createdAt: now,
				});

				return { newDailyBalance, newMonthlyBalance };
			});

			ctx.logger.info("管理员调整用户积分", {
				adminId: ctx.userId,
				userId,
				amount,
				targetType,
				reason,
				newDailyBalance: result.newDailyBalance,
				newMonthlyBalance: result.newMonthlyBalance,
			});

			return {
				success: true,
				amount,
				newTotalBalance: result.newDailyBalance + result.newMonthlyBalance,
				newDailyBalance: result.newDailyBalance,
				newMonthlyBalance: result.newMonthlyBalance,
				message: `调整积分成功`,
			};
		}),

	/**
	 * 获取用户使用统计（今日/本月TTS使用次数）
	 */
	getUsageStats: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.userId;
		const now = new Date();

		// 今日开始时间
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

		// 本月开始时间
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

		// 统计今日TTS使用次数
		const todayUsageResult = await ctx.db
			.select({ count: sql<number>`count(*)` })
			.from(pointTransactions)
			.where(
				and(
					eq(pointTransactions.userId, userId),
					eq(pointTransactions.type, "tts_consume"),
					gte(pointTransactions.createdAt, todayStart),
				),
			);

		// 统计本月TTS使用次数
		const monthUsageResult = await ctx.db
			.select({ count: sql<number>`count(*)` })
			.from(pointTransactions)
			.where(
				and(
					eq(pointTransactions.userId, userId),
					eq(pointTransactions.type, "tts_consume"),
					gte(pointTransactions.createdAt, monthStart),
				),
			);

		// 统计今日消耗积分
		const todayPointsResult = await ctx.db
			.select({ total: sql<number>`coalesce(sum(abs(amount)), 0)` })
			.from(pointTransactions)
			.where(
				and(
					eq(pointTransactions.userId, userId),
					eq(pointTransactions.type, "tts_consume"),
					gte(pointTransactions.createdAt, todayStart),
				),
			);

		// 统计本月消耗积分
		const monthPointsResult = await ctx.db
			.select({ total: sql<number>`coalesce(sum(abs(amount)), 0)` })
			.from(pointTransactions)
			.where(
				and(
					eq(pointTransactions.userId, userId),
					eq(pointTransactions.type, "tts_consume"),
					gte(pointTransactions.createdAt, monthStart),
				),
			);

		return {
			todayUsageCount: Number(todayUsageResult[0]?.count) || 0,
			monthUsageCount: Number(monthUsageResult[0]?.count) || 0,
			todayPointsUsed: Number(todayPointsResult[0]?.total) || 0,
			monthPointsUsed: Number(monthPointsResult[0]?.total) || 0,
		};
	}),
});

export type PointsRouter = typeof pointsRouter;
