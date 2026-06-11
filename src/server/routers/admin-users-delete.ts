import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, ilike, isNotNull, or } from "drizzle-orm";
import { z } from "zod";
import { users } from "@/drizzle/schemas";
import { createTRPCRouter, superAdminProcedure } from "../server";

export const adminUsersDeleteRouter = createTRPCRouter({
	getDeletedUsers: superAdminProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(20),
				search: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { page, limit, search } = input;

			const conditions = [isNotNull(users.deletedAt)];

			if (search) {
				const searchCondition = or(
					ilike(users.email, `%${search}%`),
					ilike(users.fullName, `%${search}%`),
				);
				if (searchCondition) {
					conditions.push(searchCondition);
				}
			}

			const totalResult = await ctx.db
				.select({ total: count() })
				.from(users)
				.where(and(...conditions));

			const total = totalResult[0]?.total || 0;

			const deletedUsers = await ctx.db
				.select()
				.from(users)
				.where(and(...conditions))
				.orderBy(desc(users.deletedAt))
				.limit(limit)
				.offset((page - 1) * limit);

			return {
				users: deletedUsers,
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			};
		}),

	restoreUser: superAdminProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const user = await ctx.db.query.users.findFirst({
				where: eq(users.id, input.id),
			});

			if (!user) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "用户不存在",
				});
			}

			if (!user.deletedAt) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "该用户未被删除",
				});
			}

			const [restoredUser] = await ctx.db
				.update(users)
				.set({
					deletedAt: null,
					isActive: true,
					updatedAt: new Date(),
				})
				.where(eq(users.id, input.id))
				.returning();

			return restoredUser;
		}),

	softDeleteUser: superAdminProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const user = await ctx.db.query.users.findFirst({
				where: eq(users.id, input.id),
			});

			if (!user) {
				throw new TRPCError({ code: "NOT_FOUND", message: "用户不存在" });
			}

			if (input.id === ctx.user.id) {
				throw new TRPCError({ code: "FORBIDDEN", message: "不能删除自己的账户" });
			}

			const [updatedUser] = await ctx.db
				.update(users)
				.set({
					deletedAt: new Date(),
					isActive: false,
					updatedAt: new Date(),
				})
				.where(eq(users.id, input.id))
				.returning();

			return updatedUser;
		}),
});
