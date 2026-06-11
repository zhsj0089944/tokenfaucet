import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { rateLimitByIP } from "@/lib/rate-limiter";
import { verifyCode } from "@/lib/verification-code";

const requestSchema = z.object({
	email: z.string().email("请输入有效的邮箱地址"),
	code: z.string().length(6, "验证码为6位数字"),
});

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const parsed = requestSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ success: false, error: parsed.error.issues[0]?.message || "参数错误" },
				{ status: 400 },
			);
		}

		const { email, code } = parsed.data;

		// IP 级别限流：每 IP 每分钟最多 10 次验证尝试
		const ipLimit = await rateLimitByIP("verify_code", { windowMs: 60_000, maxRequests: 10 });
		if (!ipLimit.allowed) {
			return NextResponse.json(
				{ success: false, error: "验证尝试过于频繁，请稍后再试" },
				{ status: 429, headers: { "Retry-After": String(Math.ceil(ipLimit.timeToReset / 1000)) } },
			);
		}

		// 验证验证码
		const result = await verifyCode(email, code);
		if (!result.success) {
			logger.warn("Code verification failed", {
				email,
				action: "verify_code_failed",
				remaining: result.remaining,
			});
			return NextResponse.json({ success: false, error: result.error }, { status: 400 });
		}

		logger.info("Code verified successfully", { email, action: "verify_code_success" });

		return NextResponse.json({ success: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : "未知错误";
		const errObj = error instanceof Error ? error : new Error(message);
		logger.error("Verify code error", errObj, { action: "verify_code_error" });
		return NextResponse.json({ success: false, error: "服务器错误，请稍后重试" }, { status: 500 });
	}
}
