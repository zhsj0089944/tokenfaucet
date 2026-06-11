import type { TRPCLink } from "@trpc/client";
import { logger } from "@/lib/logger";
import type { AppRouter } from "./root";

/**
 * Better Auth 认证链接
 *
 * Better Auth 主要使用 HTTP-only cookies 进行身份验证，
 * 所以我们只需要确保请求包含正确的 credentials 和 headers
 */
export const authLink: TRPCLink<AppRouter> = () => {
	return ({ next, op }) => {
		// Better Auth 主要依赖 HTTP-only cookies，
		// 我们只需要确保请求正确配置
		op.context = {
			...op.context,
			headers: {
				...(op.context.headers || {}),
				// 确保包含必要的 headers
				"Content-Type": "application/json",
			},
		};

		logger.debug("tRPC Auth Link: Processing operation", {
			operationType: op.type,
			operationPath: op.path,
		});

		return next(op);
	};
};
