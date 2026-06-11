import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, gte, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { membershipPlans, userMemberships, users } from "@/drizzle/schemas";
import { adminProcedure, createTRPCRouter } from "../server";

export const adminSubscriptionsRouter = createTRPCRouter({
	getAllSubscriptions: adminProcedure
		.input(
			z
				.object({
					page: z.number().min(1).default(1),
					limit: z.number().min(1).max(100).default(20),
					status: z.enum(["active", "cancelled", "expired"]).optional(),
					planId: z.string().optional(),
					search: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { page = 1, limit = 20, status, planId, search } = input || {};
			const offset = (page - 1) * limit;

			const conditions = [];
			if (status) conditions.push(eq(userMemberships.status, status));
			if (planId) conditions.push(eq(userMemberships.planId, planId));
			if (search) {
				conditions.push(
					or(ilike(users.email, `%${search}%`), ilike(users.fullName, `%${search}%`)),
				);
			}

			const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

			// 获取总数
			const totalResult = await ctx.db
				.select({ count: count() })
				.from(userMemberships)
				.leftJoin(users, eq(userMemberships.userId, users.id))
				.where(whereClause);

			const total = totalResult[0]?.count || 0;

			// 获取订阅列表
			const subscriptions = await ctx.db
				.select({
					id: userMemberships.id,
					userId: userMemberships.userId,
					userEmail: users.email,
					userFullName: users.fullName,
					planId: userMemberships.planId,
					planName: membershipPlans.name,
					planNameZh: membershipPlans.nameZh,
					startDate: userMemberships.startDate,
					endDate: userMemberships.endDate,
					status: userMemberships.status,
					durationType: userMemberships.durationType,
					durationDays: userMemberships.durationDays,
					purchaseAmount: userMemberships.purchaseAmount,
					currency: userMemberships.currency,
					autoRenew: userMemberships.autoRenew,
					nextRenewalDate: userMemberships.nextRenewalDate,
					paymentMethod: userMemberships.paymentMethod,
					cancelledAt: userMemberships.cancelledAt,
					cancelReason: userMemberships.cancelReason,
					createdAt: userMemberships.createdAt,
					updatedAt: userMemberships.updatedAt,
				})
				.from(userMemberships)
				.leftJoin(users, eq(userMemberships.userId, users.id))
				.leftJoin(membershipPlans, eq(userMemberships.planId, membershipPlans.id))
				.where(whereClause)
				.orderBy(desc(userMemberships.createdAt))
				.limit(limit)
				.offset(offset);

			return {
				subscriptions,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			};
		}),

	cancelSubscription: adminProcedure
		.input(
			z.object({
				id: z.string(),
				reason: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const membership = await ctx.db.query.userMemberships.findFirst({
				where: eq(userMemberships.id, input.id),
			});

			if (!membership) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "订阅记录不存在",
				});
			}

			const [updated] = await ctx.db
				.update(userMemberships)
				.set({
					status: "cancelled",
					autoRenew: false,
					cancelledAt: new Date(),
					cancelReason: input.reason || "管理员手动取消",
					cancelledBy: ctx.user.id,
					updatedAt: new Date(),
				})
				.where(eq(userMemberships.id, input.id))
				.returning();

			return updated;
		}),

	extendSubscription: adminProcedure
		.input(
			z.object({
				id: z.string(),
				days: z.number().min(1).max(3650),
				reason: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const membership = await ctx.db.query.userMemberships.findFirst({
				where: eq(userMemberships.id, input.id),
			});

			if (!membership) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "订阅记录不存在",
				});
			}

			const currentEndDate = new Date(membership.endDate);
			const now = new Date();
			const baseDate = currentEndDate > now ? currentEndDate : now;
			const newEndDate = new Date(baseDate.getTime() + input.days * 24 * 60 * 60 * 1000);

			const [updated] = await ctx.db
				.update(userMemberships)
				.set({
					endDate: newEndDate,
					status: "active",
					updatedAt: new Date(),
				})
				.where(eq(userMemberships.id, input.id))
				.returning();

			ctx.logger.info("Admin extended subscription:", {
				adminId: ctx.user.id,
				membershipId: input.id,
				days: input.days,
				reason: input.reason,
			});

			return updated;
		}),

	getSubscriptionStats: adminProcedure.query(async ({ ctx }) => {
		const now = new Date();

		const active = await ctx.db
			.select({ count: count() })
			.from(userMemberships)
			.where(and(eq(userMemberships.status, "active"), gte(userMemberships.endDate, now)));

		const cancelled = await ctx.db
			.select({ count: count() })
			.from(userMemberships)
			.where(eq(userMemberships.status, "cancelled"));

		const expired = await ctx.db
			.select({ count: count() })
			.from(userMemberships)
			.where(eq(userMemberships.status, "expired"));

		const autoRenew = await ctx.db
			.select({ count: count() })
			.from(userMemberships)
			.where(
				and(
					eq(userMemberships.status, "active"),
					eq(userMemberships.autoRenew, true),
					gte(userMemberships.endDate, now),
				),
			);

		const byPlan = await ctx.db
			.select({
				planId: userMemberships.planId,
				planName: membershipPlans.name,
				count: count(),
			})
			.from(userMemberships)
			.leftJoin(membershipPlans, eq(userMemberships.planId, membershipPlans.id))
			.where(and(eq(userMemberships.status, "active"), gte(userMemberships.endDate, now)))
			.groupBy(userMemberships.planId, membershipPlans.name);

		return {
			active: active[0]?.count || 0,
			cancelled: cancelled[0]?.count || 0,
			expired: expired[0]?.count || 0,
			autoRenew: autoRenew[0]?.count || 0,
			byPlan: byPlan.map(
				(p: { planId: string | null; planName: string | null; count: number }) => ({
					planId: p.planId,
					planName: p.planName,
					count: p.count,
				}),
			),
		};
	}),
});
