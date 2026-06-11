import { cacheService } from "@/lib/cache";
import { logger } from "@/lib/logger";

const CODE_LENGTH = 6;
const CODE_TTL_SECONDS = 60; // 60 秒，与发送冷却时间一致
const MAX_ATTEMPTS = 5;
const SEND_COOLDOWN_SECONDS = 60; // 同一邮箱 60 秒内只能发送一次

function codeKey(email: string): string {
	return `verification_code:${email.toLowerCase().trim()}`;
}

function cooldownKey(email: string): string {
	return `verification_cooldown:${email.toLowerCase().trim()}`;
}

interface StoredCode {
	code: string;
	attempts: number;
	createdAt: number;
}

/**
 * 生成 6 位数字验证码并存入缓存
 */
export async function generateAndStoreCode(email: string): Promise<{
	code: string;
	error?: string;
}> {
	const normalizedEmail = email.toLowerCase().trim();
	const key = codeKey(normalizedEmail);
	const ck = cooldownKey(normalizedEmail);

	// 检查发送冷却时间
	const existingCooldown = await cacheService.get(ck);
	if (existingCooldown) {
		return { code: "", error: "发送过于频繁，请 60 秒后再试" };
	}

	// 生成 6 位随机数字
	const code = Array.from({ length: CODE_LENGTH }, () => Math.floor(Math.random() * 10)).join("");

	const stored: StoredCode = {
		code,
		attempts: 0,
		createdAt: Date.now(),
	};

	// 存储验证码
	await cacheService.set(key, JSON.stringify(stored), CODE_TTL_SECONDS);

	// 设置发送冷却
	await cacheService.set(ck, "1", SEND_COOLDOWN_SECONDS);

	logger.info("Verification code generated", {
		email: normalizedEmail,
		action: "generate_code",
	});

	return { code };
}

/**
 * 验证验证码
 * - 成功：删除缓存
 * - 失败：增加尝试次数，返回剩余次数
 */
export async function verifyCode(
	email: string,
	inputCode: string,
): Promise<{ success: boolean; error?: string; remaining?: number }> {
	const normalizedEmail = email.toLowerCase().trim();
	const key = codeKey(normalizedEmail);

	const raw = await cacheService.get(key);
	if (!raw) {
		return { success: false, error: "验证码已过期，请重新获取" };
	}

	let stored: StoredCode;
	try {
		stored = JSON.parse(raw as string);
	} catch {
		return { success: false, error: "验证码数据异常，请重新获取" };
	}

	// 检查是否超过最大尝试次数
	if (stored.attempts >= MAX_ATTEMPTS) {
		await cacheService.del(key);
		logger.warn("Verification code max attempts exceeded", {
			email: normalizedEmail,
			action: "max_attempts",
		});
		return { success: false, error: "尝试次数过多，验证码已失效，请重新获取" };
	}

	// 比较验证码
	if (stored.code !== inputCode.trim()) {
		stored.attempts++;
		const remainingAttempts = MAX_ATTEMPTS - stored.attempts;
		// 更新剩余尝试次数
		const ttl = await cacheService.ttl(key);
		await cacheService.set(key, JSON.stringify(stored), ttl > 0 ? ttl : CODE_TTL_SECONDS);

		logger.warn("Verification code mismatch", {
			email: normalizedEmail,
			action: "code_mismatch",
			attempts: stored.attempts,
		});

		return {
			success: false,
			error: `验证码错误，还剩 ${remainingAttempts} 次机会`,
			remaining: remainingAttempts,
		};
	}

	// 验证成功，删除验证码缓存和冷却限制
	await cacheService.del(key);
	await cacheService.del(cooldownKey(normalizedEmail));

	logger.info("Verification code verified successfully", {
		email: normalizedEmail,
		action: "code_verified",
	});

	return { success: true };
}
