import { eq } from "drizzle-orm";
import { pointTransactions, systemConfigs, userPoints } from "@/drizzle/schemas";
import type { PointTransactionType } from "@/drizzle/schemas/points";
import { getUserMembershipInfo, isSameDay, isSameMonth } from "@/lib/shared-utils";
import type { Context } from "@/server/server";

// 积分配置辅助函数（从数据库读取）
export async function getPointsConfig(ctx: Pick<Context, "db">) {
	const configs = await ctx.db
		.select()
		.from(systemConfigs)
		.where(eq(systemConfigs.category, "points"));

	const configMap = new Map(configs.map((c) => [c.key, c.value]));

	return {
		freeDailyPoints: Number(configMap.get("points.dailyFreePoints")) || 1680,
		liteMonthlyPoints: Number(configMap.get("points.liteMonthlyPoints")) || 100000,
		proMonthlyPoints: Number(configMap.get("points.proMonthlyPoints")) || 300000,
		ttsCostChinese: Number(configMap.get("points.ttsCostChinese")) || 4,
		ttsCostEnglish: Number(configMap.get("points.ttsCostEnglish")) || 2.5,
		ttsCostPunctuation: Number(configMap.get("points.ttsCostPunctuation")) || 0.5,
	};
}

/**
 * 确保用户积分账户存在，并处理每日/每月积分重置
 */
export async function ensurePointsAccount(ctx: Pick<Context, "db" | "logger">, userId: string) {
	const now = new Date();
	const pointsConfig = await getPointsConfig(ctx);
	const freeDailyPoints = pointsConfig.freeDailyPoints;

	let pointsRecord = await ctx.db
		.select()
		.from(userPoints)
		.where(eq(userPoints.userId, userId))
		.limit(1);

	if (pointsRecord.length === 0) {
		// 使用事务确保积分账户创建和记录原子性
		try {
			await ctx.db.transaction(async (tx) => {
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

				await tx.insert(pointTransactions).values({
					userId,
					type: "daily_grant" as PointTransactionType,
					amount: freeDailyPoints,
					balanceBefore: 0,
					balanceAfter: freeDailyPoints,
					description: "每日积分发放（新用户）",
					createdAt: now,
				});
			});
		} catch (error: unknown) {
			// 如果是唯一约束冲突（并发插入），忽略并重新查询
			const pgError = error as { code?: string };
			if (pgError?.code !== "23505") throw error;
			pointsRecord = await ctx.db
				.select()
				.from(userPoints)
				.where(eq(userPoints.userId, userId))
				.limit(1);
		}

		if (pointsRecord.length === 0) {
			return {
				dailyBalance: freeDailyPoints,
				monthlyBalance: 0,
				monthlyPoints: 0,
			};
		}
	}

	const record = pointsRecord[0];
	if (!record) {
		return {
			dailyBalance: freeDailyPoints,
			monthlyBalance: 0,
			monthlyPoints: 0,
		};
	}
	let dailyBalance = record.dailyBalance;
	let monthlyBalance = record.monthlyBalance;

	const lastDailyReset = record.lastDailyResetAt ? new Date(record.lastDailyResetAt) : null;

	if (!lastDailyReset || !isSameDay(lastDailyReset, now)) {
		dailyBalance = freeDailyPoints;

		await ctx.db.transaction(async (tx) => {
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
		});

		ctx.logger.info("用户每日积分已刷新", { userId, dailyBalance });
	}

	const lastMonthlyReset = record.lastMonthlyResetAt ? new Date(record.lastMonthlyResetAt) : null;

	const membership = await getUserMembershipInfo(ctx, userId);
	const isSubscribed =
		membership?.membership?.status === "active" &&
		membership?.membership?.endDate &&
		new Date(membership.membership.endDate) > now;

	const planName = membership?.plan?.name || null;
	const monthlyPoints =
		isSubscribed && planName
			? planName.toLowerCase() === "lite"
				? pointsConfig.liteMonthlyPoints
				: planName.toLowerCase() === "pro"
					? pointsConfig.proMonthlyPoints
					: 0
			: 0;

	if (monthlyPoints > 0 && membership?.membership?.startDate) {
		const startDate = new Date(membership.membership.startDate);
		const endDate = new Date(membership.membership.endDate);

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

			await ctx.db.transaction(async (tx) => {
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
					balanceBefore: dailyBalance + (record?.monthlyBalance || 0),
					balanceAfter: dailyBalance + monthlyPoints,
					description: `每月积分刷新（${planName}会员，${monthlyPoints}）`,
					createdAt: now,
				});
			});

			ctx.logger.info("用户每月积分已刷新", { userId, monthlyBalance, planName });
		}
	}

	return {
		dailyBalance,
		monthlyBalance,
		monthlyPoints,
	};
}
