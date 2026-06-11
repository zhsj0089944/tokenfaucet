import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, gt, ilike, or } from "drizzle-orm";
import { z } from "zod";
import {
	membershipPlans,
	pointTransactions,
	sessions,
	userMemberships,
	userPoints,
	users,
} from "@/drizzle/schemas";
import { auth } from "@/lib/auth/better-auth/server";
import { adminProcedure, createTRPCRouter } from "../server";

export const adminUsersCrudRouter = createTRPCRouter({
	getUsers: adminProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(20),
				search: z.string().optional(),
				sortBy: z.enum(["createdAt", "email", "fullName", "lastLoginAt"]).default("createdAt"),
				sortOrder: z.enum(["asc", "desc"]).default("desc"),
				isActive: z.boolean().optional(),
				isAdmin: z.boolean().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { page, limit, search, sortBy, sortOrder, isActive, isAdmin } = input;

			const conditions = [];

			if (search) {
				const searchCondition = or(
					ilike(users.email, `%${search}%`),
					ilike(users.fullName, `%${search}%`),
				);
				if (searchCondition) {
					conditions.push(searchCondition);
				}
			}

			if (isActive !== undefined) {
				conditions.push(eq(users.isActive, isActive));
			}

			if (isAdmin !== undefined) {
				conditions.push(eq(users.isAdmin, isAdmin));
			}

			const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

			const totalResult = await ctx.db.select({ total: count() }).from(users).where(whereClause);
			const total = totalResult[0]?.total || 0;

			const validSortFields = ["createdAt", "email", "fullName", "lastLoginAt"] as const;
			type SortField = (typeof validSortFields)[number];
			const sortField: SortField = validSortFields.includes(sortBy as SortField)
				? (sortBy as SortField)
				: "createdAt";
			const orderColumn = users[sortField];
			const orderDirection = sortOrder === "asc" ? asc(orderColumn) : desc(orderColumn);

			const userList = await ctx.db
				.select({
					user: users,
					membership: userMemberships,
					plan: membershipPlans,
				})
				.from(users)
				.leftJoin(
					userMemberships,
					and(
						eq(users.id, userMemberships.userId),
						eq(userMemberships.status, "active"),
						gt(userMemberships.endDate, new Date()),
					),
				)
				.leftJoin(membershipPlans, eq(userMemberships.planId, membershipPlans.id))
				.where(whereClause)
				.orderBy(orderDirection)
				.limit(limit)
				.offset((page - 1) * limit);

			const formattedUsers = userList.map(({ user, membership, plan }) => ({
				...user,
				membership: membership
					? {
							id: membership.id,
							planId: membership.planId,
							planName: plan?.nameZh || plan?.name || "未知计划",
							status: membership.status,
							startDate: membership.startDate,
							endDate: membership.endDate,
							durationType: membership.durationType,
							autoRenew: membership.autoRenew,
						}
					: null,
			}));

			return {
				users: formattedUsers,
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			};
		}),

	getUserById: adminProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
		const user = await ctx.db.query.users.findFirst({
			where: eq(users.id, input.id),
		});

		if (!user) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "用户不存在",
			});
		}

		const [lastSession] = await ctx.db
			.select({ lastActiveAt: sessions.lastActiveAt })
			.from(sessions)
			.where(eq(sessions.userId, input.id))
			.orderBy(desc(sessions.lastActiveAt))
			.limit(1);

		const pointSummary = await ctx.db
			.select({
				totalGranted: userPoints.totalGranted,
				totalConsumed: userPoints.totalConsumed,
				dailyBalance: userPoints.dailyBalance,
				monthlyBalance: userPoints.monthlyBalance,
			})
			.from(userPoints)
			.where(eq(userPoints.userId, input.id))
			.limit(1);

		const recentTransactions = await ctx.db
			.select({
				type: pointTransactions.type,
				amount: pointTransactions.amount,
				description: pointTransactions.description,
				createdAt: pointTransactions.createdAt,
			})
			.from(pointTransactions)
			.where(eq(pointTransactions.userId, input.id))
			.orderBy(desc(pointTransactions.createdAt))
			.limit(5);

		return {
			...user,
			lastLoginAt: lastSession?.lastActiveAt || null,
			pointSummary: pointSummary[0] || {
				totalGranted: 0,
				totalConsumed: 0,
				dailyBalance: 0,
				monthlyBalance: 0,
			},
			recentTransactions,
		};
	}),

	updateUser: adminProcedure
		.input(
			z.object({
				id: z.string(),
				fullName: z.string().optional(),
				isActive: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...updateData } = input;

			const existingUser = await ctx.db.query.users.findFirst({
				where: eq(users.id, id),
			});

			if (!existingUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "用户不存在",
				});
			}

			const [updatedUser] = await ctx.db
				.update(users)
				.set({
					...updateData,
					updatedAt: new Date(),
				})
				.where(eq(users.id, id))
				.returning();

			return updatedUser;
		}),

	createUser: adminProcedure
		.input(
			z.object({
				email: z.string().email(),
				fullName: z.string().min(1),
				password: z.string().min(6),
				adminLevel: z.number().min(0).max(2).default(0),
				isActive: z.boolean().default(true),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existingUser = await ctx.db.query.users.findFirst({
				where: eq(users.email, input.email),
			});

			if (existingUser) {
				throw new TRPCError({ code: "CONFLICT", message: "邮箱已存在" });
			}

			const result = await auth.api.signUpEmail({
				body: {
					email: input.email,
					password: input.password,
					name: input.fullName,
				},
			});

			if (result.user) {
				await ctx.db
					.update(users)
					.set({
						fullName: input.fullName,
						isAdmin: input.adminLevel >= 1,
						adminLevel: input.adminLevel,
						isActive: input.isActive,
						banned: false,
						updatedAt: new Date(),
					})
					.where(eq(users.id, result.user.id));
			}

			return result.user;
		}),
});
