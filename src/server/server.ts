import { initTRPC, TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { users } from "@/drizzle/schemas";
import { auth } from "@/lib/auth/better-auth/server";
import { db } from "@/lib/db";
import { createRequestLogger, type Logger } from "@/lib/logger";

/**
 * 创建tRPC上下文
 * 包含数据库连接、用户信息、结构化日志器
 */
export async function createTRPCContext({ req }: { req: NextRequest }) {
	// 生成请求 ID（优先使用已有 header）
	const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
	let ctxLogger = createRequestLogger(requestId);

	// 使用Better Auth API直接验证会话
	let user = null;
	let userId: string | null = null;

	try {
		// 从请求中获取会话信息
		const session = await auth.api.getSession({
			headers: req.headers as unknown as Record<string, string>,
		});

		if (session?.user) {
			// 从数据库获取完整用户信息（包括角色等扩展字段）
			const dbUser = await db.query.users.findFirst({
				where: eq(users.id, session.user.id),
			});

			user = dbUser
				? {
						...session.user,
						...dbUser,
						// 解析 preferences JSON 字符串（带错误保护）
						preferences: (() => {
							if (!dbUser.preferences) return null;
							if (typeof dbUser.preferences !== "string") return dbUser.preferences;
							try {
								return JSON.parse(dbUser.preferences);
							} catch {
								ctxLogger.warn("tRPC context - 解析用户 preferences 失败");
								return null;
							}
						})(),
					}
				: session.user;

			userId = session.user.id;
			ctxLogger = createRequestLogger(requestId, userId);
		}
	} catch (error) {
		ctxLogger.error("tRPC context - 获取用户会话失败", error instanceof Error ? error : undefined);
		// 继续执行，user 和 userId 保持 null
	}

	const logger: Logger = ctxLogger;

	return {
		db,
		userId,
		user,
		headers: req.headers,
		logger,
	};
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * 初始化tRPC
 */
const t = initTRPC.context<Context>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
			},
		};
	},
});

/**
 * 创建tRPC路由器
 */
export const createTRPCRouter = t.router;

/**
 * 公开过程 - 不需要认证
 */
export const publicProcedure = t.procedure;

/**
 * 受保护的过程 - 需要用户认证
 * 同时检查用户是否被封禁或禁用
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!(ctx.userId && ctx.user)) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "请先登录",
		});
	}

	// 检查用户是否被软删除（使用类型断言访问扩展字段）
	if ((ctx.user as { deletedAt?: Date | null }).deletedAt) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "账户已被删除，如有疑问请联系客服",
		});
	}

	// 检查用户是否被禁用
	if (ctx.user.isActive === false) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "账户已被禁用，如有疑问请联系客服",
		});
	}

	// 检查用户是否被封禁
	if (ctx.user.banned) {
		// 检查封禁是否已过期
		if (ctx.user.banExpires && new Date(ctx.user.banExpires) < new Date()) {
			// 封禁已过期，允许继续（可选：自动解封）
			ctx.logger.info("用户封禁已过期，允许访问", { userId: ctx.userId });
		} else {
			const banReason = ctx.user.banReason || "违反平台规则";
			const banExpiresText = ctx.user.banExpires
				? `封禁至 ${new Date(ctx.user.banExpires).toLocaleDateString("zh-CN")}`
				: "永久封禁";
			throw new TRPCError({
				code: "FORBIDDEN",
				message: `账户已被封禁：${banReason}（${banExpiresText}）`,
			});
		}
	}

	return next({
		ctx: {
			...ctx,
			userId: ctx.userId,
			user: ctx.user,
		},
	});
});

/**
 * 内部过程 - 仅供服务器内部调用（如webhook），不进行用户认证检查
 * 重要：使用此过程前必须自行验证调用来源（如通过Creem签名验证或INTERNAL_API_KEY）
 * 安全：通过INTERNAL_API_KEY验证调用来源
 */
export const internalProcedure = t.procedure.use(async ({ ctx, next }) => {
	// 检查内部API Key（如果配置了的话）
	const internalApiKey = process.env.INTERNAL_API_KEY;
	if (internalApiKey) {
		// 从请求头中获取内部API Key
		const requestHeaders = ctx.headers;
		const providedKey = requestHeaders?.get("x-internal-api-key");

		if (providedKey !== internalApiKey) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "无效的内部API密钥",
			});
		}
	}

	return next({
		ctx,
	});
});

/**
 * 管理员过程 - 需要管理员权限
 * 只使用 adminLevel 字段判断权限：adminLevel >= 1 为管理员
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
	if ((ctx.user?.adminLevel ?? 0) < 1) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "需要管理员权限",
		});
	}

	return next({
		ctx,
	});
});

/**
 * 超级管理员过程 - 需要超级管理员权限
 * 只使用 adminLevel 字段判断权限：adminLevel >= 2 为超级管理员
 */
export const superAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
	if ((ctx.user?.adminLevel ?? 0) < 2) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "需要超级管理员权限",
		});
	}

	return next({
		ctx,
	});
});

/**
 * 中间件：日志记录
 */
export const loggerMiddleware = t.middleware(async ({ path, type, next, ctx }) => {
	const start = Date.now();
	const result = await next();
	const durationMs = Date.now() - start;

	// 使用上下文的结构化日志器
	const logContext = { path, durationMs };
	if (result.ok) {
		ctx.logger.info(`${type} ${path}`, logContext);
	} else {
		ctx.logger.error(`${type} ${path}`, result.error as Error | undefined, logContext);
	}

	return result;
});

/**
 * 带日志的公开过程
 */
export const loggedPublicProcedure = publicProcedure.use(loggerMiddleware);

/**
 * 带日志的受保护过程
 */
export const loggedProtectedProcedure = protectedProcedure.use(loggerMiddleware);
