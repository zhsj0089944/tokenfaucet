import { and, count, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { ttsUsageRecords, users, userVoices } from "@/drizzle/schemas";
import { adminProcedure, createTRPCRouter } from "../server";

export const adminTtsRouter = createTRPCRouter({
	getTtsStats: adminProcedure
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

			// 总调用量
			const totalCalls = await ctx.db
				.select({ count: count() })
				.from(ttsUsageRecords)
				.where(gte(ttsUsageRecords.createdAt, startDate));

			// 今日调用量
			const todayCalls = await ctx.db
				.select({ count: count() })
				.from(ttsUsageRecords)
				.where(gte(ttsUsageRecords.createdAt, todayStart));

			// 成功率
			const successCalls = await ctx.db
				.select({ count: count() })
				.from(ttsUsageRecords)
				.where(and(eq(ttsUsageRecords.isSuccess, true), gte(ttsUsageRecords.createdAt, startDate)));

			// 失败率
			const failedCalls = await ctx.db
				.select({ count: count() })
				.from(ttsUsageRecords)
				.where(
					and(eq(ttsUsageRecords.isSuccess, false), gte(ttsUsageRecords.createdAt, startDate)),
				);

			// 按提供商分布
			const byModel = await ctx.db
				.select({
					model: ttsUsageRecords.model,
					count: count(),
					successCount: sql<number>`count(case when is_success = true then 1 end)`,
					failedCount: sql<number>`count(case when is_success = false then 1 end)`,
				})
				.from(ttsUsageRecords)
				.where(gte(ttsUsageRecords.createdAt, startDate))
				.groupBy(ttsUsageRecords.model);

			// 按音色分布
			const byVoice = await ctx.db
				.select({
					voiceId: ttsUsageRecords.voiceId,
					voiceType: ttsUsageRecords.voiceType,
					count: count(),
				})
				.from(ttsUsageRecords)
				.where(gte(ttsUsageRecords.createdAt, startDate))
				.groupBy(ttsUsageRecords.voiceId, ttsUsageRecords.voiceType)
				.orderBy(desc(count()))
				.limit(10);

			// 每日调用趋势
			const dailyTrend = await ctx.db
				.select({
					date: sql<string>`DATE(created_at)`,
					count: count(),
					successCount: sql<number>`count(case when is_success = true then 1 end)`,
				})
				.from(ttsUsageRecords)
				.where(gte(ttsUsageRecords.createdAt, startDate))
				.groupBy(sql`DATE(created_at)`)
				.orderBy(sql`DATE(created_at)`);

			// 平均文本长度
			const avgTextLength = await ctx.db
				.select({ avg: sql<number>`coalesce(avg(text_length), 0)` })
				.from(ttsUsageRecords)
				.where(and(eq(ttsUsageRecords.isSuccess, true), gte(ttsUsageRecords.createdAt, startDate)));

			// 总文本长度
			const totalTextLength = await ctx.db
				.select({ total: sql<number>`coalesce(sum(text_length), 0)` })
				.from(ttsUsageRecords)
				.where(and(eq(ttsUsageRecords.isSuccess, true), gte(ttsUsageRecords.createdAt, startDate)));

			const totalCount = totalCalls[0]?.count || 0;
			const successCount = successCalls[0]?.count || 0;

			return {
				totalCalls: totalCount,
				todayCalls: todayCalls[0]?.count || 0,
				successCalls: successCount,
				failedCalls: failedCalls[0]?.count || 0,
				successRate: totalCount > 0 ? (successCount / totalCount) * 100 : 0,
				byModel: byModel.map(
					(m: {
						model: string | null;
						count: number;
						successCount: number;
						failedCount: number;
					}) => ({
						model: m.model,
						count: m.count,
						successCount: m.successCount,
						failedCount: m.failedCount,
					}),
				),
				byVoice: byVoice.map((v: { voiceId: string | null; voiceType: string; count: number }) => ({
					voiceId: v.voiceId,
					voiceType: v.voiceType,
					count: v.count,
				})),
				dailyTrend: dailyTrend.map((d: { date: string; count: number; successCount: number }) => ({
					date: d.date,
					count: d.count,
					successCount: d.successCount,
				})),
				avgTextLength: Math.round(avgTextLength[0]?.avg || 0),
				totalTextLength: totalTextLength[0]?.total || 0,
			};
		}),

	getTtsLogs: adminProcedure
		.input(
			z
				.object({
					page: z.number().min(1).default(1),
					limit: z.number().min(1).max(100).default(50),
					userId: z.string().optional(),
					model: z.string().optional(),
					isSuccess: z.boolean().optional(),
					search: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { page = 1, limit = 50, userId, model, isSuccess, search } = input || {};
			const offset = (page - 1) * limit;

			const conditions = [];
			if (userId) conditions.push(eq(ttsUsageRecords.userId, userId));
			if (model) conditions.push(eq(ttsUsageRecords.model, model));
			if (isSuccess !== undefined) conditions.push(eq(ttsUsageRecords.isSuccess, isSuccess));
			if (search) {
				conditions.push(
					or(ilike(users.email, `%${search}%`), ilike(ttsUsageRecords.voiceId, `%${search}%`)),
				);
			}

			const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

			// 获取总数
			const totalResult = await ctx.db
				.select({ count: count() })
				.from(ttsUsageRecords)
				.leftJoin(users, eq(ttsUsageRecords.userId, users.id))
				.where(whereClause);

			const total = totalResult[0]?.count || 0;

			const logs = await ctx.db
				.select({
					id: ttsUsageRecords.id,
					userId: ttsUsageRecords.userId,
					userEmail: users.email,
					voiceId: ttsUsageRecords.voiceId,
					voiceType: ttsUsageRecords.voiceType,
					textLength: ttsUsageRecords.textLength,
					model: ttsUsageRecords.model,
					audioFormat: ttsUsageRecords.audioFormat,
					audioSize: ttsUsageRecords.audioSize,
					duration: ttsUsageRecords.duration,
					isSuccess: ttsUsageRecords.isSuccess,
					errorMessage: ttsUsageRecords.errorMessage,
					ipAddress: ttsUsageRecords.ipAddress,
					createdAt: ttsUsageRecords.createdAt,
				})
				.from(ttsUsageRecords)
				.leftJoin(users, eq(ttsUsageRecords.userId, users.id))
				.where(whereClause)
				.orderBy(desc(ttsUsageRecords.createdAt))
				.limit(limit)
				.offset(offset);

			return {
				logs,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			};
		}),

	getVoiceStats: adminProcedure.query(async ({ ctx }) => {
		// 预置音色使用统计
		const presetVoiceStats = await ctx.db
			.select({
				voiceId: ttsUsageRecords.voiceId,
				count: count(),
			})
			.from(ttsUsageRecords)
			.where(eq(ttsUsageRecords.voiceType, "preset"))
			.groupBy(ttsUsageRecords.voiceId)
			.orderBy(desc(count()))
			.limit(20);

		// 用户自定义音色统计
		const customVoices = await ctx.db
			.select({
				id: userVoices.id,
				userId: userVoices.userId,
				name: userVoices.name,
				voiceType: userVoices.voiceType,
				provider: userVoices.provider,
				isActive: userVoices.isActive,
				usageCount: userVoices.usageCount,
				createdAt: userVoices.createdAt,
			})
			.from(userVoices)
			.orderBy(desc(userVoices.usageCount))
			.limit(50);

		return {
			presetVoices: presetVoiceStats.map((v: { voiceId: string | null; count: number }) => ({
				voiceId: v.voiceId,
				count: v.count,
			})),
			customVoices,
		};
	}),
});
