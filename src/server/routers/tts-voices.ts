import { TRPCError } from "@trpc/server";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { ttsUsageRecords, userMemberships, userVoices } from "@/drizzle/schemas";
import { createTRPCRouter, protectedProcedure } from "../server";

export const ttsVoicesRouter = createTRPCRouter({
	/**
	 * 获取用户的音色列表
	 */
	getUserVoices: protectedProcedure.query(async ({ ctx }) => {
		const voices = await ctx.db
			.select()
			.from(userVoices)
			.where(
				and(
					eq(userVoices.userId, ctx.user.id),
					eq(userVoices.isActive, true),
					// 过滤掉过期的复刻音色（expiresAt为null或未过期）
					sql`(${userVoices.expiresAt} IS NULL OR ${userVoices.expiresAt} > NOW())`,
				),
			)
			.orderBy(desc(userVoices.createdAt));

		return voices;
	}),

	/**
	 * 保存音色
	 */
	saveVoice: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1, "音色名称不能为空").max(100),
				description: z.string().optional(),
				voiceType: z.enum(["preset", "design", "clone"]),
				provider: z.enum(["minimax", "mimo"]).default("minimax"),
				presetVoiceId: z.string().optional(),
				designPrompt: z.string().optional(),
				cloneAudioData: z.string().optional(),
				cloneAudioUrl: z.string().optional(),
				metadata: z.string().optional(),
				isDefault: z.boolean().optional().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// 复刻音色仅订阅会员可保存
			if (input.voiceType === "clone") {
				const membership = await ctx.db.query.userMemberships.findFirst({
					where: and(
						eq(userMemberships.userId, ctx.user.id),
						eq(userMemberships.status, "active"),
						gt(userMemberships.endDate, new Date()),
					),
				});
				if (!membership) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "订阅会员可保存复刻音色",
					});
				}
			}

			// 如果设为默认，先取消其他默认
			if (input.isDefault) {
				await ctx.db
					.update(userVoices)
					.set({ isDefault: false })
					.where(eq(userVoices.userId, ctx.user.id));
			}

			// 复刻音色设置3个月过期
			const expiresAt =
				input.voiceType === "clone"
					? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90天 = 3个月
					: null;

			const [voice] = await ctx.db
				.insert(userVoices)
				.values({
					userId: ctx.user.id,
					name: input.name,
					description: input.description,
					voiceType: input.voiceType,
					provider: input.provider,
					presetVoiceId: input.presetVoiceId,
					designPrompt: input.designPrompt,
					cloneAudioData: input.cloneAudioData,
					cloneAudioUrl: input.cloneAudioUrl,
					metadata: input.metadata,
					isDefault: input.isDefault,
					expiresAt,
				})
				.returning();

			return voice;
		}),

	/**
	 * 更新音色
	 */
	updateVoice: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				name: z.string().min(1).max(100).optional(),
				description: z.string().optional(),
				isDefault: z.boolean().optional(),
				isActive: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			// 验证所有权
			const existing = await ctx.db
				.select()
				.from(userVoices)
				.where(and(eq(userVoices.id, id), eq(userVoices.userId, ctx.user.id)))
				.limit(1);

			if (existing.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "音色不存在",
				});
			}

			// 如果设为默认，先取消其他默认
			if (data.isDefault) {
				await ctx.db
					.update(userVoices)
					.set({ isDefault: false })
					.where(eq(userVoices.userId, ctx.user.id));
			}

			const [voice] = await ctx.db
				.update(userVoices)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(userVoices.id, id))
				.returning();

			return voice;
		}),

	/**
	 * 删除音色（真删除）
	 */
	deleteVoice: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db
				.select()
				.from(userVoices)
				.where(and(eq(userVoices.id, input.id), eq(userVoices.userId, ctx.user.id)))
				.limit(1);

			if (existing.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "音色不存在",
				});
			}

			await ctx.db.delete(userVoices).where(eq(userVoices.id, input.id));

			return { success: true };
		}),

	/**
	 * 记录TTS使用
	 */
	recordUsage: protectedProcedure
		.input(
			z.object({
				voiceId: z.string().optional(),
				voiceType: z.enum(["preset", "design", "clone"]).default("preset"),
				textLength: z.number().default(0),
				model: z.string().default("mimo-v2.5-tts"),
				audioFormat: z.string().default("wav"),
				audioSize: z.number().optional(),
				duration: z.number().optional(),
				isSuccess: z.boolean().default(true),
				errorMessage: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [record] = await ctx.db
				.insert(ttsUsageRecords)
				.values({
					userId: ctx.user.id,
					...input,
				})
				.returning();

			// 更新音色使用次数
			if (input.voiceId) {
				await ctx.db
					.update(userVoices)
					.set({
						usageCount: sql`${userVoices.usageCount} + 1`,
						lastUsedAt: new Date(),
					})
					.where(eq(userVoices.id, input.voiceId));
			}

			return record;
		}),

	/**
	 * 获取TTS使用统计
	 */
	getUsageStats: protectedProcedure.query(async ({ ctx }) => {
		const records = await ctx.db
			.select()
			.from(ttsUsageRecords)
			.where(eq(ttsUsageRecords.userId, ctx.user.id))
			.orderBy(desc(ttsUsageRecords.createdAt))
			.limit(100);

		const totalCount = records.length;
		const successCount = records.filter((r) => r.isSuccess).length;
		const totalTextLength = records.reduce((sum, r) => sum + (r.textLength || 0), 0);

		return {
			totalCount,
			successCount,
			failCount: totalCount - successCount,
			totalTextLength,
			recentRecords: records.slice(0, 20),
		};
	}),
});

export type TtsVoicesRouter = typeof ttsVoicesRouter;
