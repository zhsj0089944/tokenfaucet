import { Resend } from "resend";
import { env } from "@/env";
import { logger } from "@/lib/logger";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const FROM_EMAIL = "TokenFaucet <noreply@tokenfaucet.fun>";

// ===============================
// 配置常量
// ===============================

/** 最大重试次数 */
const MAX_RETRIES = 3;

/** 基础延迟时间（毫秒），指数退避将基于此计算 */
const BASE_RETRY_DELAY_MS = 1000;

/** 可重试的错误状态码 */
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

/** 邮件优先级枚举 */
export enum EmailPriority {
	/** 关键邮件（验证码、支付等）- 重试直到成功 */
	CRITICAL = "critical",
	/** 普通邮件（会员到期提醒等）- 失败时仅记录日志 */
	STANDARD = "standard",
}

// ===============================
// 指数退避延迟计算
// ===============================

function calculateBackoffDelay(attempt: number): number {
	const exponentialDelay = BASE_RETRY_DELAY_MS * 2 ** (attempt - 1);
	const jitter = Math.random() * 1000;
	return Math.min(exponentialDelay + jitter, 10000);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// ===============================
// 核心发件函数（带重试）
// ===============================

async function sendEmailInternal(
	{
		to,
		subject,
		html,
	}: {
		to: string;
		subject: string;
		html: string;
	},
	priority: EmailPriority = EmailPriority.STANDARD,
): Promise<{ success: boolean; error?: string; attempts?: number }> {
	if (!resend) {
		logger.warn("[Email] RESEND_API_KEY 未配置，邮件发送跳过", {
			to,
			subject,
			priority,
		});
		return {
			success: false,
			error: "邮件服务未配置 (RESEND_API_KEY)",
			attempts: 0,
		};
	}

	let lastError: Error | null = null;
	const maxAttempts = priority === EmailPriority.CRITICAL ? MAX_RETRIES : 1;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			logger.debug(`[Email] 发送邮件尝试 ${attempt}/${maxAttempts}`, {
				to,
				subject,
				priority,
			});

			const { error } = await resend.emails.send({
				from: FROM_EMAIL,
				to,
				subject,
				html,
			});

			if (error) {
				lastError = new Error(error.message);

				const shouldRetry =
					attempt < maxAttempts &&
					(error.statusCode ? RETRYABLE_STATUS_CODES.has(error.statusCode) : true);

				if (shouldRetry) {
					logger.warn(`[Email] 发送失败，${calculateBackoffDelay(attempt)}ms 后重试`, {
						to,
						subject,
						error: error.message,
						statusCode: error.statusCode,
						attempt,
						maxAttempts,
					});
					await sleep(calculateBackoffDelay(attempt));
					continue;
				}

				logger.error("[Email] 邮件发送最终失败", lastError, {
					to,
					subject,
					statusCode: error.statusCode,
					attempts: attempt,
				});

				return {
					success: false,
					error: error.message,
					attempts: attempt,
				};
			}

			if (attempt > 1) {
				logger.info("[Email] 邮件发送成功（重试后）", {
					to,
					subject,
					attempts: attempt,
				});
			}

			return {
				success: true,
				attempts: attempt,
			};
		} catch (err) {
			lastError = err instanceof Error ? err : new Error(String(err));

			const shouldRetry = attempt < maxAttempts;
			if (shouldRetry) {
				logger.warn(`[Email] 发送异常，${calculateBackoffDelay(attempt)}ms 后重试`, {
					to,
					subject,
					error: lastError.message,
					attempt,
					maxAttempts,
				});
				await sleep(calculateBackoffDelay(attempt));
				continue;
			}

			logger.error("[Email] 邮件发送最终异常", lastError, {
				to,
				subject,
				attempts: attempt,
			});

			return {
				success: false,
				error: lastError.message,
				attempts: attempt,
			};
		}
	}

	return {
		success: false,
		error: lastError?.message || "发送失败",
		attempts: maxAttempts,
	};
}

