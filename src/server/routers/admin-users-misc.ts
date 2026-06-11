import { TRPCError } from "@trpc/server";
import { count, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { pointTransactions, userPoints, users } from "@/drizzle/schemas";
import { adminProcedure, createTRPCRouter } from "../server";

export const adminUsersMiscRouter = createTRPCRouter({
	adjustPoints: adminProcedure
		.input(
			z.object({
				userId: z.string(),
				amount: z.number(),
				reason: z.string(),
				target: z.enum(["daily", "monthly", "total"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { userId, amount, reason, target } = input;

			const points = await ctx.db.query.userPoints.findFirst({
				where: eq(userPoints.userId, userId),
			});

			if (!points) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "用户积分账户不存在",
				});
			}

			const updateData: Record<string, unknown> = {
				updatedAt: new Date(),
			};

			if (target === "daily" || target === "total") {
				updateData.dailyBalance = Math.max(0, points.dailyBalance + amount);
			}
			if (target === "monthly" || target === "total") {
				updateData.monthlyBalance = Math.max(0, points.monthlyBalance + amount);
			}
			if (target === "total") {
				updateData.totalGranted = points.totalGranted + Math.max(0, amount);
			}

			const [updatedPoints] = await ctx.db
				.update(userPoints)
				.set(updateData)
				.where(eq(userPoints.userId, userId))
				.returning();

			if (!updatedPoints) {
				throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "积分更新失败" });
			}

			await ctx.db.insert(pointTransactions).values({
				userId,
				type: "admin_adjust",
				amount,
				balanceBefore: points.dailyBalance + points.monthlyBalance,
				balanceAfter: updatedPoints.dailyBalance + updatedPoints.monthlyBalance,
				description: `管理员调整: ${reason}`,
				createdAt: new Date(),
			});

			return updatedPoints;
		}),

	getUserStats: adminProcedure.query(async ({ ctx }) => {
		const now = new Date();
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

		const [totalResult] = await ctx.db.select({ count: count() }).from(users);
		const [activeResult] = await ctx.db
			.select({ count: count() })
			.from(users)
			.where(eq(users.isActive, true));
		const [adminResult] = await ctx.db
			.select({ count: count() })
			.from(users)
			.where(eq(users.isAdmin, true));
		const [newTodayResult] = await ctx.db
			.select({ count: count() })
			.from(users)
			.where(gte(users.createdAt, todayStart));

		return {
			total: totalResult?.count || 0,
			active: activeResult?.count || 0,
			admin: adminResult?.count || 0,
			newToday: newTodayResult?.count || 0,
		};
	}),

	bulkUpdateUsers: adminProcedure
		.input(
			z.object({
				userIds: z.array(z.string()),
				updates: z.object({
					isActive: z.boolean().optional(),
					adminLevel: z.number().min(0).max(2).optional(),
				}),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { userIds, updates } = input;

			if (userIds.includes(ctx.user.id)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "不能批量修改自己的权限",
				});
			}

			const updateData: Record<string, unknown> = {
				updatedAt: new Date(),
			};

			if (updates.isActive !== undefined) {
				updateData.isActive = updates.isActive;
			}

			if (updates.adminLevel !== undefined) {
				updateData.adminLevel = updates.adminLevel;
				updateData.isAdmin = updates.adminLevel >= 1;
			}

			const updatedUsers = [];
			for (const userId of userIds) {
				const [updatedUser] = await ctx.db
					.update(users)
					.set(updateData)
					.where(eq(users.id, userId))
					.returning();

				if (updatedUser) {
					updatedUsers.push(updatedUser);
				}
			}

			return updatedUsers;
		}),
});
