import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import {
	invitationRecords,
	type PointTransactionType,
	pointTransactions,
	systemConfigs,
	userPoints,
} from "@/drizzle/schemas";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { isSameDay } from "@/lib/shared-utils";

/**
 * 发放积分辅助函数（使用事务确保原子性）
 * 邀请奖励同时计入日积分和月积分，确保在月度消费限制下也能使用
 */
async function grantPoints(userId: string, amount: number, description: string, now: Date) {
	// 从数据库读取配置
	const config = await getInvitationConfig();
	const { dailyFreePoints } = config;

	// 使用事务确保积分更新的原子性
	await db.transaction(async (tx) => {
		const [record] = await tx
			.select()
			.from(userPoints)
			.where(eq(userPoints.userId, userId))
			.for("update");

		if (!record) {
			// 创建新的积分记录（初始每日积分+奖励，日积分和月积分各一半）
			await tx.insert(userPoints).values({
				userId,
				dailyBalance: dailyFreePoints + amount,
				lastDailyResetAt: now,
				monthlyBalance: amount, // 邀请奖励同时计入月积分
				lastMonthlyResetAt: now,
				totalGranted: dailyFreePoints + amount * 2,
				totalConsumed: 0,
				createdAt: now,
				updatedAt: now,
			});

			// 记录积分变动（日积分和月积分各一条记录）
			await tx.insert(pointTransactions).values({
				userId,
				type: "invitation_grant" as PointTransactionType,
				amount,
				balanceBefore: 0,
				balanceAfter: amount,
				description: `邀请计划：${description}（日积分+${amount}）`,
				createdAt: now,
			});

			await tx.insert(pointTransactions).values({
				userId,
				type: "invitation_grant" as PointTransactionType,
				amount,
				balanceBefore: amount,
				balanceAfter: amount * 2,
				description: `邀请计划：${description}（月积分+${amount}）`,
				createdAt: now,
			});
		} else {
			// 原子增加日积分和月积分
			await tx
				.update(userPoints)
				.set({
					dailyBalance: record.dailyBalance + amount,
					monthlyBalance: record.monthlyBalance + amount, // 邀请奖励同时计入月积分
					totalGranted: record.totalGranted + amount * 2,
					updatedAt: now,
				})
				.where(eq(userPoints.userId, userId));

			// 记录积分变动（日积分和月积分各一条记录）
			const balanceBefore = record.dailyBalance + record.monthlyBalance;

			await tx.insert(pointTransactions).values({
				userId,
				type: "invitation_grant" as PointTransactionType,
				amount,
				balanceBefore,
				balanceAfter: balanceBefore + amount,
				description: `邀请计划：${description}（日积分+${amount}）`,
				createdAt: now,
			});

			await tx.insert(pointTransactions).values({
				userId,
				type: "invitation_grant" as PointTransactionType,
				amount,
				balanceBefore: balanceBefore + amount,
				balanceAfter: balanceBefore + amount * 2,
				description: `邀请计划：${description}（月积分+${amount}）`,
				createdAt: now,
			});
		}
	});
}

// ===============================
// 邀请奖励配置辅助函数
// ===============================
async function getInvitationConfig() {
	const configs = await db
		.select()
		.from(systemConfigs)
		.where(eq(systemConfigs.category, "invitation"));

	const configMap = new Map(configs.map((c) => [c.key, c.value]));

	return {
		dailyReward: Number(configMap.get("invitation.dailyReward")) || 500,
		maxDays: Number(configMap.get("invitation.maxDays")) || 5,
		dailyFreePoints: Number(configMap.get("points.dailyFreePoints")) || 1680,
	};
}

/**
 * 判断是否是连续的第二天（距离上次奖励已经过了一天）
 */
function _isNextDay(lastRewardAt: Date, now: Date): boolean {
	const nextDay = new Date(lastRewardAt);
	nextDay.setDate(nextDay.getDate() + 1);
	return isSameDay(nextDay, now) || isSameDay(lastRewardAt, now);
}

/**
 * POST /api/invitation/grant-rewards
 * 发放邀请奖励（每日Cron触发或用户手动触发）
 * 需要 CRON_SECRET 授权
 */