// ===============================
// 现有邮件
// ===============================

/**
 * 发送邮箱验证码
 */
export async function sendVerificationCode(
	to: string,
	code: string,
): Promise<{ success: boolean; error?: string }> {
	const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; background-color: #f9fafb;">
  <div style="background: #ffffff; border-radius: 16px; padding: 40px 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #1a1a2e; font-size: 22px; margin: 0 0 6px 0;">TokenFaucet</h1>
      <p style="color: #6b7280; font-size: 13px; margin: 0;">Email Verification / 邮箱验证</p>
    </div>
    <div style="text-align: center; margin-bottom: 28px;">
      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 4px 0;">
        You are signing up for a TokenFaucet account.<br/>
        您正在注册 TokenFaucet 账户。
      </p>
      <p style="color: #6b7280; font-size: 13px; margin: 0;">
        Please enter the verification code below to complete verification.<br/>
        请输入以下验证码完成验证。
      </p>
    </div>
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 20px; margin-bottom: 28px; text-align: center;">
      <span style="font-size: 38px; font-weight: bold; color: #ffffff; letter-spacing: 10px; font-family: 'Courier New', monospace;">${code}</span>
    </div>
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
      <p style="color: #9ca3af; font-size: 12px; line-height: 1.8; margin: 0; text-align: center;">
        Valid for 60 seconds. Do not share with anyone.<br/>
        验证码 60 秒内有效，请勿泄露给他人。
      </p>
      <p style="color: #d1d5db; font-size: 11px; line-height: 1.8; margin: 12px 0 0 0; text-align: center;">
        If this was not you, please ignore this email.<br/>
        如果这不是您的操作，请忽略此邮件。
      </p>
    </div>
  </div>
</body>
</html>`;

	const result = await sendEmailInternal(
		{
			to,
			subject: `Verification Code: ${code} / 验证码：${code} — TokenFaucet`,
			html,
		},
		EmailPriority.CRITICAL,
	);

	return { success: result.success, error: result.error };
}

/**
 * 发送密码重置邮件
 */
export async function sendPasswordResetEmail(
	to: string,
	username: string,
	resetUrl: string,
): Promise<{ success: boolean; error?: string }> {
	const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; background-color: #f9fafb;">
  <div style="background: #ffffff; border-radius: 16px; padding: 40px 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #1a1a2e; font-size: 22px; margin: 0 0 6px 0;">TokenFaucet</h1>
      <p style="color: #6b7280; font-size: 13px; margin: 0;">Password Reset / 密码重置</p>
    </div>
    <div style="text-align: center; margin-bottom: 28px;">
      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 4px 0;">
        Hello ${username || to},<br/>
        We received a request to reset your password.<br/>
        你好 ${username || to}，我们收到了密码重置请求。
      </p>
      <p style="color: #6b7280; font-size: 13px; margin: 0;">
        Click the button below to set a new password. This link will expire in 1 hour.<br/>
        请点击下方按钮设置新密码，链接 1 小时内有效。
      </p>
    </div>
    <div style="text-align: center; margin-bottom: 28px;">
      <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 10px;">
        Reset Password / 重置密码
      </a>
    </div>
    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 28px;">
      <p style="color: #6b7280; font-size: 12px; line-height: 1.8; margin: 0; text-align: center;">
        If you didn't request a password reset, you can safely ignore this email. Your password won't change until you create a new one.<br/>
        如果你没有请求密码重置，请忽略此邮件，在创建新密码前你的账户保持安全。
      </p>
    </div>
    <div style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
      <p style="color: #d1d5db; font-size: 11px; line-height: 1.8; margin: 0; text-align: center;">
        This link will expire in 1 hour. Do not share this email.<br/>
        此链接 1 小时后失效，请勿将此邮件分享给他人。
      </p>
    </div>
  </div>
</body>
</html>`;

	const result = await sendEmailInternal(
		{
			to,
			subject: `Password Reset / 密码重置 — TokenFaucet`,
			html,
		},
		EmailPriority.CRITICAL,
	);

	return { success: result.success, error: result.error };
}

