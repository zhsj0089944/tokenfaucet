import { and, eq, gte, lt } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { systemConfigs, users } from "@/drizzle/schemas";
import type { PointTransactionType } from "@/drizzle/schemas/points";
import { pointTransactions, userPoints } from "@/drizzle/schemas/points";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { isSameDay } from "@/lib/shared-utils";

/**
 * 为单个用户发放每日积分（使用事务确保原子性）
 */
async function grantDailyPointsToUser(userId: string, freeDailyPoints: number, now: Date) {
	// 使用事务确保积分重置的原子性
	await db.transaction(async (tx) => {
		// 使用 SELECT ... FOR UPDATE 锁定行，防止并发更新
		const [existingRecord] = await tx
			.select()
			.from(userPoints)
			.where(eq(userPoints.userId, userId))
			.for("update");

		// 检查今日是否已发放
		if (existingRecord) {
			const lastGrant = existingRecord.lastDailyResetAt
				? new Date(existingRecord.lastDailyResetAt)
				: null;

			if (lastGrant && isSameDay(lastGrant, now)) {
				// 今日已发放，跳过
				return;
			}

			// 原子更新每日积分
			await tx
				.update(userPoints)
				.set({
					dailyBalance: freeDailyPoints,
					lastDailyResetAt: now,
					updatedAt: now,
				})
				.where(eq(userPoints.userId, userId));

			// 记录积分变动
			await tx.insert(pointTransactions).values({
				userId,
				type: "daily_grant" as PointTransactionType,
				amount: freeDailyPoints,
				balanceBefore: existingRecord.dailyBalance + existingRecord.monthlyBalance,
				balanceAfter: freeDailyPoints + existingRecord.monthlyBalance,
				description: `每日积分刷新（${freeDailyPoints}）`,
				createdAt: now,
			});
		} else {
			// 创建新记录
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

			// 记录积分变动
			await tx.insert(pointTransactions).values({
				userId,
				type: "daily_grant" as PointTransactionType,
				amount: freeDailyPoints,
				balanceBefore: 0,
				balanceAfter: freeDailyPoints,
				description: "每日积分发放（新用户）",
				createdAt: now,
			});
		}
	});
}

// ===============================
// 积分配置辅助函数
// ===============================
async function getFreeDailyPoints(): Promise<number> {
	const configs = await db.select().from(systemConfigs).where(eq(systemConfigs.category, "points"));

	const configMap = new Map(configs.map((c) => [c.key, c.value]));
	return Number(configMap.get("points.dailyFreePoints")) || 1680;
}

/**
 * POST /api/points/daily-grant
 * 手动触发每日积分发放（所有用户每日1680积分）
 */
export async function POST(request: NextRequest) {
	try {
		const authHeader = request.headers.get("authorization");
		const cronSecret = process.env.CRON_SECRET;

		if (!cronSecret) {
			logger.error("CRON_SECRET environment variable not configured");
			return NextResponse.json({ error: "服务配置错误" }, { status: 500 });
		}

		if (authHeader !== `Bearer ${cronSecret}`) {
			return NextResponse.json({ error: "未授权访问" }, { status: 401 });
		}

		const freeDailyPoints = await getFreeDailyPoints();
		const now = new Date();
		const result = {
			success: 0,
			failed: 0,
			skipped: 0,
			totalPoints: 0,
			errors: [] as string[],
		};

		// 分页处理，防止用户量过大导致内存溢出
		const BATCH_SIZE = 100;
		let offset = 0;
		let hasMore = true;

		while (hasMore) {
			const batchUsers = await db.select().from(users).limit(BATCH_SIZE).offset(offset);
			if (batchUsers.length === 0) {
				hasMore = false;
				break;
			}
			offset += batchUsers.length;

			for (const user of batchUsers) {
				try {
					await grantDailyPointsToUser(user.id, freeDailyPoints, now);
					result.success++;
					result.totalPoints += freeDailyPoints;
				} catch (error) {
					result.failed++;
					result.errors.push(
						`用户 ${user.id}: ${error instanceof Error ? error.message : "未知错误"}`,
					);
				}
			}
		}

		logger.info("Daily points grant completed", result);

		return NextResponse.json({
			...result,
			success: true,
			message: `成功发放 ${result.success} 用户，跳过 ${result.skipped} 用户，失败 ${result.failed} 用户`,
		});
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		logger.error("Daily points grant failed", err);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "积分发放失败" },
			{ status: 500 },
		);
	}
}

/**
 * GET /api/points/daily-grant
 * 查询每日积分发放状态（需要 cron secret）
 */
export async function GET(request: NextRequest) {
	try {
		const authHeader = request.headers.get("authorization");
		const cronSecret = process.env.CRON_SECRET;

		if (!cronSecret) {
			logger.error("CRON_SECRET environment variable not configured (GET)");
			return NextResponse.json({ error: "服务配置错误" }, { status: 500 });
		}

		if (authHeader !== `Bearer ${cronSecret}`) {
			return NextResponse.json({ error: "未授权访问" }, { status: 401 });
		}

		const now = new Date();
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

		const todayRecords = await db
			.select()
			.from(pointTransactions)
			.where(
				and(
					eq(pointTransactions.type, "daily_grant" as PointTransactionType),
					gte(pointTransactions.createdAt, todayStart),
					lt(pointTransactions.createdAt, todayEnd),
				),
			);

		return NextResponse.json({
			date: now.toISOString().split("T")[0],
			totalGrantsToday: todayRecords.length,
			totalPointsToday: todayRecords.reduce((sum, t) => sum + t.amount, 0),
		});
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		logger.error("Query points grant status failed", err);
		return NextResponse.json({ error: "查询失败" }, { status: 500 });
	}
}