export async function POST(request: NextRequest) {
	try {
		const authHeader = request.headers.get("authorization");
		const cronSecret = process.env.CRON_SECRET;

		if (!cronSecret) {
			logger.error("CRON_SECRET 环境变量未配置");
			return NextResponse.json({ error: "服务配置错误" }, { status: 500 });
		}

		if (authHeader !== `Bearer ${cronSecret}`) {
			return NextResponse.json({ error: "未授权访问" }, { status: 401 });
		}

		const now = new Date();

		// 从数据库读取配置
		const config = await getInvitationConfig();
		const { dailyReward, maxDays } = config;

		const result = {
			success: 0,
			skipped: 0,
			failed: 0,
			totalPoints: 0,
			errors: [] as string[],
		};

		// 获取所有进行中的邀请记录
		const activeRecords = await db
			.select()
			.from(invitationRecords)
			.where(eq(invitationRecords.status, "active"));

		for (const record of activeRecords) {
			try {
				// 检查是否已达到最大奖励天数
				if (record.rewardDaysClaimed >= maxDays) {
					// 更新状态为已完成
					await db
						.update(invitationRecords)
						.set({
							status: "completed",
							updatedAt: now,
						})
						.where(eq(invitationRecords.id, record.id));
					result.skipped++;
					continue;
				}

				// 检查上次奖励时间
				if (record.lastRewardAt) {
					const lastReward = new Date(record.lastRewardAt);
					// 如果今天已经发过，跳过
					if (isSameDay(lastReward, now)) {
						result.skipped++;
						continue;
					}
					// 检查是否是连续第二天（允许1天误差）
					const nextDay = new Date(lastReward);
					nextDay.setDate(nextDay.getDate() + 1);
					const dayDiff = Math.floor(
						(now.getTime() - lastReward.getTime()) / (1000 * 60 * 60 * 24),
					);
					if (dayDiff > 2) {
						// 中断超过2天，重置奖励天数
						await db
							.update(invitationRecords)
							.set({
								rewardDaysClaimed: 0,
								updatedAt: now,
							})
							.where(eq(invitationRecords.id, record.id));
					}
				}

				// 为邀请人发放积分
				await grantPoints(record.inviterId, dailyReward, "邀请奖励", now);

				// 为被邀请人发放积分
				await grantPoints(record.inviteeId, dailyReward, "被邀请奖励", now);

				// 更新邀请记录
				const newRewardCount = record.rewardDaysClaimed + 1;
				const isFirst = record.rewardDaysClaimed === 0;
				const newStatus = newRewardCount >= maxDays ? "completed" : "active";

				await db
					.update(invitationRecords)
					.set({
						rewardDaysClaimed: newRewardCount,
						lastRewardAt: now,
						firstRewardAt: isFirst ? now : record.firstRewardAt,
						status: newStatus,
						updatedAt: now,
					})
					.where(eq(invitationRecords.id, record.id));

				result.success++;
				result.totalPoints += dailyReward * 2;

				logger.info("邀请奖励发放成功", {
					recordId: record.id,
					inviterId: record.inviterId,
					inviteeId: record.inviteeId,
					day: newRewardCount,
					points: dailyReward,
				});
			} catch (error) {
				result.failed++;
				result.errors.push(
					`记录 ${record.id}: ${error instanceof Error ? error.message : "未知错误"}`,
				);
				const errObj = error instanceof Error ? error : new Error(String(error));
				logger.error("邀请奖励发放失败", errObj, {
					context: { recordId: record.id },
				});
			}
		}

		logger.info("邀请奖励发放完成", result);

		return NextResponse.json({
			...result,
			success: true,
			message: `成功发放 ${result.success} 组奖励，跳过 ${result.skipped} 组，失败 ${result.failed} 组`,
		});
	} catch (error) {
		const errObj = error instanceof Error ? error : new Error(String(error));
		logger.error("邀请奖励发放异常", errObj);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "发放失败" },
			{ status: 500 },
		);
	}
}

/**
 * GET /api/invitation/grant-rewards
 * 查询邀请奖励状态（需要 cron secret）
 */
export async function GET(request: NextRequest) {
	try {
		const authHeader = request.headers.get("authorization");
		const cronSecret = process.env.CRON_SECRET;

		if (!cronSecret) {
			return NextResponse.json({ error: "服务配置错误" }, { status: 500 });
		}

		if (authHeader !== `Bearer ${cronSecret}`) {
			return NextResponse.json({ error: "未授权访问" }, { status: 401 });
		}

		const now = new Date();
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

		// 统计今日奖励发放情况
		const todayRewards = await db
			.select()
			.from(pointTransactions)
			.where(eq(pointTransactions.type, "invitation_grant" as PointTransactionType));

		const todayRecords = todayRewards.filter((t) => {
			const createdAt = new Date(t.createdAt);
			return createdAt >= todayStart;
		});

		// 统计进行中的邀请
		const activeRecords = await db
			.select()
			.from(invitationRecords)
			.where(eq(invitationRecords.status, "active"));

		const completedRecords = await db
			.select()
			.from(invitationRecords)
			.where(eq(invitationRecords.status, "completed"));

		return NextResponse.json({
			date: now.toISOString().split("T")[0],
			todayRewardCount: todayRecords.length / 2, // 每组奖励2条（邀请人+被邀请人）
			totalActiveInvitations: activeRecords.length,
			totalCompletedInvitations: completedRecords.length,
			totalRewardsDistributed: todayRecords.reduce((sum, t) => sum + t.amount, 0),
		});
	} catch (error) {
		const errObj = error instanceof Error ? error : new Error(String(error));
		logger.error("查询邀请奖励状态失败", errObj);
		return NextResponse.json({ error: "查询失败" }, { status: 500 });
	}
}
