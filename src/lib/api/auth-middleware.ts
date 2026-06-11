import { type NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/better-auth/permissions";

/**
 * 验证用户是否已认证
 */
export async function validateAuth(_request: NextRequest): Promise<{
	authenticated: boolean;
	userId?: string;
	error?: string;
}> {
	try {
		const session = await getCurrentSession();

		if (!session?.user) {
			return {
				authenticated: false,
				error: "请先登录",
			};
		}

		return {
			authenticated: true,
			userId: session.user.id,
		};
	} catch (_error) {
		return {
			authenticated: false,
			error: "认证检查失败",
		};
	}
}

/**
 * 创建认证检查中间件处理器（支持流式响应）
 */
export function withAuth(
	handler: (req: NextRequest, context: { userId: string }) => Promise<Response>,
) {
	return async (req: NextRequest) => {
		const authResult = await validateAuth(req);

		if (!authResult.authenticated) {
			return NextResponse.json({ error: authResult.error || "未授权访问" }, { status: 401 });
		}

		return handler(req, { userId: authResult.userId as string });
	};
}
