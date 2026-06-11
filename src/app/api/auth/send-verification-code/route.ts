import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { users } from "@/drizzle/schemas/users";
import { db } from "@/lib/db";
import { sendVerificationCode } from "@/lib/email/sender";
import { logger } from "@/lib/logger";
import { rateLimitByIP } from "@/lib/rate-limiter";
import { generateAndStoreCode } from "@/lib/verification-code";

const requestSchema = z.object({
	email: z.string().email("请输入有效的邮箱地址"),
	turnstileToken: z.string().optional(),
});

// 双语错误消息 — 通过 Referer 判断用户当前界面语言
function errorMessage(zh: string, en: string, request: Request): string {
	// 优先用 referer 中的 /zh/ 或 /en/ 判断用户当前语言
	const referer = request.headers.get("referer") || "";
	const refererMatch = referer.match(/\/(zh|en)\//);
	if (refererMatch) {
		return refererMatch[1] === "zh" ? zh : en;
	}
	// 回退到 accept-language
	const acceptLang = request.headers.get("accept-language") || "";
	return acceptLang.includes("zh") ? zh : en;
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const parsed = requestSchema.safeParse(body);

		if (!parsed.success) {
			const errMsg = errorMessage(
				parsed.error.issues[0]?.message || "参数错误",
				parsed.error.issues[0]?.message || "Invalid parameters",
				request,
			);
			return NextResponse.json({ success: false, error: errMsg }, { status: 400 });
		}

		const { email, turnstileToken } = parsed.data;

		// 0. 检查邮箱是否已注册（在发送验证码前拦截）
		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, email.toLowerCase().trim()),
		});
		if (existingUser) {
			return NextResponse.json(
				{
					success: false,
					error: errorMessage(
						"该邮箱已注册，请直接登录",
						"This email is already registered. Please sign in instead.",
						request,
					),
				},
				{ status: 409 },
			);
		}

		// 1. 验证 Turnstile token
		if (process.env.TURNSTILE_SECRET_KEY) {
			if (!turnstileToken) {
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

			const ip =
				request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
				request.headers.get("x-real-ip") ||
				"127.0.0.1";

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
				logger.warn("Turnstile siteverify failed", {
					email,
					action: "turnstile_failed",
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

		// 2. IP 级别限流：每 IP 每分钟最多 3 次
		const ipLimit = await rateLimitByIP("send_code", { windowMs: 60_000, maxRequests: 3 });
		if (!ipLimit.allowed) {
			return NextResponse.json(
				{
					success: false,
					error: errorMessage(
						"请求过于频繁，请稍后再试",
						"Too many requests. Please try again later.",
						request,
					),
				},
				{ status: 429, headers: { "Retry-After": String(Math.ceil(ipLimit.timeToReset / 1000)) } },
			);
		}

		// 3. 生成验证码
		const { code, error: codeError } = await generateAndStoreCode(email);
		if (codeError) {
			return NextResponse.json({ success: false, error: codeError }, { status: 429 });
		}

		// 4. 发送邮件
		const { success, error: sendError } = await sendVerificationCode(email, code);
		if (!success) {
			logger.error("Failed to send verification email", new Error(sendError || "未知错误"), {
				email,
				action: "send_email_failed",
			});
			return NextResponse.json(
				{
					success: false,
					error: errorMessage(
						"验证码发送失败，请稍后重试",
						"Failed to send verification code. Please try again later.",
						request,
					),
				},
				{ status: 500 },
			);
		}

		logger.info("Verification code sent", { email, action: "code_sent" });

		return NextResponse.json({ success: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : "未知错误";
		const errObj = error instanceof Error ? error : new Error(message);
		logger.error("Send verification code error", errObj, { action: "send_code_error" });
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
