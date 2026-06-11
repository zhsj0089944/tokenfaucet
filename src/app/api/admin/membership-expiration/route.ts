import { and, eq, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { userMemberships, users } from "@/drizzle/schemas";
import { db } from "@/lib/db";
import { sendMembershipExpiredEmail } from "@/lib/email/sender";
import { logger } from "@/lib/logger";

/**
 * 会员过期检查定时任务
 * 可被定时任务调用，如 Vercel Cron 或服务器 cron job
 *
 * 调用示例：
 * POST /api/admin/membership-expiration
 * Header: Authorization: Bearer YOUR_CRON_SECRET
 */
export async function POST(request: Request) {
	// 简单的密钥验证
	const authHeader = request.headers.get("authorization");
	const cronSecret = process.env.CRON_SECRET;

	if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const now = new Date();

		// 查找所有已过期但状态仍为 active 的会员
		const expiredMemberships = await db
			.select({
				membership: userMemberships,
				user: users,
			})
			.from(userMemberships)
			.leftJoin(users, eq(userMemberships.userId, users.id))
			.where(and(eq(userMemberships.status, "active"), lte(userMemberships.endDate, now)));

		const results = {
			totalExpired: expiredMemberships.length,
			processed: 0,
			errors: [] as string[],
		};

		// 处理每个过期会员
		for (const { membership, user } of expiredMemberships) {
			try {
				// 更新会员状态为 expired
				await db
					.update(userMemberships)
					.set({
						status: "expired",
						autoRenew: false,
						updatedAt: now,
					})
					.where(eq(userMemberships.id, membership.id));

				// 发送过期通知邮件（如果用户存在且有邮箱）
				if (user?.email) {
					await sendMembershipExpiredEmail({
						to: user.email,
						username: user.name || user.email,
						planName: membership.planId, // 这里需要查询计划名称，但为了简化先使用 planId
					}).catch((err) => {
						logger.error("发送会员过期邮件失败:", err);
					});
				}

				results.processed++;

				logger.info("会员已过期:", {
					userId: membership.userId,
					membershipId: membership.id,
					endDate: membership.endDate,
				});
			} catch (err) {
				const errorMsg = `处理会员 ${membership.id} 失败: ${err}`;
				results.errors.push(errorMsg);
				logger.error(errorMsg);
			}
		}

		return NextResponse.json({
			success: true,
			message: "会员过期检查完成",
			executedAt: now.toISOString(),
			results,
		});
	} catch (error) {
		logger.error("会员过期检查失败:", error as Error);
		return NextResponse.json({ error: "会员过期检查失败" }, { status: 500 });
	}
}

/**
 * 获取会员过期检查配置的 GET 接口
 */
export async function GET(request: Request) {
	const authHeader = request.headers.get("authorization");
	const cronSecret = process.env.CRON_SECRET;

	if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	return NextResponse.json({
		config: {
			description: "检查并处理过期的会员",
			schedule: "建议每小时执行一次",
		},
		endpoint: "POST /api/admin/membership-expiration",
	});
}
