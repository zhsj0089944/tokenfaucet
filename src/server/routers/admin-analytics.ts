import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import {
	paymentRecords,
	sessions,
	ttsUsageRecords,
	userMemberships,
	users,
} from "@/drizzle/schemas";
import { adminProcedure, createTRPCRouter } from "../server";

export const adminAnalyticsRouter = createTRPCRouter({
	getDashboardAnalytics: adminProcedure
		.input(
			z
				.object({
					days: z.number().min(1).max(90).default(30),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const days = input?.days || 30;
			const now = new Date();
			const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
			const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

			// 每日注册用户趋势
			const dailyRegistrations = await ctx.db
				.select({
					date: sql<string>`DATE(created_at)`,
					count: count(),
				})
				.from(users)
				.where(gte(users.createdAt, startDate))
				.groupBy(sql`DATE(created_at)`)
				.orderBy(sql`DATE(created_at)`);

			// 每日收入趋势
			const dailyRevenue = await ctx.db
				.select({
					date: sql<string>`DATE(paid_at)`,
					total: sql<number>`coalesce(sum(amount), 0)`,
				})
				.from(paymentRecords)
				.where(and(eq(paymentRecords.status, "succeeded"), gte(paymentRecords.paidAt, startDate)))
				.groupBy(sql`DATE(paid_at)`)
				.orderBy(sql`DATE(paid_at)`);

			// 每日 TTS 调用趋势
			const dailyTts = await ctx.db
				.select({
					date: sql<string>`DATE(created_at)`,
					count: count(),
				})
				.from(ttsUsageRecords)
				.where(gte(ttsUsageRecords.createdAt, startDate))
				.groupBy(sql`DATE(created_at)`)
				.orderBy(sql`DATE(created_at)`);

			// 套餐收入分布
			const revenueByPlan = await ctx.db
				.select({
					planName: paymentRecords.planName,
					total: sql<number>`coalesce(sum(amount), 0)`,
					count: count(),
				})
				.from(paymentRecords)
				.where(and(eq(paymentRecords.status, "succeeded"), gte(paymentRecords.paidAt, startDate)))
				.groupBy(paymentRecords.planName);

			// 提供商使用分布
			const ttsByProvider = await ctx.db
				.select({
					model: ttsUsageRecords.model,
					count: count(),
				})
				.from(ttsUsageRecords)
				.where(gte(ttsUsageRecords.createdAt, startDate))
				.groupBy(ttsUsageRecords.model);

			// 转化漏斗
			const totalVisitors = await ctx.db
				.select({ count: count() })
				.from(sessions)
				.where(gte(sessions.createdAt, startDate));

			const totalNewUsers = await ctx.db
				.select({ count: count() })
				.from(users)
				.where(gte(users.createdAt, startDate));

			const totalPayingUsers = await ctx.db
				.select({ count: sql<number>`count(distinct user_id)` })
				.from(paymentRecords)
				.where(and(eq(paymentRecords.status, "succeeded"), gte(paymentRecords.paidAt, startDate)));

			// MRR (月经常性收入)
			const mrr = await ctx.db
				.select({ total: sql<number>`coalesce(sum(amount), 0)` })
				.from(paymentRecords)
				.where(
					and(
						eq(paymentRecords.status, "succeeded"),
						gte(paymentRecords.paidAt, monthStart),
						eq(paymentRecords.paymentMethod, "creem_subscription"),
					),
				);

			// Top 5 活跃用户（TTS 调用最多）
			const topActiveUsers = await ctx.db
				.select({
					userId: ttsUsageRecords.userId,
					userEmail: users.email,
					userFullName: users.fullName,
					ttsCount: count(),
				})
				.from(ttsUsageRecords)
				.leftJoin(users, eq(ttsUsageRecords.userId, users.id))
				.where(gte(ttsUsageRecords.createdAt, startDate))
				.groupBy(ttsUsageRecords.userId, users.email, users.fullName)
				.orderBy(desc(count()))
				.limit(5);

			// Top 5 付费用户
			const topPayingUsers = await ctx.db
				.select({
					userId: paymentRecords.userId,
					userEmail: users.email,
					userFullName: users.fullName,
					totalSpent: sql<number>`coalesce(sum(amount), 0)`,
					paymentCount: count(),
				})
				.from(paymentRecords)
				.leftJoin(users, eq(paymentRecords.userId, users.id))
				.where(and(eq(paymentRecords.status, "succeeded"), gte(paymentRecords.paidAt, startDate)))
				.groupBy(paymentRecords.userId, users.email, users.fullName)
				.orderBy(desc(sql`coalesce(sum(amount), 0)`))
				.limit(5);

			// 活跃订阅数
			const activeSubscriptions = await ctx.db
				.select({ count: count() })
				.from(userMemberships)
				.where(
					and(
						eq(userMemberships.status, "active"),
						eq(userMemberships.autoRenew, true),
						gte(userMemberships.endDate, now),
					),
				);

			// 今日实时数据
			const todayTts = await ctx.db
				.select({ count: count() })
				.from(ttsUsageRecords)
				.where(
					and(eq(ttsUsageRecords.isSuccess, true), gte(ttsUsageRecords.createdAt, todayStart)),
				);

			const todayRevenue = await ctx.db
				.select({ total: sql<number>`coalesce(sum(amount), 0)` })
				.from(paymentRecords)
				.where(and(eq(paymentRecords.status, "succeeded"), gte(paymentRecords.paidAt, todayStart)));

			const todayNewUsers = await ctx.db
				.select({ count: count() })
				.from(users)
				.where(gte(users.createdAt, todayStart));

			return {
				dailyRegistrations: dailyRegistrations.map((d: { date: string; count: number }) => ({
					date: d.date,
					count: d.count,
				})),
				dailyRevenue: dailyRevenue.map((d: { date: string; total: number }) => ({
					date: d.date,
					total: Number(d.total),
				})),
				dailyTts: dailyTts.map((d: { date: string; count: number }) => ({
					date: d.date,
					count: d.count,
				})),
				revenueByPlan: revenueByPlan.map(
					(r: { planName: string | null; total: number; count: number }) => ({
						planName: r.planName,
						total: Number(r.total),
						count: r.count,
					}),
				),
				ttsByProvider: ttsByProvider.map((t: { model: string | null; count: number }) => ({
					model: t.model,
					count: t.count,
				})),
				funnel: {
					visitors: totalVisitors[0]?.count || 0,
					newUsers: totalNewUsers[0]?.count || 0,
					payingUsers: totalPayingUsers[0]?.count || 0,
				},
				mrr: Number(mrr[0]?.total || 0),
				activeSubscriptions: activeSubscriptions[0]?.count || 0,
				topActiveUsers: topActiveUsers.map(
					(u: {
						userId: string;
						userEmail: string | null;
						userFullName: string | null;
						ttsCount: number;
					}) => ({
						...u,
						ttsCount: u.ttsCount,
					}),
				),
				topPayingUsers: topPayingUsers.map(
					(u: {
						userId: string;
						userEmail: string | null;
						userFullName: string | null;
						totalSpent: number;
						paymentCount: number;
					}) => ({
						...u,
						totalSpent: Number(u.totalSpent),
					}),
				),
				today: {
					tts: todayTts[0]?.count || 0,
					revenue: Number(todayRevenue[0]?.total || 0),
					newUsers: todayNewUsers[0]?.count || 0,
				},
			};
		}),

	getRevenueStats: adminProcedure
		.input(
			z
				.object({
					days: z.number().min(1).max(365).default(30),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const days = input?.days || 30;
			const now = new Date();
			const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
			const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

			// 总收入
			const totalRevenue = await ctx.db
				.select({ total: sql<number>`coalesce(sum(amount), 0)` })
				.from(paymentRecords)
				.where(eq(paymentRecords.status, "succeeded"));

			// 本月收入
			const monthRevenue = await ctx.db
				.select({ total: sql<number>`coalesce(sum(amount), 0)` })
				.from(paymentRecords)
				.where(and(eq(paymentRecords.status, "succeeded"), gte(paymentRecords.paidAt, monthStart)));

			// 指定时间段收入
			const periodRevenue = await ctx.db
				.select({ total: sql<number>`coalesce(sum(amount), 0)` })
				.from(paymentRecords)
				.where(and(eq(paymentRecords.status, "succeeded"), gte(paymentRecords.paidAt, startDate)));

			// 退款统计
			const refundStats = await ctx.db
				.select({
					totalRefunds: sql<number>`coalesce(sum(refund_amount), 0)`,
					refundCount: count(),
				})
				.from(paymentRecords)
				.where(sql`refund_amount > 0`);

			// 支付方式分布
			const paymentMethodStats = await ctx.db
				.select({
					method: paymentRecords.paymentMethod,
					total: sql<number>`coalesce(sum(amount), 0)`,
					count: count(),
				})
				.from(paymentRecords)
				.where(eq(paymentRecords.status, "succeeded"))
				.groupBy(paymentRecords.paymentMethod);

			// 每日收入详情
			const dailyRevenue = await ctx.db
				.select({
					date: sql<string>`DATE(paid_at)`,
					total: sql<number>`coalesce(sum(amount), 0)`,
					count: count(),
				})
				.from(paymentRecords)
				.where(and(eq(paymentRecords.status, "succeeded"), gte(paymentRecords.paidAt, startDate)))
				.groupBy(sql`DATE(paid_at)`)
				.orderBy(sql`DATE(paid_at)`);

			return {
				totalRevenue: Number(totalRevenue[0]?.total || 0),
				monthRevenue: Number(monthRevenue[0]?.total || 0),
				periodRevenue: Number(periodRevenue[0]?.total || 0),
				refunds: {
					total: Number(refundStats[0]?.totalRefunds || 0),
					count: refundStats[0]?.refundCount || 0,
				},
				byPaymentMethod: paymentMethodStats.map(
					(p: { method: string | null; total: number; count: number }) => ({
						method: p.method,
						total: Number(p.total),
						count: p.count,
					}),
				),
				dailyRevenue: dailyRevenue.map((d: { date: string; total: number; count: number }) => ({
					date: d.date,
					total: Number(d.total),
					count: d.count,
				})),
			};
		}),
});
