import { and, eq, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { membershipPlans, userMemberships, users } from "@/drizzle/schemas";
import { db } from "@/lib/db";
import { sendMembershipExpiringEmail } from "@/lib/email/sender";
import { logger } from "@/lib/logger";

/**
 * 订阅状态检查定时任务
 * 每天检查即将到期的订阅，发送提醒邮件
 *
 * POST /api/cron/subscription-check
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
		const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

		// 查找即将到期的订阅（3天内）
		const expiringSubscriptions = await db
			.select({
				membership: userMemberships,
				user: users,
				plan: membershipPlans,
			})
			.from(userMemberships)
			.leftJoin(users, eq(userMemberships.userId, users.id))
			.leftJoin(membershipPlans, eq(userMemberships.planId, membershipPlans.id))
			.where(
				and(
					eq(userMemberships.status, "active"),
					eq(userMemberships.autoRenew, true),
					lte(userMemberships.endDate, threeDaysFromNow),
				),
			);

		const results: Array<{
			userId: string;
			action: "checked" | "email_sent" | "error";
			error?: string;
		}> = [];

		for (const { membership, user, plan } of expiringSubscriptions) {
			try {
				// 计算剩余天数
				const endDate = new Date(membership.endDate);
				const daysRemaining = Math.max(
					0,
					Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
				);

				// 发送到期提醒邮件
				if (user?.email && daysRemaining <= 3) {
					await sendMembershipExpiringEmail({
						to: user.email,
						username: user.name || user.email,
						planName: plan?.name || "Unknown Plan",
						daysLeft: daysRemaining,
					}).catch((err) => logger.error("发送到期提醒邮件失败:", err));

					results.push({
						userId: membership.userId,
						action: "email_sent",
					});
				} else {
					results.push({
						userId: membership.userId,
						action: "checked",
					});
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				results.push({
					userId: membership.userId,
					action: "error",
					error: errorMessage,
				});
				logger.error(`Failed to check subscription for user ${membership.userId}:`, error as Error);
			}
		}

		return NextResponse.json({
			success: true,
			checked: results.length,
			results,
		});
	} catch (error) {
		logger.error("Subscription check cron failed:", error as Error);
		return NextResponse.json({ error: "Check failed" }, { status: 500 });
	}
}
