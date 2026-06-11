import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/better-auth/server";
import { logger } from "@/lib/logger";

const requestSchema = z.object({
	email: z.string().email("请输入有效的邮箱地址"),
	turnstileToken: z.string().optional(),
});

// 双语错误消息
function errorMessage(zh: string, en: string, request: NextRequest): string {
	const referer = request.headers.get("referer") || "";
	const refererMatch = referer.match(/\/(zh|en)\//);
	if (refererMatch) {
		return refererMatch[1] === "zh" ? zh : en;
	}
	const acceptLang = request.headers.get("accept-language") || "";
	return acceptLang.includes("zh") ? zh : en;
}

// 速率限制（简单内存版，生产环境建议用 Redis）
function checkRateLimit(ip: string): boolean {
	if (!global.resetPasswordRateLimit) {
		global.resetPasswordRateLimit = new Map<string, { count: number; resetAt: number }>();
	}
	const now = Date.now();
	const entry = global.resetPasswordRateLimit.get(ip);

	// 窗口期 60 秒
	if (entry && now - entry.resetAt < 60_000) {
		if (entry.count >= 1) return false; // 已达上限
		entry.count++;
	} else {
		global.resetPasswordRateLimit.set(ip, { count: 1, resetAt: now });
	}
	return true;
}

export async function POST(request: NextRequest) {
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

		const { email, turnstileToken } = parsed.data;
		const ip =
			request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
			request.headers.get("x-real-ip") ||
			"127.0.0.1";

		// 1. 验证 Turnstile token
		if (process.env.TURNSTILE_SECRET_KEY) {
			if (!turnstileToken) {
				logger.warn("Missing Turnstile token for forgot-password", {
					email,
					action: "turnstile_missing",
					ip,
				});
				return NextResponse.json(
					{
						success: false,
						error: errorMessage(
							"人机验证未完成，请先通过验证",
							"Please complete the verification first.",
							request,
						),
					},
					{ status: 400 },
				);
			}

			const turnstileResult = await fetch(
				"https://challenges.cloudflare.com/turnstile/v0/siteverify",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						secret: process.env.TURNSTILE_SECRET_KEY,
						response: turnstileToken,
						remoteip: ip,
					}),
				},
			);

			const turnstileData = await turnstileResult.json();
			if (!turnstileData.success) {
				const errorCodes = turnstileData["error-codes"] || [];
				logger.warn("Turnstile siteverify failed for forgot-password", {
					email,
					errorCodes,
					ip,
				});
				return NextResponse.json(
					{
						success: false,
						error: errorMessage(
							"人机验证失败，请重试",
							"Verification failed, please try again.",
							request,
						),
					},
					{ status: 400 },
				);
			}
		}

		// 2. 速率限制：同一 IP 每分钟最多 1 次
		if (!checkRateLimit(ip)) {
			return NextResponse.json(
				{
					success: false,
					error: errorMessage("请稍后再试", "Please wait a moment before trying again.", request),
				},
				{ status: 429 },
			);
		}

		// 3. 调用 Better Auth 的 forgotPassword（内部会查找用户并发送邮件）
		// 无论用户存不存在，Better Auth 都会返回成功（防止枚举攻击）
		// 从 referer 提取 locale，用于构造重置链接
		const referer = request.headers.get("referer") || "";
		const localeMatch = referer.match(/\/(zh|en)\//);
		const locale = localeMatch?.[1] || "zh";

		try {
			await auth.api.requestPasswordReset({
				body: {
					email: email.toLowerCase().trim(),
					redirectTo: `/${locale}/auth/reset-password`,
				},
				headers: request.headers,
			});
			logger.info("密码重置请求已处理", { email: email.toLowerCase().trim() });
		} catch (authErr) {
			logger.warn("Better Auth forgotPassword 调用异常", {
				email: email.toLowerCase().trim(),
				error: authErr instanceof Error ? authErr.message : String(authErr),
			});
			// 仍然返回成功，不暴露具体错误
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		const errObj = error instanceof Error ? error : new Error(String(error));
		logger.error("Forgot password error", errObj, { action: "forgot_password_error" });
		return NextResponse.json(
			{
				success: false,
				error: errorMessage(
					"服务器错误，请稍后重试",
					"Server error. Please try again later.",
					request,
				),
			},
			{ status: 500 },
		);
	}
}

// 简单的内存限流 Map
declare global {
	// eslint-disable-next-line no-var
	var resetPasswordRateLimit: Map<string, { count: number; resetAt: number }> | undefined;
}
