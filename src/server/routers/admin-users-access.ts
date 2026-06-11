import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { users } from "@/drizzle/schemas";
import { AdminLevel } from "@/lib/auth/better-auth/roles";
import { adminProcedure, createTRPCRouter, superAdminProcedure } from "../server";

export const adminUsersAccessRouter = createTRPCRouter({
	promoteUser: superAdminProcedure
		.input(
			z.object({
				userId: z.string(),
				adminLevel: z.number().min(0).max(2),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { userId, adminLevel } = input;

			const user = await ctx.db.query.users.findFirst({
				where: eq(users.id, userId),
			});

			if (!user) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "用户不存在",
				});
			}

			if (userId === ctx.user.id && adminLevel < (user.adminLevel ?? 0)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "不能降低自己的权限",
				});
			}

			const [updatedUser] = await ctx.db
				.update(users)
				.set({
					adminLevel,
					isAdmin: adminLevel >= AdminLevel.ADMIN,
					updatedAt: new Date(),
				})
				.where(eq(users.id, userId))
				.returning();

			return updatedUser;
		}),

	updateUserRole: superAdminProcedure
		.input(
			z.object({
				userId: z.string(),
				adminLevel: z.number().min(0).max(2),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { userId, adminLevel } = input;

			const user = await ctx.db.query.users.findFirst({
				where: eq(users.id, userId),
			});

			if (!user) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "用户不存在",
				});
			}

			if (userId === ctx.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "不能修改自己的角色",
				});
			}

			const [updatedUser] = await ctx.db
				.update(users)
				.set({
					adminLevel,
					isAdmin: adminLevel >= AdminLevel.ADMIN,
					updatedAt: new Date(),
				})
				.where(eq(users.id, userId))
				.returning();

			return updatedUser;
		}),

	toggleUserStatus: adminProcedure
		.input(z.object({ userId: z.string(), isActive: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			const { userId, isActive } = input;

			const user = await ctx.db.query.users.findFirst({
				where: eq(users.id, userId),
			});

			if (!user) {
				throw new TRPCError({ code: "NOT_FOUND", message: "用户不存在" });
			}

			if (userId === ctx.user.id && !isActive) {
				throw new TRPCError({ code: "FORBIDDEN", message: "不能禁用自己的账户" });
			}

			if (
				!isActive &&
				user.isAdmin &&
				(user.adminLevel ?? 0) >= 2 &&
				(ctx.user.adminLevel ?? 0) < 2
			) {
				throw new TRPCError({ code: "FORBIDDEN", message: "管理员不能禁用超级管理员" });
			}

			const [updatedUser] = await ctx.db
				.update(users)
				.set({ isActive, updatedAt: new Date() })
				.where(eq(users.id, userId))
				.returning();

			return updatedUser;
		}),

	banUser: adminProcedure
		.input(
			z.object({
				userId: z.string(),
				reason: z.string().optional(),
				expiresAt: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { userId, reason, expiresAt } = input;

			const user = await ctx.db.query.users.findFirst({
				where: eq(users.id, userId),
			});

			if (!user) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "用户不存在",
				});
			}

			if (userId === ctx.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "不能封禁自己",
				});
			}

			const [updatedUser] = await ctx.db
				.update(users)
				.set({
					banned: true,
					banReason: reason || "违反平台规则",
					banExpires: expiresAt ? new Date(expiresAt) : null,
					updatedAt: new Date(),
				})
				.where(eq(users.id, userId))
				.returning();

			return updatedUser;
		}),

	unbanUser: adminProcedure
		.input(z.object({ userId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const user = await ctx.db.query.users.findFirst({
				where: eq(users.id, input.userId),
			});

			if (!user) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "用户不存在",
				});
			}

			const [updatedUser] = await ctx.db
				.update(users)
				.set({
					banned: false,
					banReason: null,
					banExpires: null,
					updatedAt: new Date(),
				})
				.where(eq(users.id, input.userId))
				.returning();

			return updatedUser;
		}),
});
