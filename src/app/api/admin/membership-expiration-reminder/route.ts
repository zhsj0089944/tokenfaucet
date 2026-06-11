import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { membershipPlans, userMemberships, users } from "@/drizzle/schemas";
import { db } from "@/lib/db";
import { sendMembershipExpiringEmail } from "@/lib/email/sender";
import { logger } from "@/lib/logger";

// ===============================
// 到期提醒配置
// ===============================
const REMIND_DAYS_BEFORE = [3, 7];

/**
 * POST /api/admin/membership-expiration-reminder
 * 发送会员到期提醒邮件
 * 可被定时任务调用
 *
 * 调用示例：
 * POST /api/admin/membership-expiration-reminder
 * Header: Authorization: Bearer YOUR_CRON_SECRET
 */
export async function POST(request: Request) {
	const authHeader = request.headers.get("authorization");
	const cronSecret = process.env.CRON_SECRET;

	if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const now = new Date();
		const result = {
			sent: 0,
			skipped: 0,
			failed: 0,
			errors: [] as string[],
		};

		for (const days of REMIND_DAYS_BEFORE) {
			// 计算到期时间窗口
			const targetDate = new Date(now);
			targetDate.setDate(targetDate.getDate() + days);
			const nextDay = new Date(targetDate);
			nextDay.setDate(nextDay.getDate() + 1);

			// 查询即将到期的会员
			const expiringMemberships = await db
				.select({
					membership: userMemberships,
					user: users,
					plan: membershipPlans,
				})
				.from(userMemberships)
				.innerJoin(users, eq(userMemberships.userId, users.id))
				.innerJoin(membershipPlans, eq(userMemberships.planId, membershipPlans.id))
				.where(eq(userMemberships.status, "active"));

			for (const { membership, user, plan } of expiringMemberships) {
				if (!user.email || membership.status !== "active") continue;

				const endDate = new Date(membership.endDate);
				const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

				// 只提醒指定天数前到期的会员
				if (daysLeft === days) {
					try {
						await sendMembershipExpiringEmail({
							to: user.email,
							username: user.name || user.email,
							planName: plan.nameZh || plan.name,
							daysLeft,
						});
						result.sent++;
						logger.info(`会员到期提醒已发送: user=${user.id}, daysLeft=${daysLeft}`);
					} catch (err) {
						result.failed++;
						result.errors.push(
							`用户 ${user.id}: ${err instanceof Error ? err.message : "未知错误"}`,
						);
						logger.error(`发送会员到期提醒失败: user=${user.id}`, err as Error);
					}
				} else if (daysLeft < 0) {
					result.skipped++;
				}
			}
		}

		return NextResponse.json({
			success: true,
			executedAt: now.toISOString(),
			result,
		});
	} catch (error) {
		logger.error("会员到期提醒任务失败:", error as Error);
		return NextResponse.json({ error: "会员到期提醒任务失败" }, { status: 500 });
	}
}

/**
 * GET /api/admin/membership-expiration-reminder
 * 查询即将到期的会员数量
 */
export async function GET(request: Request) {
	const authHeader = request.headers.get("authorization");
	const cronSecret = process.env.CRON_SECRET;

	if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const now = new Date();
		const summary: Record<number, number> = {};

		for (const days of REMIND_DAYS_BEFORE) {
			const targetDate = new Date(now);
			targetDate.setDate(targetDate.getDate() + days);
			const nextDay = new Date(targetDate);
			nextDay.setDate(nextDay.getDate() + 1);

			const expiring = await db
				.select({ id: userMemberships.id, endDate: userMemberships.endDate })
				.from(userMemberships)
				.where(eq(userMemberships.status, "active"));

			// 手动计算每个会员的剩余天数
			let count = 0;
			for (const m of expiring) {
				const endDate = new Date(m.endDate);
				const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
				if (daysLeft === days) count++;
			}

			summary[days] = count;
		}

		return NextResponse.json({
			expiringIn: summary,
			remindDays: REMIND_DAYS_BEFORE,
		});
	} catch {
		return NextResponse.json({ error: "查询失败" }, { status: 500 });
	}
}