/**
 * 支付成功通知
 */
export async function sendPaymentSuccessEmail(params: {
	to: string;
	username: string;
	planName: string;
	amount: string;
	currency: string;
	durationDays: number;
}): Promise<{ success: boolean; error?: string }> {
	const { to, username, planName, amount, currency, durationDays } = params;
	const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; background-color: #f9fafb;">
  <div style="background: #ffffff; border-radius: 16px; padding: 40px 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #1a1a2e; font-size: 22px; margin: 0 0 6px 0;">TokenFaucet</h1>
      <p style="color: #6b7280; font-size: 13px; margin: 0;">Payment Confirmation / 支付成功</p>
    </div>

    <div style="text-align: center; margin-bottom: 28px;">
      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 4px 0;">
        Hello ${username || to},<br/>
        Your payment was successful!<br/>
        您好 ${username || to}，您的支付已成功！
      </p>
    </div>

    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="color: #6b7280; font-size: 13px; padding: 6px 0;">Plan / 套餐</td>
          <td style="color: #1a1a2e; font-size: 14px; font-weight: 600; text-align: right; padding: 6px 0;">${planName}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; font-size: 13px; padding: 6px 0;">Duration / 时长</td>
          <td style="color: #1a1a2e; font-size: 14px; font-weight: 600; text-align: right; padding: 6px 0;">${durationDays} days / 天</td>
        </tr>
        <tr style="border-top: 1px solid #e5e7eb;">
          <td style="color: #6b7280; font-size: 13px; padding: 10px 0 0 0;">Amount / 金额</td>
          <td style="color: #059669; font-size: 18px; font-weight: bold; text-align: right; padding: 10px 0 0 0;">${currency} ${amount}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-bottom: 28px;">
      <a href="https://tokenfaucet.fun/zh/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 10px;">
        View Dashboard / 查看控制台
      </a>
    </div>

    <div style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
      <p style="color: #d1d5db; font-size: 11px; line-height: 1.8; margin: 0; text-align: center;">
        Thank you for your purchase. Your membership is now active.<br/>
        感谢您的购买，您的会员已激活。
      </p>
    </div>
  </div>
</body>
</html>`;

	const result = await sendEmailInternal(
		{
			to,
			subject: `Payment Successful — TokenFaucet / 支付成功 — TokenFaucet`,
			html,
		},
		EmailPriority.CRITICAL,
	);

	return { success: result.success, error: result.error };
}

/**
 * 支付失败通知
 */
export async function sendPaymentFailedEmail(params: {
	to: string;
	username: string;
	planName: string;
	amount: string;
	currency: string;
}): Promise<{ success: boolean; error?: string }> {
	const { to, username, planName, amount, currency } = params;
	const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; background-color: #f9fafb;">
  <div style="background: #ffffff; border-radius: 16px; padding: 40px 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #1a1a2e; font-size: 22px; margin: 0 0 6px 0;">TokenFaucet</h1>
      <p style="color: #6b7280; font-size: 13px; margin: 0;">Payment Failed / 支付失败</p>
    </div>

    <div style="text-align: center; margin-bottom: 28px;">
      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 4px 0;">
        Hello ${username || to},<br/>
        Unfortunately, your payment could not be processed.<br/>
        您好 ${username || to}，您的支付未能完成。
      </p>
    </div>

    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="color: #6b7280; font-size: 13px; padding: 6px 0;">Plan / 套餐</td>
          <td style="color: #1a1a2e; font-size: 14px; font-weight: 600; text-align: right; padding: 6px 0;">${planName}</td>
        </tr>
        <tr style="border-top: 1px solid #e5e7eb;">
          <td style="color: #6b7280; font-size: 13px; padding: 10px 0 0 0;">Attempted Amount / 支付金额</td>
          <td style="color: #dc2626; font-size: 14px; font-weight: 600; text-align: right; padding: 10px 0 0 0;">${currency} ${amount}</td>
        </tr>
      </table>
      <p style="color: #ef4444; font-size: 12px; margin: 16px 0 0 0; text-align: center;">
        No charges have been made. Please try again later.<br/>
        未产生扣款，请稍后重试。
      </p>
    </div>

    <div style="text-align: center; margin-bottom: 28px;">
      <a href="https://tokenfaucet.fun/zh/membership" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 10px;">
        Try Again / 重新购买
      </a>
    </div>

    <div style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
      <p style="color: #d1d5db; font-size: 11px; line-height: 1.8; margin: 0; text-align: center;">
        If the problem persists, please contact support.<br/>
        如问题持续，请联系客服。
      </p>
    </div>
  </div>
</body>
</html>`;

	const result = await sendEmailInternal(
		{
			to,
			subject: `Payment Failed — TokenFaucet / 支付失败 — TokenFaucet`,
			html,
		},
		EmailPriority.CRITICAL,
	);

	return { success: result.success, error: result.error };
}

