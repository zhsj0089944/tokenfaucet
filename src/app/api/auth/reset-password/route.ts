import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/better-auth/server";
import { logger } from "@/lib/logger";
import { RateLimitUtils } from "@/lib/rate-limiter";

const requestSchema = z.object({
	token: z.string().min(1, "无效的重置链接"),
	password: z.string().min(6, "密码至少需要6个字符"),
});

function errorMessage(zh: string, en: string, request: NextRequest): string {
	const referer = request.headers.get("referer") || "";
	const refererMatch = referer.match(/\/(zh|en)\//);
	if (refererMatch) {
		return refererMatch[1] === "zh" ? zh : en;
	}
	const acceptLang = request.headers.get("accept-language") || "";
	return acceptLang.includes("zh") ? zh : en;
}

export async function POST(request: NextRequest) {
	// 安全：密码重置端点添加速率限制，防止暴力破解
	const rateLimitResult = await RateLimitUtils.checkAuthLimit(request, "passwordReset");
	if (!rateLimitResult.allowed) {
		return NextResponse.json(
			{
				success: false,
				error: errorMessage(
					"密码重置请求过于频繁，请稍后再试",
					"Too many password reset requests. Please try again later.",
					request,
				),
			},
			{ status: 429 },
		);
	}

	try {
		const body = await request.json();
		const parsed = requestSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{
					success: false,
					error: errorMessage(
						parsed.error.issues[0]?.message || "参数错误",
						"Invalid parameters",
						request,
					),
				},
				{ status: 400 },
			);
		}

		const { token, password } = parsed.data;

		// 调用 Better Auth 的密码重置
		try {
			await auth.api.resetPassword({
				body: { token, newPassword: password },
				headers: new Headers({ "Content-Type": "application/json" }),
			});

			logger.info("密码重置成功", { action: "password_reset_success" });
			return NextResponse.json({ success: true });
		} catch (authErr: unknown) {
			const authErrMsg = authErr instanceof Error ? authErr.message : String(authErr);
			logger.warn("Better Auth resetPassword 失败", {
				error: authErrMsg,
			});
			return NextResponse.json(
				{
					success: false,
					error: errorMessage(
						"重置链接无效或已过期，请重新发起密码重置",
						"Reset link invalid or expired. Please request a new password reset.",
						request,
					),
				},
				{ status: 400 },
			);
		}
	} catch (error) {
		const errObj = error instanceof Error ? error : new Error(String(error));
		logger.error("Reset password error", errObj);
		return NextResponse.json(
			{
				success: false,
				error: errorMessage("服务器错误", "Server error", request),
			},
			{ status: 500 },
		);
	}
}
