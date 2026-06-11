import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { membershipPlans, userMemberships } from "@/drizzle/schemas";
import { updateUsageLimits } from "@/server/services/usage-limit-service";
import { adminProcedure, createTRPCRouter } from "../server";

export const adminUsersMembershipRouter = createTRPCRouter({
	adminExtendMembership: adminProcedure
		.input(
			z.object({
				userId: z.string(),
				days: z.number().min(1).max(3650),
				reason: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { userId, days, reason } = input;

			const [existingMembership] = await ctx.db
				.select()
				.from(userMemberships)
				.where(eq(userMemberships.userId, userId))
				.orderBy(desc(userMemberships.endDate))
				.limit(1);

			if (!existingMembership) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "用户没有会员记录",
				});
			}

			const currentEndDate = new Date(existingMembership.endDate);
			const now = new Date();
			const baseDate = currentEndDate > now ? currentEndDate : now;
			const newEndDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

			const [updatedMembership] = await ctx.db
				.update(userMemberships)
				.set({
					endDate: newEndDate,
					status: "active",
					updatedAt: new Date(),
				})
				.where(eq(userMemberships.id, existingMembership.id))
				.returning();

			ctx.logger.info("管理员延期会员:", {
				adminId: ctx.user.id,
				userId,
				days,
				oldEndDate: currentEndDate.toISOString(),
				newEndDate: newEndDate.toISOString(),
				reason,
			});

			return updatedMembership;
		}),

	adminCancelMembership: adminProcedure
		.input(z.object({ userId: z.string(), reason: z.string().optional() }))
		.mutation(async ({ ctx, input }) => {
			const { userId, reason } = input;

			const [existingMembership] = await ctx.db
				.select()
				.from(userMemberships)
				.where(eq(userMemberships.userId, userId))
				.orderBy(desc(userMemberships.endDate))
				.limit(1);

			if (!existingMembership) {
				throw new TRPCError({ code: "NOT_FOUND", message: "用户没有会员记录" });
			}

			const [cancelledMembership] = await ctx.db
				.update(userMemberships)
				.set({
					status: "cancelled",
					autoRenew: false,
					cancelledAt: new Date(),
					cancelReason: reason || "管理员手动取消",
					cancelledBy: ctx.user.id,
					updatedAt: new Date(),
				})
				.where(eq(userMemberships.id, existingMembership.id))
				.returning();

			ctx.logger.info("管理员取消会员:", {
				adminId: ctx.user.id,
				userId,
				membershipId: existingMembership.id,
				reason,
			});

			return cancelledMembership;
		}),

	adminActivateMembership: adminProcedure
		.input(
			z.object({
				userId: z.string(),
				planId: z.string(),
				durationDays: z.number().min(1).max(3650),
				reason: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { userId, planId, durationDays, reason } = input;

			const plan = await ctx.db.query.membershipPlans.findFirst({
				where: eq(membershipPlans.id, planId),
			});

			if (!plan) {
				throw new TRPCError({ code: "NOT_FOUND", message: "会员计划不存在" });
			}

			const now = new Date();
			const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
			const durationType = durationDays >= 365 ? "yearly" : "monthly";

			const [existingMembership] = await ctx.db
				.select()
				.from(userMemberships)
				.where(eq(userMemberships.userId, userId))
				.limit(1);

			let membership: typeof userMemberships.$inferSelect | undefined;

			if (existingMembership) {
				[membership] = await ctx.db
					.update(userMemberships)
					.set({
						planId,
						startDate: now,
						endDate,
						status: "active",
						durationType,
						durationDays,
						purchaseAmount: "0",
						currency: "USD",
						paymentMethod: "admin",
						source: "admin",
						autoRenew: false,
						cancelledAt: null,
						cancelReason: null,
						cancelledBy: null,
						updatedAt: now,
					})
					.where(eq(userMemberships.id, existingMembership.id))
					.returning();
			} else {
				[membership] = await ctx.db
					.insert(userMemberships)
					.values({
						userId,
						planId,
						startDate: now,
						endDate,
						status: "active",
						durationType,
						durationDays,
						purchaseAmount: "0",
						currency: "USD",
						paymentMethod: "admin",
						source: "admin",
						autoRenew: false,
						createdAt: now,
						updatedAt: now,
					})
					.returning();
			}

			ctx.logger.info("管理员手动激活会员:", {
				adminId: ctx.user.id,
				userId,
				planId,
				planName: plan.nameZh || plan.name,
				durationDays,
				endDate: endDate.toISOString(),
				reason,
			});

			await updateUsageLimits(ctx.db, { userId, plan });

			return membership;
		}),

	getUserMembershipDetail: adminProcedure
		.input(z.object({ userId: z.string() }))
		.query(async ({ ctx, input }) => {
			const { userId } = input;

			const membershipQuery = await ctx.db
				.select({
					membership: userMemberships,
					plan: membershipPlans,
				})
				.from(userMemberships)
				.leftJoin(membershipPlans, eq(userMemberships.planId, membershipPlans.id))
				.where(eq(userMemberships.userId, userId))
				.orderBy(desc(userMemberships.endDate))
				.limit(1);

			const membership = membershipQuery[0] || null;

			return {
				membership: membership?.membership || null,
				plan: membership?.plan || null,
				hasActiveMembership: Boolean(
					membership?.membership?.endDate &&
						new Date() < new Date(membership.membership.endDate) &&
						membership.membership.status === "active",
				),
			};
		}),
});
