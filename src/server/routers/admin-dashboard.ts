import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import {
	paymentRecords,
	pointTransactions,
	sessions,
	ttsUsageRecords,
	userMemberships,
	userPoints,
	users,
} from "@/drizzle/schemas";
import { adminProcedure, createTRPCRouter } from "../server";

/**
 * 管理后台仪表盘路由
 */
export const adminDashboardRouter = createTRPCRouter({
	/**
	 * 管理后台综合统计数据
	 */
	getAdminDashboardStats: adminProcedure.query(async ({ ctx }) => {
		const now = new Date();
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

		// 积分统计
		let pointsStats = [{ totalGranted: 0, totalConsumed: 0 }];
		try {
			pointsStats = await ctx.db
				.select({
					totalGranted: sql<number>`coalesce(sum(total_granted), 0)`,
					totalConsumed: sql<number>`coalesce(sum(total_consumed), 0)`,
				})
				.from(userPoints);
		} catch {
			// 积分统计查询失败时使用默认值
		}

		// 今日 TTS 生成次数
		let todayTts = [{ count: 0 }];
		try {
			todayTts = await ctx.db
				.select({ count: count() })
				.from(ttsUsageRecords)
				.where(
					and(eq(ttsUsageRecords.isSuccess, true), gte(ttsUsageRecords.createdAt, todayStart)),
				);
		} catch {
			// TTS统计查询失败时使用默认值
		}

		// 总 TTS 生成次数
		let totalTts = [{ count: 0 }];
		try {
			totalTts = await ctx.db
				.select({ count: count() })
				.from(ttsUsageRecords)
				.where(eq(ttsUsageRecords.isSuccess, true));
		} catch {
			// 总TTS统计查询失败时使用默认值
		}

		// 最近注册用户（带 IP/位置/积分）
		let recentUserList: Array<{
			user: typeof users.$inferSelect;
			points: typeof userPoints.$inferSelect | null;
		}> = [];
		try {
			recentUserList = await ctx.db
				.select({
					user: users,
					points: userPoints,
				})
				.from(users)
				.leftJoin(userPoints, eq(users.id, userPoints.userId))
				.orderBy(desc(users.createdAt))
				.limit(8);
		} catch {
			// 最近用户查询失败时使用默认值
			recentUserList = [];
		}

		// 批量获取最近 session（每个用户最新的一个）
		const userIds = recentUserList.map((r) => r.user.id);
		let recentSessions: Array<{
			userId: string;
			ipAddress: string | null;
			location: string | null;
			userAgent: string | null;
		}> = [];
		if (userIds.length > 0) {
			try {
				recentSessions = await ctx.db
					.select({
						userId: sessions.userId,
						ipAddress: sessions.ipAddress,
						location: sessions.location,
						userAgent: sessions.userAgent,
					})
					.from(sessions)
					.where(
						sql`${sessions.userId} IN (${sql.join(
							userIds.map((id: string) => sql`${id}`),
							sql`, `,
						)})`,
					)
					.orderBy(desc(sessions.createdAt));
				// 去重，只保留每个用户最新的 session
				const seen = new Set<string>();
				recentSessions = recentSessions.filter((s) => {
					if (seen.has(s.userId)) return false;
					seen.add(s.userId);
					return true;
				});
			} catch {
				// session 查询失败时不影响整体页面
				recentSessions = [];
			}
		}

		const sessionMap = new Map<
			string,
			{ ipAddress: string | null; location: string | null; userAgent: string | null }
		>(
			recentSessions.map((s) => [
				s.userId,
				{ ipAddress: s.ipAddress, location: s.location, userAgent: s.userAgent },
			]),
		);

		// 最近活动（TTS + 支付 + 积分变动）- 关联 users 表获取邮箱
		let recentTts: Array<{
			type: string;
			userId: string;
			userEmail: string | null;
			detail: string | null;
			createdAt: Date;
		}> = [];
		try {
			recentTts = await ctx.db
				.select({
					type: sql<string>`'tts'`.as("type"),
					userId: ttsUsageRecords.userId,
					userEmail: users.email,
					createdAt: ttsUsageRecords.createdAt,
					detail:
						sql<string>`concat(${ttsUsageRecords.model}, ' - ', ${ttsUsageRecords.textLength}, ' chars')`.as(
							"detail",
						),
				})
				.from(ttsUsageRecords)
				.leftJoin(users, eq(ttsUsageRecords.userId, users.id))
				.where(eq(ttsUsageRecords.isSuccess, true))
				.orderBy(desc(ttsUsageRecords.createdAt))
				.limit(5);
		} catch {
			// TTS活动查询失败时使用默认值
		}

		let recentPayments: Array<{
			type: string;
			userId: string;
			userEmail: string | null;
			createdAt: Date | null;
			detail: string | null;
		}> = [];
		try {
			recentPayments = await ctx.db
				.select({
					type: sql<string>`'payment'`.as("type"),
					userId: paymentRecords.userId,
					userEmail: users.email,
					createdAt: paymentRecords.paidAt,
					detail:
						sql<string>`concat(${paymentRecords.planName}, ' - $', ${paymentRecords.amount})`.as(
							"detail",
						),
				})
				.from(paymentRecords)
				.leftJoin(users, eq(paymentRecords.userId, users.id))
				.where(eq(paymentRecords.status, "succeeded"))
				.orderBy(desc(paymentRecords.paidAt))
				.limit(5);
		} catch {
			// 支付活动查询失败时使用默认值
		}

		let recentPoints: Array<{
			type: string;
			userId: string;
			userEmail: string | null;
			createdAt: Date;
			detail: string | null;
		}> = [];
		try {
			recentPoints = await ctx.db
				.select({
					type: sql<string>`'points'`.as("type"),
					userId: pointTransactions.userId,
					userEmail: users.email,
					createdAt: pointTransactions.createdAt,
					detail:
						sql<string>`concat(${pointTransactions.type}, ': ', ${pointTransactions.amount})`.as(
							"detail",
						),
				})
				.from(pointTransactions)
				.leftJoin(users, eq(pointTransactions.userId, users.id))
				.orderBy(desc(pointTransactions.createdAt))
				.limit(5);
		} catch {
			// 积分活动查询失败时使用默认值
		}

		const allActivity = [...recentTts, ...recentPayments, ...recentPoints]
			.filter((a) => a.createdAt != null)
			.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
			.slice(0, 10);

		// 今日新增用户
		let todayNewUsers = [{ count: 0 }];
		try {
			todayNewUsers = await ctx.db
				.select({ count: count() })
				.from(users)
				.where(gte(users.createdAt, todayStart));
		} catch {
			// 查询失败时使用默认值
		}

		// 活跃订阅数
		let activeSubscriptions = [{ count: 0 }];
		try {
			activeSubscriptions = await ctx.db
				.select({ count: count() })
				.from(userMemberships)
				.where(
					and(
						eq(userMemberships.status, "active"),
						eq(userMemberships.autoRenew, true),
						gte(userMemberships.endDate, now),
					),
				);
		} catch {
			// 查询失败时使用默认值
		}

		// 总收入（已成功的支付）
		let totalRevenue = [{ total: 0 }];
		try {
			totalRevenue = await ctx.db
				.select({ total: sql<number>`coalesce(sum(amount), 0)` })
				.from(paymentRecords)
				.where(eq(paymentRecords.status, "succeeded"));
		} catch {
			// 收入统计查询失败时使用默认值
		}

		// 本月收入
		let monthRevenue = [{ total: 0 }];
		try {
			monthRevenue = await ctx.db
				.select({ total: sql<number>`coalesce(sum(amount), 0)` })
				.from(paymentRecords)
				.where(and(eq(paymentRecords.status, "succeeded"), gte(paymentRecords.paidAt, monthStart)));
		} catch {
			// 查询失败时使用默认值
		}

		// 近 7 天新用户
		let newUsersWeek = [{ count: 0 }];
		try {
			newUsersWeek = await ctx.db
				.select({ count: count() })
				.from(users)
				.where(gte(users.createdAt, weekStart));
		} catch {
			// 新用户统计查询失败时使用默认值
		}

		// 总用户数
		let totalUsers = [{ count: 0 }];
		try {
			totalUsers = await ctx.db.select({ count: count() }).from(users);
		} catch {
			// 总用户数查询失败时使用默认值
		}

		return {
			points: {
				totalGranted: pointsStats[0]?.totalGranted || 0,
				totalConsumed: pointsStats[0]?.totalConsumed || 0,
			},
			tts: {
				today: todayTts[0]?.count || 0,
				total: totalTts[0]?.count || 0,
			},
			subscriptions: {
				active: activeSubscriptions[0]?.count || 0,
			},
			revenue: {
				total: totalRevenue[0]?.total || 0,
				month: monthRevenue[0]?.total || 0,
			},
			newUsers: {
				today: todayNewUsers[0]?.count || 0,
				week: newUsersWeek[0]?.count || 0,
			},
			totalUsers: totalUsers[0]?.count || 0,
			recentUsers: recentUserList.map((r) => {
				const session = sessionMap.get(r.user.id);
				return {
					id: r.user.id,
					email: r.user.email,
					fullName: r.user.fullName,
					createdAt: r.user.createdAt,
					ipAddress: session?.ipAddress || null,
					location: session?.location || null,
					userAgent: session?.userAgent || null,
					pointsTotal: r.points ? (r.points.dailyBalance || 0) + (r.points.monthlyBalance || 0) : 0,
					isActive: r.user.isActive,
					isAdmin: r.user.isAdmin,
				};
			}),
			recentActivity: allActivity.map((item) => ({
				type: item.type,
				userId: item.userId,
				userEmail: item.userEmail,
				detail: item.detail,
				createdAt: item.createdAt,
			})),
		};
	}),
});
