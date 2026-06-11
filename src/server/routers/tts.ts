// ===============================
// TTS Router - 语音合成路由
// ===============================
// 已拆分为模块化结构：
// - config.ts: 配置管理
// - utils.ts: 工具函数
// - points.ts: 积分管理
// - generate.ts: TTS 生成逻辑
// ===============================

import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
	invitationRecords,
	pointTransactions,
	ttsUsageRecords,
	userPoints,
} from "@/drizzle/schemas";
import type { PointTransactionType } from "@/drizzle/schemas/points";
import { rateLimitByUser } from "@/lib/rate-limiter";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../server";
import { getTtsConfig, MIMO_VOICES, MINIMAX_VOICES } from "./tts/config";
import { callMimoTTS, callMinimaxTTS, refundPoints } from "./tts/generate";
import { ensurePointsAccount, getPointsConfig } from "./tts/points";
import { calculateTextPoints, checkMembership, getUserMembershipInfo } from "./tts/utils";

export const ttsRouter = createTRPCRouter({
	/**
	 * 获取TTS配置（前端用）
	 */
	getTtsSettings: protectedProcedure.query(async ({ ctx }) => {
		const config = await getTtsConfig(ctx);

		return {
			provider: config.provider,
			isConfigured: !!(
				(config.provider === "minimax" && config.minimaxApiKey) ||
				(config.provider === "mimo" && config.mimoApiKey)
			),
		};
	}),

	/**
	 * 获取可用的TTS提供商和音色列表
	 */
	getTtsProviders: publicProcedure.query(async ({ ctx }) => {
		const config = await getTtsConfig(ctx);

		const providers = [];

		if (config.minimaxApiKey) {
			providers.push({
				id: "minimax",
				name: "MiniMax",
				description: "支持全语种，多音色可选",
				features: ["multiLanguage", "multiVoice", "chars10000"],
				subscriptionRequired: true,
				voices: MINIMAX_VOICES,
				defaultVoice: config.minimaxDefaultVoice,
			});
		}

		if (config.mimoApiKey) {
			providers.push({
				id: "mimo",
				name: "MiMo",
				description: "支持风格控制和音频标签",
				features: ["styleControl", "audioTags", "chars10000"],
				subscriptionRequired: false,
				voices: MIMO_VOICES,
				defaultVoice: config.mimoDefaultVoice,
			});
		}

		return {
			providers,
			activeProvider: config.provider,
		};
	}),

	/**
	 * 获取积分余额
	 */
	getPointsBalance: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.userId;

		const { dailyBalance, monthlyBalance, monthlyPoints } = await ensurePointsAccount(ctx, userId);
		const pointsConfig = await getPointsConfig(ctx);

		const isSubscribed = await checkMembership(ctx, userId);
		const membership = await getUserMembershipInfo(ctx, userId);

		return {
			dailyBalance,
			monthlyBalance,
			totalBalance: dailyBalance + monthlyBalance,
			dailyPoints: pointsConfig.freeDailyPoints,
			monthlyPoints,
			isSubscribed,
			planName: membership?.plan?.name || null,
			lastDailyResetAt: new Date(),
			lastMonthlyResetAt: new Date(),
		};
	}),

	/**
	 * 生成TTS音频（带积分消耗）
	 */
	generate: protectedProcedure
		.input(
			z.object({
				text: z.string().min(1, "请输入要转换的文本"),
				provider: z.enum(["minimax", "mimo"]).optional(),
				voice: z.string().optional(),
				modelMode: z.enum(["preset", "design", "clone"]).optional().default("preset"),
				speed: z.number().min(0.5).max(2.0).optional(),
				stylePrompt: z.string().optional(),
				audioTags: z.array(z.string()).optional(),
				cloneVoice: z.string().optional(),
				voiceDesignPrompt: z.string().optional(),
				emotion: z.string().optional(),
				pitch: z.number().min(-12).max(12).optional(),
				volume: z.number().min(0.1).max(10).optional(),
				languageBoost: z.string().optional(),
				voiceModify: z
					.object({
						pitch: z.number().min(-100).max(100).optional(),
						intensity: z.number().min(-100).max(100).optional(),
						timbre: z.number().min(-100).max(100).optional(),
						sound_effects: z
							.enum(["spacious_echo", "auditorium_echo", "lofi_telephone", "robotic"])
							.optional(),
					})
					.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.userId;
			const now = new Date();
			const provider = input.provider || "mimo";

			// 速率限制检查（每用户每分钟最多30次TTS请求）
			const rateLimitResult = await rateLimitByUser(userId, {
				windowMs: 60 * 1000, // 1分钟
				maxRequests: 30,
				message: "TTS请求过于频繁，请稍后再试",
			});
			if (!rateLimitResult.allowed) {
				throw new TRPCError({
					code: "TOO_MANY_REQUESTS",
					message: "TTS请求过于频繁，请稍后再试",
				});
			}

			// 统一读取配置（避免重复查询）
			const config = await getTtsConfig(ctx);

			// MiniMax 需要订阅会员
			if (provider === "minimax") {
				const isSubscribed = await checkMembership(ctx, userId);
				if (!isSubscribed) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "MiniMax 模型仅限订阅会员使用，请切换到 MiMo 模型",
					});
				}
			}

			// 订阅专享音色校验
			const SUBSCRIPTION_ONLY_VOICE_IDS = ["english_lady", "english_gentleman"];
			const INVITE_UNLOCK_COUNT = 3;
			if (input.voice && SUBSCRIPTION_ONLY_VOICE_IDS.includes(input.voice)) {
				const isSubscribed = await checkMembership(ctx, userId);
				if (!isSubscribed) {
					const inviteCount = await ctx.db
						.select({ id: invitationRecords.id })
						.from(invitationRecords)
						.where(eq(invitationRecords.inviterId, userId));
					if (inviteCount.length < INVITE_UNLOCK_COUNT) {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: `该音色为订阅专享，请订阅或邀请 ${INVITE_UNLOCK_COUNT} 位好友解锁`,
						});
					}
				}
			}

			const maxChars = provider === "minimax" ? config.minimaxMaxChars : config.mimoMaxChars;
			if (input.text.length > maxChars) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `文本超过${maxChars}字限制（${provider}模型限制为${maxChars}字），请减少文本长度`,
				});
			}

			const pointsConfig = await getPointsConfig(ctx);
			const pointsCost = await calculateTextPoints(input.text, pointsConfig);

			let { dailyBalance, monthlyBalance } = await ensurePointsAccount(ctx, userId);

			const businessId = `tts_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
			const totalAvailable = dailyBalance + monthlyBalance;

			if (totalAvailable < pointsCost) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `积分不足。当前日积分: ${dailyBalance}，月积分: ${monthlyBalance}，需要: ${pointsCost}`,
				});
			}

			const usedDaily = Math.min(dailyBalance, pointsCost);
			const usedMonthly = pointsCost - usedDaily;

			const _newDailyBalance = dailyBalance - usedDaily;
			const _newMonthlyBalance = monthlyBalance - usedMonthly;

			// 保存事务中实际扣减的值（用于退款）
			let actualUsedDaily = usedDaily;
			let actualUsedMonthly = usedMonthly;

			// 使用事务确保积分扣减和记录原子性
			await ctx.db.transaction(async (tx) => {
				const [record] = await tx
					.select()
					.from(userPoints)
					.where(eq(userPoints.userId, userId))
					.for("update", { noWait: true });

				if (!record) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "积分账户不存在",
					});
				}

				const currentDailyBalance = record.dailyBalance;
				const currentMonthlyBalance = record.monthlyBalance;
				const currentTotalAvailable = currentDailyBalance + currentMonthlyBalance;

				if (currentTotalAvailable < pointsCost) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `积分不足。当前日积分: ${currentDailyBalance}，月积分: ${currentMonthlyBalance}，需要: ${pointsCost}`,
					});
				}

				actualUsedDaily = Math.min(currentDailyBalance, pointsCost);
				actualUsedMonthly = pointsCost - actualUsedDaily;
				const actualNewDailyBalance = currentDailyBalance - actualUsedDaily;
				const actualNewMonthlyBalance = currentMonthlyBalance - actualUsedMonthly;

				await tx
					.update(userPoints)
					.set({
						dailyBalance: actualNewDailyBalance,
						monthlyBalance: actualNewMonthlyBalance,
						totalConsumed: record.totalConsumed + pointsCost,
						updatedAt: now,
					})
					.where(eq(userPoints.userId, userId));

				await tx.insert(pointTransactions).values({
					userId,
					type: "tts_consume" as PointTransactionType,
					amount: -pointsCost,
					balanceBefore: currentDailyBalance + currentMonthlyBalance,
					balanceAfter: actualNewDailyBalance + actualNewMonthlyBalance,
					businessId,
					description: `TTS 音频生成（消耗 ${pointsCost} 积分，日积分-${actualUsedDaily}，月积分-${actualUsedMonthly}）`,
					createdAt: now,
				});

				dailyBalance = actualNewDailyBalance;
				monthlyBalance = actualNewMonthlyBalance;
			});

			const activeProvider = input.provider || (config.provider as "minimax" | "mimo");

			try {
				const result =
					activeProvider === "mimo"
						? await callMimoTTS(config, input)
						: await callMinimaxTTS(config, input, userId);

				ctx.logger.info("TTS生成成功", {
					userId,
					provider: activeProvider,
					textLength: input.text.length,
					pointsCost,
					dailyBalance,
					monthlyBalance,
				});

				// 写入TTS使用记录（失败不影响返回，记录日志）
				try {
					await ctx.db.insert(ttsUsageRecords).values({
						userId,
						voiceId: input.voice || null,
						voiceType: input.modelMode || "preset",
						textLength: input.text.length,
						model: activeProvider === "mimo" ? config.mimoModelPreset : config.minimaxModel,
						audioFormat: "mp3",
						isSuccess: true,
						createdAt: now,
					});
				} catch (recordError) {
					ctx.logger.error("TTS使用记录写入失败（音频已成功生成）", recordError as Error, {
						userId,
						businessId,
						pointsCost,
					});
				}

				return {
					type: "audio" as const,
					audio: result.audio,
					contentType: result.contentType,
					pointsCost,
					dailyBalance,
					monthlyBalance,
					totalBalance: dailyBalance + monthlyBalance,
				};
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "未知错误";
				await refundPoints(
					ctx,
					userId,
					pointsCost,
					actualUsedDaily,
					actualUsedMonthly,
					businessId,
					errorMessage,
					now,
				);

				// 写入失败的TTS使用记录（失败不影响主流程）
				try {
					await ctx.db.insert(ttsUsageRecords).values({
						userId,
						voiceId: input.voice || null,
						voiceType: input.modelMode || "preset",
						textLength: input.text.length,
						model: activeProvider === "mimo" ? config.mimoModelPreset : config.minimaxModel,
						audioFormat: "mp3",
						isSuccess: false,
						errorMessage: errorMessage,
						createdAt: now,
					});
				} catch (recordError) {
					ctx.logger.error("TTS失败记录写入失败", recordError as Error, {
						userId,
						businessId,
						errorMessage,
					});
				}

				if (error instanceof TRPCError) throw error;

				// 区分不同错误类型
				let errorCode: "BAD_GATEWAY" | "INTERNAL_SERVER_ERROR" = "INTERNAL_SERVER_ERROR";
				let userMessage = "TTS服务调用失败，请稍后重试";

				// MiniMax API 错误
				if (error instanceof Error && error.message.includes("MiniMax TTS 错误")) {
					errorCode = "BAD_GATEWAY";
					userMessage = "MiniMax服务暂时不可用，请稍后重试";
				}
				// MiMo API 错误
				else if (error instanceof Error && error.message.includes("MiMo TTS 错误")) {
					errorCode = "BAD_GATEWAY";
					userMessage = "MiMo服务暂时不可用，请稍后重试";
				}
				// 网络错误（fetch 失败、超时等）
				else if (
					error instanceof Error &&
					(error.name === "AbortError" ||
						error.message.includes("fetch") ||
						error.message.includes("network") ||
						error.message.includes("timeout"))
				) {
					errorCode = "INTERNAL_SERVER_ERROR";
					userMessage = "网络连接异常，请检查网络后重试";
				}

				throw new TRPCError({
					code: errorCode,
					message: userMessage,
				});
			}
		}),

	/**
	 * 获取最近的TTS使用记录
	 */
	getRecentUsage: protectedProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(20).default(5),
			}),
		)
		.query(async ({ ctx, input }) => {
			const userId = ctx.userId;
			const { limit } = input;

			const records = await ctx.db
				.select({
					id: ttsUsageRecords.id,
					voiceId: ttsUsageRecords.voiceId,
					voiceType: ttsUsageRecords.voiceType,
					textLength: ttsUsageRecords.textLength,
					model: ttsUsageRecords.model,
					audioFormat: ttsUsageRecords.audioFormat,
					duration: ttsUsageRecords.duration,
					isSuccess: ttsUsageRecords.isSuccess,
					createdAt: ttsUsageRecords.createdAt,
				})
				.from(ttsUsageRecords)
				.where(eq(ttsUsageRecords.userId, userId))
				.orderBy(desc(ttsUsageRecords.createdAt))
				.limit(limit);

			return records;
		}),
});

export type TtsRouter = typeof ttsRouter;
