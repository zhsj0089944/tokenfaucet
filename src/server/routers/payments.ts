import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, gt } from "drizzle-orm";
import { z } from "zod";
import {
	membershipPlans,
	membershipPointConfigs,
	paymentRecords,
	userMemberships,
	users,
	userUsageLimits,
} from "@/drizzle/schemas";
import { env, isCreemConfigured } from "@/env";
import {
	cancelCreemSubscription,
	createCreemCheckout,
	upgradeCreemSubscription,
} from "@/lib/creem";
import { activateMembership, cancelAutoRenew } from "@/server/services/membership-service";
import { updateUsageLimits } from "@/server/services/usage-limit-service";
import {
	adminProcedure,
	createTRPCRouter,
	internalProcedure,
	protectedProcedure,
	publicProcedure,
} from "../server";

/**
 * 支付路由
 */

// 会员套餐缓存（5分钟 TTL）
let membershipPlansCache: {
	data: Array<Record<string, unknown>> | null;
	timestamp: number;
} = {
	data: null,
	timestamp: 0,
};
const MEMBERSHIP_PLANS_CACHE_TTL = 5 * 60 * 1000; // 5 分钟

export const paymentsRouter = createTRPCRouter({
	/**
	 * 获取所有活跃的会员计划
	 */
	getMembershipPlans: publicProcedure
		.input(
			z
				.object({
					isActive: z.boolean().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const now = Date.now();

			// 检查缓存是否有效（5分钟 TTL）
			if (
				membershipPlansCache.data &&
				now - membershipPlansCache.timestamp < MEMBERSHIP_PLANS_CACHE_TTL
			) {
				return membershipPlansCache.data;
			}

			const conditions = [];
			if (input?.isActive !== false) {
				conditions.push(eq(membershipPlans.isActive, true));
			}

			const plans = await ctx.db
				.select({
					plan: membershipPlans,
					pointConfig: membershipPointConfigs,
				})
				.from(membershipPlans)
				.leftJoin(membershipPointConfigs, eq(membershipPlans.id, membershipPointConfigs.planId))
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(membershipPlans.sortOrder);

			// 格式化并缓存结果
			const formattedPlans = plans.map(({ plan, pointConfig }) => ({
				...plan,
				// 确保所有价格字段都是字符串
				priceUSDMonthly: plan.priceUSDMonthly?.toString() || "0",
				priceUSDYearly: plan.priceUSDYearly?.toString() || null,
				// 确保功能列表是数组
				features: Array.isArray(plan.features) ? plan.features : [],
				featuresZh: Array.isArray(plan.featuresZh) ? plan.featuresZh : [],
				// 添加积分配置
				monthlyPoints: pointConfig?.monthlyPoints ?? 0,
				dailyBonus: pointConfig?.dailyBonus ?? 0,
				hasUnlimitedPoints: pointConfig?.monthlyPoints === -1,
			}));

			// 更新缓存
			membershipPlansCache = {
				data: formattedPlans,
				timestamp: now,
			};

			return formattedPlans;
		}),

	/**
	 * 根据ID获取会员计划详情
	 */
	getMembershipPlanById: publicProcedure
		.input(z.object({ planId: z.string() }))
		.query(async ({ ctx, input }) => {
			const plan = await ctx.db.query.membershipPlans.findFirst({
				where: eq(membershipPlans.id, input.planId),
			});

			if (!plan) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "计划不存在",
				});
			}

			return plan;
		}),

	/**
	 * 获取用户当前会员状态
	 */
	getUserMembershipStatus: protectedProcedure
		.input(z.object({ userId: z.string().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const targetUserId = input?.userId || ctx.userId;

			// 获取用户当前有效的会员记录
			const membershipQuery = await ctx.db
				.select({
					membership: userMemberships,
					plan: membershipPlans,
				})
				.from(userMemberships)
				.leftJoin(membershipPlans, eq(userMemberships.planId, membershipPlans.id))
				.where(
					and(
						eq(userMemberships.userId, targetUserId),
						eq(userMemberships.status, "active"),
						gt(userMemberships.endDate, new Date()), // 未过期
					),
				)
				.orderBy(desc(userMemberships.endDate))
				.limit(1);

			const membership = membershipQuery[0] || null;

			// 获取使用限额
			const usageQuery = await ctx.db
				.select()
				.from(userUsageLimits)
				.where(eq(userUsageLimits.userId, targetUserId))
				.limit(1);

			const usage = usageQuery[0] || null;

			const userMembership = membership?.membership || null;
			const currentPlan = membership?.plan || null;

			const hasActiveMembership = Boolean(
				userMembership?.endDate && new Date() < new Date(userMembership.endDate),
			);

			// 计算剩余天数
			let remainingDays = 0;
			let nextExpiryDate: Date | null = null;

			if (hasActiveMembership && userMembership?.endDate) {
				const now = new Date();
				const endDate = new Date(userMembership.endDate);
				remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
				nextExpiryDate = endDate;
			}

			return {
				hasActiveMembership,
				currentPlan,
				membership: userMembership,
				usage: usage || null,
				usageLimits: usage || null,
				canUpgrade: hasActiveMembership,
				remainingDays,
				isExpired: !hasActiveMembership,
				nextExpiryDate,
			};
		}),

	/**
	 * 获取用户支付历史记录
	 */
	getPaymentHistory: protectedProcedure
		.input(
			z
				.object({
					limit: z.number().min(1).max(100).default(5),
					page: z.number().min(1).default(1),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { limit = 5, page = 1 } = input || {};
			const offset = (page - 1) * limit;

			const payments = await ctx.db
				.select()
				.from(paymentRecords)
				.where(eq(paymentRecords.userId, ctx.userId))
				.orderBy(desc(paymentRecords.createdAt))
				.limit(limit)
				.offset(offset);

			// 获取总数 - 修复计数查询
			const totalQuery = await ctx.db
				.select()
				.from(paymentRecords)
				.where(eq(paymentRecords.userId, ctx.userId));

			const total = totalQuery.length;

			return {
				payments,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
					hasMore: offset + payments.length < total,
				},
			};
		}),

	/**
	 * 获取所有支付记录（管理员专用）
	 */
	getAllPayments: adminProcedure
		.input(
			z
				.object({
					limit: z.number().min(1).max(100).default(20),
					page: z.number().min(1).default(1),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { limit = 20, page = 1 } = input || {};
			const offset = (page - 1) * limit;

			const payments = await ctx.db
				.select({
					id: paymentRecords.id,
					userId: paymentRecords.userId,
					userEmail: users.email,
					userFullName: users.fullName,
					membershipId: paymentRecords.membershipId,
					creemCheckoutId: paymentRecords.creemCheckoutId,
					creemOrderId: paymentRecords.creemOrderId,
					creemCustomerId: paymentRecords.creemCustomerId,
					creemSubscriptionId: paymentRecords.creemSubscriptionId,
					amount: paymentRecords.amount,
					currency: paymentRecords.currency,
					tax: paymentRecords.tax,
					fees: paymentRecords.fees,
					netAmount: paymentRecords.netAmount,
					status: paymentRecords.status,
					paymentMethod: paymentRecords.paymentMethod,
					planName: paymentRecords.planName,
					durationType: paymentRecords.durationType,
					membershipDurationDays: paymentRecords.membershipDurationDays,
					couponCode: paymentRecords.couponCode,
					discountAmount: paymentRecords.discountAmount,
					refundAmount: paymentRecords.refundAmount,
					refundedAt: paymentRecords.refundedAt,
					refundReason: paymentRecords.refundReason,
					paidAt: paymentRecords.paidAt,
					failedAt: paymentRecords.failedAt,
					description: paymentRecords.description,
					metadata: paymentRecords.metadata,
					createdAt: paymentRecords.createdAt,
					updatedAt: paymentRecords.updatedAt,
				})
				.from(paymentRecords)
				.leftJoin(users, eq(paymentRecords.userId, users.id))
				.orderBy(desc(paymentRecords.createdAt))
				.limit(limit)
				.offset(offset);

			const totalQuery = await ctx.db.select({ count: count() }).from(paymentRecords);

			const total = totalQuery[0]?.count || 0;

			return {
				payments,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
					hasMore: offset + payments.length < total,
				},
			};
		}),

	/**
	 * 激活会员（仅供webhook内部调用，不进行用户认证）
	 */
	activateMembership: internalProcedure
		.input(
			z.object({
				userId: z.string(),
				planId: z.string(),
				paymentIntentId: z.string(),
				amount: z.number(),
				currency: z.string(),
				paymentMethod: z.string(),
				durationDays: z.number().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const {
				userId,
				planId,
				paymentIntentId,
				amount,
				currency,
				paymentMethod,
				durationDays = 30,
			} = input;

			await activateMembership(ctx.db, {
				userId,
				planId,
				paymentIntentId,
				amount,
				currency,
				paymentMethod,
				durationDays,
			});

			return { message: "会员激活成功" };
		}),

	/**
	 * 更新用户使用限额（仅供webhook内部调用）
	 */
	updateUserUsageLimits: internalProcedure
		.input(
			z.object({
				userId: z.string(),
				planId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { userId, planId } = input;

			const plan = await ctx.db.query.membershipPlans.findFirst({
				where: eq(membershipPlans.id, planId),
			});

			if (!plan) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "计划不存在，无法更新使用限额",
				});
			}

			await updateUsageLimits(ctx.db, { userId, plan });

			return { message: "使用限额更新成功" };
		}),

	/**
	 * 获取用户使用统计数据
	 */
	getUserUsageStats: protectedProcedure
		.input(
			z
				.object({
					userId: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const targetUserId = input?.userId || ctx.userId;

			// 获取用户使用限额记录
			const usageQuery = await ctx.db
				.select()
				.from(userUsageLimits)
				.where(eq(userUsageLimits.userId, targetUserId))
				.limit(1);

			const usage = usageQuery[0];

			if (!usage) {
				// 如果没有使用记录，返回默认值
				return {
					usedUseCases: 0,
					usedTutorials: 0,
					usedApiCalls: 0,
					monthlyUseCases: 0,
					monthlyTutorials: 0,
					monthlyApiCalls: 0,
					currentPeriodStart: new Date(),
					currentPeriodEnd: new Date(),
					resetDate: new Date(),
				};
			}

			return {
				usedUseCases: usage.usedUseCases || 0,
				usedTutorials: usage.usedTutorials || 0,
				usedApiCalls: usage.usedApiCalls || 0,
				monthlyUseCases: usage.monthlyUseCases || 0,
				monthlyTutorials: usage.monthlyTutorials || 0,
				monthlyApiCalls: usage.monthlyApiCalls || 0,
				currentPeriodStart: usage.currentPeriodStart,
				currentPeriodEnd: usage.currentPeriodEnd,
				resetDate: usage.resetDate,
			};
		}),

	// ===============================
	// Creem 支付路由
	// ===============================

	/**
	 * 创建 Creem checkout session
	 */
	createCreemCheckout: protectedProcedure
		.input(
			z.object({
				planId: z.string(),
				durationType: z.enum(["monthly", "yearly"]).default("monthly"),
				locale: z.enum(["en", "zh"]).default("en"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			if (!isCreemConfigured()) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Creem not configured",
				});
			}

			const { planId, durationType, locale } = input;

			// 获取计划信息
			const plan = await ctx.db.query.membershipPlans.findFirst({
				where: eq(membershipPlans.id, planId),
			});

			if (!plan) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Plan not found",
				});
			}

			// 获取对应的 Creem Product ID
			const creemProductId =
				durationType === "yearly" ? plan.creemYearlyProductId : plan.creemMonthlyProductId;

			if (!creemProductId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Creem product not configured. Please contact support.",
				});
			}

			// 获取用户信息
			const user = await ctx.db.query.users.findFirst({
				where: (users, { eq }) => eq(users.id, ctx.userId),
			});

			// 构建 URL
			const baseUrl = env.NEXT_PUBLIC_APP_URL || "https://tokenfaucet.fun";
			const successUrl = `${baseUrl}/${locale}/payment/success`;

			try {
				const checkout = await createCreemCheckout({
					productId: creemProductId,
					customerEmail: user?.email || undefined,
					customerName: user?.fullName || undefined,
					successUrl,
					referenceId: ctx.userId,
					metadata: {
						planId,
						durationType,
						userId: ctx.userId,
					},
				});

				ctx.logger.info("Creem checkout created:", {
					checkoutId: checkout.id,
					userId: ctx.userId,
					planId,
					durationType,
				});

				return {
					checkoutUrl: checkout.checkoutUrl,
					checkoutId: checkout.id,
				};
			} catch (error) {
				ctx.logger.error("Failed to create Creem checkout:", error as Error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create checkout session",
				});
			}
		}),

	/**
	 * 取消 Creem 订阅
	 */
	cancelCreemSubscription: protectedProcedure
		.input(
			z.object({
				reason: z.string().optional().default("User requested cancellation"),
			}),
		)
		.mutation(async ({ ctx }) => {
			// 获取用户的当前会员信息
			const membership = await ctx.db.query.userMemberships.findFirst({
				where: and(eq(userMemberships.userId, ctx.userId), eq(userMemberships.status, "active")),
			});

			if (!membership?.creemSubscriptionId) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "No active Creem subscription found",
				});
			}

			try {
				await cancelCreemSubscription(membership.creemSubscriptionId);

				// 更新本地状态（只取消自动续费，保留到期访问权）
				await cancelAutoRenew(ctx.db, ctx.userId);

				ctx.logger.info("Creem subscription cancelled:", {
					subscriptionId: membership.creemSubscriptionId,
					userId: ctx.userId,
				});

				return { success: true };
			} catch (error) {
				ctx.logger.error("Failed to cancel Creem subscription:", error as Error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to cancel subscription",
				});
			}
		}),

	/**
	 * 升级订阅（按比例计费）
	 */
	upgradeSubscription: protectedProcedure
		.input(
			z.object({
				newPlanId: z.string(),
				durationType: z.enum(["monthly", "yearly"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { newPlanId, durationType } = input;

			// 获取当前活跃会员
			const membership = await ctx.db.query.userMemberships.findFirst({
				where: and(eq(userMemberships.userId, ctx.userId), eq(userMemberships.status, "active")),
			});

			if (!membership?.creemSubscriptionId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No active Creem subscription to upgrade",
				});
			}

			// 获取新计划
			const newPlan = await ctx.db.query.membershipPlans.findFirst({
				where: eq(membershipPlans.id, newPlanId),
			});

			if (!newPlan) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Plan not found",
				});
			}

			const newProductId =
				durationType === "yearly" ? newPlan.creemYearlyProductId : newPlan.creemMonthlyProductId;

			if (!newProductId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Plan not available for this billing cycle",
				});
			}

			try {
				const result = await upgradeCreemSubscription({
					subscriptionId: membership.creemSubscriptionId,
					productId: newProductId,
					updateBehavior: "proration-charge-immediately",
				});

				ctx.logger.info("Subscription upgraded", {
					userId: ctx.userId,
					subscriptionId: membership.creemSubscriptionId,
					newProductId,
				});

				return { success: true, subscription: result };
			} catch (error) {
				ctx.logger.error("Failed to upgrade subscription:", error as Error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to upgrade subscription",
				});
			}
		}),

	/**
	 * 获取支付配置状态（前端判断显示哪些支付按钮）
	 */
	getPaymentConfig: publicProcedure.query(() => {
		return {
			creem: isCreemConfigured(),
		};
	}),
});
