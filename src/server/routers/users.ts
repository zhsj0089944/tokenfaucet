import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
	invitationRecords,
	membershipPlans,
	userMemberships,
	userPoints,
	users,
} from "@/drizzle/schemas";
import { createTRPCRouter, protectedProcedure } from "../server";

/**
 * 用户路由
 */
export const usersRouter = createTRPCRouter({
	/**
	 * 获取当前用户
	 * 需要认证
	 */
	getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
		return ctx.user;
	}),

	/**
	 * 获取当前用户的邀请计数
	 * 需要认证
	 */
	getInviteCount: protectedProcedure.query(async ({ ctx }) => {
		const inviteCount = await ctx.db
			.select({ id: invitationRecords.id })
			.from(invitationRecords)
			.where(eq(invitationRecords.inviterId, ctx.user.id));

		return { count: inviteCount.length };
	}),

	/**
	 * 更新当前用户资料
	 * 需要认证
	 */
	updateProfile: protectedProcedure
		.input(
			z.object({
				fullName: z.string().optional(),
				locale: z.string().optional(),
				preferences: z
					.object({
						theme: z.enum(["light", "dark"]),
						language: z.enum(["en", "zh"]),
						currency: z.enum(["USD"]),
						timezone: z.string(),
					})
					.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const updateData: Record<string, unknown> = {
				updatedAt: new Date(),
			};

			if (input.fullName !== undefined) updateData.fullName = input.fullName;
			if (input.locale !== undefined) updateData.locale = input.locale;
			if (input.preferences !== undefined) updateData.preferences = input.preferences;

			const [updatedUser] = await ctx.db
				.update(users)
				.set(updateData)
				.where(eq(users.id, ctx.user.id))
				.returning();

			return updatedUser;
		}),

	/**
	 * 获取用户积分余额
	 * 需要认证
	 */
	getPointsBalance: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.userId;

		const points = await ctx.db.query.userPoints.findFirst({
			where: eq(userPoints.userId, userId),
		});

		if (!points) {
			return {
				dailyBalance: 0,
				monthlyBalance: 0,
				totalGranted: 0,
				totalConsumed: 0,
			};
		}

		return {
			dailyBalance: points.dailyBalance,
			monthlyBalance: points.monthlyBalance,
			totalGranted: points.totalGranted,
			totalConsumed: points.totalConsumed,
		};
	}),

	/**
	 * 获取用户会员状态
	 * 需要认证
	 */
	getMembershipStatus: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.userId;

		const membership = await ctx.db.query.userMemberships.findFirst({
			where: eq(userMemberships.userId, userId),
			orderBy: desc(userMemberships.createdAt),
		});

		if (!membership) {
			return {
				hasMembership: false,
				membership: null,
			};
		}

		const plan = await ctx.db.query.membershipPlans.findFirst({
			where: eq(membershipPlans.id, membership.planId),
		});

		return {
			hasMembership: true,
			membership: {
				...membership,
				planName: plan?.nameZh || plan?.name || "未知计划",
			},
		};
	}),

	/**
	 * 获取邀请记录
	 * 需要认证
	 */
	getInvitations: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.userId;

		const invitations = await ctx.db.query.invitationRecords.findMany({
			where: eq(invitationRecords.inviterId, userId),
			orderBy: desc(invitationRecords.createdAt),
		});

		return invitations;
	}),

	/**
	 * 获取邀请统计
	 * 需要认证
	 */
	getInviteStats: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.userId;

		const totalInvites = await ctx.db
			.select({ count: count() })
			.from(invitationRecords)
			.where(eq(invitationRecords.inviterId, userId));

		const usedInvites = await ctx.db
			.select({ count: count() })
			.from(invitationRecords)
			.where(and(eq(invitationRecords.inviterId, userId), eq(invitationRecords.status, "used")));

		return {
			total: totalInvites[0]?.count || 0,
			used: usedInvites[0]?.count || 0,
			available: (totalInvites[0]?.count || 0) - (usedInvites[0]?.count || 0),
		};
	}),
});