/**
 * 会员到期提醒（提前 N 天）
 */
export async function sendMembershipExpiringEmail(params: {
	to: string;
	username: string;
	planName: string;
	daysLeft: number;
}): Promise<{ success: boolean; error?: string }> {
	const { to, username, planName, daysLeft } = params;
	const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; background-color: #f9fafb;">
  <div style="background: #ffffff; border-radius: 16px; padding: 40px 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #1a1a2e; font-size: 22px; margin: 0 0 6px 0;">TokenFaucet</h1>
      <p style="color: #6b7280; font-size: 13px; margin: 0;">Membership Expiring / 会员即将到期</p>
    </div>

    <div style="text-align: center; margin-bottom: 28px;">
      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 4px 0;">
        Hello ${username || to},<br/>
        Your TokenFaucet membership is expiring soon!<br/>
        您好 ${username || to}，您的 TokenFaucet 会员即将到期！
      </p>
    </div>

    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 20px; margin-bottom: 28px; text-align: center;">
      <p style="color: #d97706; font-size: 13px; margin: 0 0 8px 0;">Your current plan / 您当前的套餐</p>
      <p style="color: #1a1a2e; font-size: 18px; font-weight: bold; margin: 0 0 8px 0;">${planName}</p>
      <p style="color: #dc2626; font-size: 24px; font-weight: bold; margin: 0;">
        ${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining<br/>
        <span style="font-size: 14px; font-weight: normal;">剩余 ${daysLeft} 天</span>
      </p>
    </div>

    <div style="text-align: center; margin-bottom: 28px;">
      <a href="https://tokenfaucet.fun/zh/membership" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 10px;">
        Renew Now / 立即续费
      </a>
    </div>

    <div style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
      <p style="color: #d1d5db; font-size: 11px; line-height: 1.8; margin: 0; text-align: center;">
        After expiration, your account will revert to the free tier.<br/>
        到期后您的账户将恢复为免费套餐。
      </p>
    </div>
  </div>
</body>
</html>`;

	const result = await sendEmailInternal(
		{
			to,
			subject: `Membership Expiring in ${daysLeft} Day${daysLeft !== 1 ? "s" : ""} — TokenFaucet / 会员即将到期`,
			html,
		},
		EmailPriority.STANDARD,
	);

	return { success: result.success, error: result.error };
}

/**
 * 会员已到期通知
 */
export async function sendMembershipExpiredEmail(params: {
	to: string;
	username: string;
	planName: string;
}): Promise<{ success: boolean; error?: string }> {
	const { to, username, planName } = params;
	const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; background-color: #f9fafb;">
  <div style="background: #ffffff; border-radius: 16px; padding: 40px 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #1a1a2e; font-size: 22px; margin: 0 0 6px 0;">TokenFaucet</h1>
      <p style="color: #6b7280; font-size: 13px; margin: 0;">Membership Expired / 会员已到期</p>
    </div>

    <div style="text-align: center; margin-bottom: 28px;">
      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 4px 0;">
        Hello ${username || to},<br/>
        Your TokenFaucet membership has expired.<br/>
        您好 ${username || to}，您的 TokenFaucet 会员已到期。
      </p>
      <p style="color: #6b7280; font-size: 13px; margin: 0;">
        Your account has been reverted to the free tier.<br/>
        您的账户已恢复为免费套餐。
      </p>
    </div>

    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 28px; text-align: center;">
      <p style="color: #6b7280; font-size: 13px; margin: 0 0 4px 0;">Expired plan / 已过期的套餐</p>
      <p style="color: #1a1a2e; font-size: 18px; font-weight: bold; margin: 0;">${planName}</p>
    </div>

    <div style="text-align: center; margin-bottom: 28px;">
      <a href="https://tokenfaucet.fun/zh/membership" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 10px;">
        Renew Membership / 续费会员
      </a>
    </div>

    <div style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
      <p style="color: #d1d5db; font-size: 11px; line-height: 1.8; margin: 0; text-align: center;">
        Thank you for using TokenFaucet. We hope to see you again!<br/>
        感谢您使用 TokenFaucet，期待再次为您服务！
      </p>
    </div>
  </div>
</body>
</html>`;

	const result = await sendEmailInternal(
		{
			to,
			subject: `Membership Expired — TokenFaucet / 会员已到期 — TokenFaucet`,
			html,
		},
		EmailPriority.STANDARD,
	);

	return { success: result.success, error: result.error };
}

/**
 * 订阅取消确认邮件
 */
export async function sendSubscriptionCancelledEmail(params: {
	to: string;
	username: string;
	planName: string;
	endDate: string;
}): Promise<{ success: boolean; error?: string }> {
	const { to, username, planName, endDate } = params;
	const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; background-color: #f9fafb;">
  <div style="background: #ffffff; border-radius: 16px; padding: 40px 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #1a1a2e; font-size: 22px; margin: 0 0 6px 0;">TokenFaucet</h1>
      <p style="color: #6b7280; font-size: 13px; margin: 0;">Subscription Cancelled / 订阅已取消</p>
    </div>

    <div style="text-align: center; margin-bottom: 28px;">
      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 4px 0;">
        Hello ${username || to},<br/>
        Your subscription has been cancelled successfully.<br/>
        您好 ${username || to}，您的订阅已成功取消。
      </p>
    </div>

    <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="color: #6b7280; font-size: 13px; padding: 6px 0;">Plan / 套餐</td>
          <td style="color: #1a1a2e; font-size: 14px; font-weight: 600; text-align: right; padding: 6px 0;">${planName}</td>
        </tr>
        <tr style="border-top: 1px solid #e5e7eb;">
          <td style="color: #6b7280; font-size: 13px; padding: 10px 0 0 0;">Valid Until / 有效期至</td>
          <td style="color: #1a1a2e; font-size: 14px; font-weight: 600; text-align: right; padding: 10px 0 0 0;">${endDate}</td>
        </tr>
      </table>
      <p style="color: #0369a1; font-size: 12px; margin: 16px 0 0 0; text-align: center;">
        You can continue using your membership until the end date.<br/>
        您可以继续使用会员权益直到到期日。
      </p>
    </div>

    <div style="text-align: center; margin-bottom: 28px;">
      <a href="https://tokenfaucet.fun/zh/pricing" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 10px;">
        Resubscribe / 重新订阅
      </a>
    </div>

    <div style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
      <p style="color: #d1d5db; font-size: 11px; line-height: 1.8; margin: 0; text-align: center;">
        Thank you for using TokenFaucet. We hope to see you again!<br/>
        感谢您使用 TokenFaucet，期待再次为您服务！
      </p>
    </div>
  </div>
</body>
</html>`;

	const result = await sendEmailInternal(
		{
			to,
			subject: `Subscription Cancelled — TokenFaucet / 订阅已取消 — TokenFaucet`,
			html,
		},
		EmailPriority.STANDARD,
	);

	return { success: result.success, error: result.error };
}
