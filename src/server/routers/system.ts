import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, inArray, lte } from "drizzle-orm";
import { z } from "zod";
import { ConfigChangeType, configHistory, systemConfigs } from "@/drizzle/schemas";
import { adminProcedure, createTRPCRouter, publicProcedure, superAdminProcedure } from "../server";
import { clearTtsConfigCache } from "./tts/config";

// 系统配置数据类型枚举
export const ConfigDataType = z.enum(["string", "number", "boolean", "json", "array"]);

// 系统配置分类枚举
export const ConfigCategory = z.enum(["general", "payment", "tts", "points", "invitation"]);

/**
 * 系统路由
 */
export const systemRouter = createTRPCRouter({
	/**
	 * 获取公开配置（无需登录）
	 * 用于前端动态显示网站配置
	 */
	getPublicConfigs: publicProcedure
		.input(
			z.object({
				keys: z.array(z.string()).optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const query = ctx.db.select().from(systemConfigs);

			const configs = await query;

			// 过滤：只返回非敏感的公开配置
			const publicConfigs = configs
				.filter((c) => !c.isSecret)
				.map((c) => ({
					key: c.key,
					value: c.value,
					category: c.category,
				}));

			// 如果指定了 keys，只返回这些 key 的配置
			if (input.keys && input.keys.length > 0) {
				return publicConfigs.filter((c) => input.keys?.includes(c.key));
			}

			return publicConfigs;
		}),

	/**
	 * 获取所有系统配置（需要管理员）
	 */
	getConfigs: adminProcedure
		.input(
			z.object({
				category: ConfigCategory.optional(),
				includeSecret: z.boolean().default(false),
			}),
		)
		.query(async ({ ctx, input }) => {
			const conditions = [];

			if (input.category) {
				conditions.push(eq(systemConfigs.category, input.category));
			}

			const configs = await ctx.db
				.select()
				.from(systemConfigs)
				.where(conditions.length > 0 ? conditions[0] : undefined)
				.orderBy(systemConfigs.category, systemConfigs.key);

			// 过滤敏感配置
			return configs.map((config) => ({
				...config,
				value: config.isSecret && !input.includeSecret ? "***" : config.value,
			}));
		}),

	/**
	 * 根据key获取配置
	 */
	getConfigByKey: adminProcedure
		.input(z.object({ key: z.string() }))
		.query(async ({ ctx, input }) => {
			const config = await ctx.db.query.systemConfigs.findFirst({
				where: eq(systemConfigs.key, input.key),
			});

			if (!config) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "配置项不存在",
				});
			}

			return config;
		}),

	/**
	 * 更新配置
	 */
	updateConfig: adminProcedure
		.input(
			z.object({
				key: z.string(),
				value: z.any(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const config = await ctx.db.query.systemConfigs.findFirst({
				where: eq(systemConfigs.key, input.key),
			});

			if (!config) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "配置项不存在",
				});
			}

			if (!config.isEditable) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "该配置项不可编辑",
				});
			}

			// 记录旧值用于历史记录
			const oldValue = config.value;

			const [updatedConfig] = await ctx.db
				.update(systemConfigs)
				.set({
					value: input.value,
					updatedBy: ctx.userId,
					updatedAt: new Date(),
				})
				.where(eq(systemConfigs.key, input.key))
				.returning();

			// 记录配置变更历史
			await ctx.db.insert(configHistory).values({
				configKey: input.key,
				category: config.category,
				oldValue: oldValue as string,
				newValue: input.value as string,
				changeType: ConfigChangeType.UPDATED,
				changedBy: ctx.userId,
				changedByEmail: ctx.user?.email,
				createdAt: new Date(),
			});

			ctx.logger.info(`管理员更新系统配置: ${input.key}`, {
				adminId: ctx.userId,
				configKey: input.key,
				oldValue,
				newValue: input.value,
			});

			// 清除 TTS 配置缓存，使更新即时生效
			if (input.key.startsWith("tts.")) {
				clearTtsConfigCache();
			}

			return updatedConfig;
		}),

	/**
	 * 创建新配置
	 */
	createConfig: adminProcedure
		.input(
			z.object({
				key: z.string().min(1).max(100),
				value: z.any(),
				description: z.string().optional(),
				category: ConfigCategory,
				dataType: ConfigDataType,
				isEditable: z.boolean().default(true),
				isSecret: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existingConfig = await ctx.db.query.systemConfigs.findFirst({
				where: eq(systemConfigs.key, input.key),
			});

			if (existingConfig) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "配置项已存在",
				});
			}

			const [newConfig] = await ctx.db
				.insert(systemConfigs)
				.values({
					key: input.key,
					value: input.value,
					description: input.description,
					category: input.category,
					dataType: input.dataType,
					isEditable: input.isEditable,
					isSecret: input.isSecret,
					updatedBy: ctx.userId,
				})
				.returning();

			// 清除 TTS 配置缓存，使新增配置即时生效
			if (input.key.startsWith("tts.")) {
				clearTtsConfigCache();
			}

			ctx.logger.info(`管理员创建系统配置: ${input.key}`, {
				adminId: ctx.userId,
				configKey: input.key,
				category: input.category,
			});

			return newConfig;
		}),

	/**
	 * 删除配置
	 */
	deleteConfig: adminProcedure
		.input(z.object({ key: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const config = await ctx.db.query.systemConfigs.findFirst({
				where: eq(systemConfigs.key, input.key),
			});

			if (!config) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "配置项不存在",
				});
			}

			if (!config.isEditable) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "该配置项不可删除",
				});
			}

			await ctx.db.delete(systemConfigs).where(eq(systemConfigs.key, input.key));

			if (input.key.startsWith("tts.")) {
				clearTtsConfigCache();
			}

			ctx.logger.info(`管理员删除系统配置: ${input.key}`, {
				adminId: ctx.userId,
				configKey: input.key,
			});

			return { message: "配置删除成功" };
		}),

	/**
	 * 批量更新配置
	 */
	batchUpdateConfigs: adminProcedure
		.input(
			z.object({
				configs: z.array(
					z.object({
						key: z.string(),
						value: z.any(),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const keys = input.configs.map((c) => c.key);

			// 检查所有配置是否存在且可编辑
			const existingConfigs = await ctx.db
				.select()
				.from(systemConfigs)
				.where(inArray(systemConfigs.key, keys));

			const editableConfigs = existingConfigs.filter((c) => c.isEditable);

			if (editableConfigs.length !== input.configs.length) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "部分配置项不存在或不可编辑",
				});
			}

			// 逐个更新配置
			const results = [];
			for (const configUpdate of input.configs) {
				const [updated] = await ctx.db
					.update(systemConfigs)
					.set({
						value: configUpdate.value,
						updatedBy: ctx.userId,
						updatedAt: new Date(),
					})
					.where(eq(systemConfigs.key, configUpdate.key))
					.returning();

				results.push(updated);
			}

			// 清除 TTS 配置缓存（如果有 TTS 相关配置被更新）
			if (keys.some((k) => k.startsWith("tts."))) {
				clearTtsConfigCache();
			}

			ctx.logger.info(`管理员批量更新系统配置: ${keys.join(", ")}`, {
				adminId: ctx.userId,
				configKeys: keys,
			});

			return results;
		}),

	/**
	 * 重置配置到默认值
	 */
	resetConfigToDefault: adminProcedure
		.input(z.object({ key: z.string() }))
		.mutation(async ({ ctx, input }) => {
			// 这里需要根据业务需求定义默认值
			const defaultValues: Record<string, string | boolean | number> = {
				"site.name": "TokenFaucet",
				"site.description": "TokenFaucet - AI Token 管理与分发平台",
				"payment.enabled": true,
				"notification.email_enabled": true,
			};

			const defaultValue = defaultValues[input.key];
			if (defaultValue === undefined) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "该配置项没有默认值",
				});
			}

			const [updated] = await ctx.db
				.update(systemConfigs)
				.set({
					value: String(defaultValue),
					updatedBy: ctx.userId,
					updatedAt: new Date(),
				})
				.where(eq(systemConfigs.key, input.key))
				.returning();

			ctx.logger.info(`管理员重置配置到默认值: ${input.key}`, {
				adminId: ctx.userId,
				configKey: input.key,
				defaultValue,
			});

			return updated;
		}),

	/**
	 * 获取配置分类列表
	 */
	getConfigCategories: adminProcedure.query(async ({ ctx }) => {
		const categories = await ctx.db
			.selectDistinct({ category: systemConfigs.category })
			.from(systemConfigs);

		return categories.map((c) => c.category);
	}),

	/**
	 * 获取配置变更历史
	 */
	getConfigHistory: adminProcedure
		.input(
			z.object({
				configKey: z.string().optional(),
				category: z.string().optional(),
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(20),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { configKey, category, page, limit } = input;

			const conditions = [];

			if (configKey) {
				conditions.push(eq(configHistory.configKey, configKey));
			}

			if (category) {
				conditions.push(eq(configHistory.category, category));
			}

			const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

			// 获取总数
			const totalResult = await ctx.db
				.select({ total: count() })
				.from(configHistory)
				.where(whereClause);

			const total = totalResult[0]?.total || 0;

			// 获取历史记录
			const history = await ctx.db
				.select()
				.from(configHistory)
				.where(whereClause)
				.orderBy(desc(configHistory.createdAt))
				.limit(limit)
				.offset((page - 1) * limit);

			return {
				history,
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			};
		}),

	/**
	 * 回滚配置到指定历史版本
	 */
	rollbackConfig: superAdminProcedure
		.input(
			z.object({
				historyId: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// 获取历史记录
			const historyRecord = await ctx.db.query.configHistory.findFirst({
				where: eq(configHistory.id, input.historyId),
			});

			if (!historyRecord) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "历史记录不存在",
				});
			}

			// 获取当前配置
			const currentConfig = await ctx.db.query.systemConfigs.findFirst({
				where: eq(systemConfigs.key, historyRecord.configKey),
			});

			if (!currentConfig) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "配置项不存在",
				});
			}

			if (!currentConfig.isEditable) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "该配置项不可编辑",
				});
			}

			// 记录当前值作为新历史
			await ctx.db.insert(configHistory).values({
				configKey: currentConfig.key,
				category: currentConfig.category,
				oldValue: currentConfig.value as string,
				newValue: historyRecord.newValue,
				changeType: ConfigChangeType.RESTORED,
				changedBy: ctx.userId,
				changedByEmail: ctx.user?.email,
				changeReason: `回滚到 ID: ${input.historyId} 的版本`,
				createdAt: new Date(),
			});

			// 执行回滚
			const [updatedConfig] = await ctx.db
				.update(systemConfigs)
				.set({
					value: historyRecord.newValue,
					updatedBy: ctx.userId,
					updatedAt: new Date(),
				})
				.where(eq(systemConfigs.key, historyRecord.configKey))
				.returning();

			ctx.logger.info(`管理员回滚配置: ${historyRecord.configKey}`, {
				adminId: ctx.userId,
				configKey: historyRecord.configKey,
				rolledBackToHistoryId: input.historyId,
				oldValue: currentConfig.value,
				newValue: historyRecord.newValue,
			});

			return updatedConfig;
		}),

	/**
	 * 清理旧配置历史（默认保留30天）
	 * 需要超级管理员权限
	 */
	cleanupOldConfigHistory: superAdminProcedure
		.input(
			z.object({
				daysToKeep: z.number().min(7).max(365).default(30), // 保留天数
				dryRun: z.boolean().default(true), // 试运行模式
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { daysToKeep, dryRun } = input;
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

			// 首先统计将要删除的记录数
			const [countResult] = await ctx.db
				.select({ count: count() })
				.from(configHistory)
				.where(lte(configHistory.createdAt, cutoffDate));

			const recordsToDelete = countResult?.count || 0;

			if (dryRun) {
				// 试运行模式，只返回统计信息
				return {
					dryRun: true,
					cutoffDate,
					recordsToDelete,
					message: `试运行：将删除 ${recordsToDelete} 条配置历史记录（保留最近 ${daysToKeep} 天）`,
				};
			}

			// 实际删除操作
			await ctx.db.delete(configHistory).where(lte(configHistory.createdAt, cutoffDate));

			ctx.logger.info("超级管理员清理配置历史", {
				adminId: ctx.userId,
				recordsDeleted: recordsToDelete,
				cutoffDate,
				daysToKeep,
			});

			return {
				dryRun: false,
				cutoffDate,
				recordsDeleted: recordsToDelete,
				message: `成功删除 ${recordsToDelete} 条配置历史记录`,
			};
		}),
});
