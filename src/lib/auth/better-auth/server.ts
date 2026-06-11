import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, username } from "better-auth/plugins";
import { accounts, sessions, users, verificationTokens } from "@/drizzle/schemas";
import { env } from "@/env";
import { sendPasswordResetEmail } from "@/lib/email/sender";
import { logger } from "@/lib/logger";
import { db } from "../../db";

export const auth = betterAuth({
	// 数据库适配器 - 明确指定schema映射
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: users,
			session: sessions,
			account: accounts,
			verification: verificationTokens,
		},
		// 添加自定义字段映射，确保兼容性
		usePlural: false,
	}),

	// 基础配置
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL || env.NEXT_PUBLIC_SITE_URL,

	// 邮箱密码认证
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false, // 项目已有自定义邮箱验证码流程（send-verification-code），无需 Better Auth 重复验证
		sendResetPassword: async ({ user, url }) => {
			try {
				// 安全：不记录包含 token 的完整 URL，只记录邮箱
				if (process.env.NODE_ENV === "development") {
					logger.info("发送密码重置邮件", { email: user.email });
				}
				await sendPasswordResetEmail(user.email, user.name || user.email, url);
			} catch (error) {
				logger.error(
					"密码重置邮件发送失败",
					error instanceof Error ? error : new Error(String(error)),
				);
				throw error;
			}
		},
	},

	// 社交登录提供商
	socialProviders:
		env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
			? {
					google: {
						clientId: env.GOOGLE_CLIENT_ID,
						clientSecret: env.GOOGLE_CLIENT_SECRET,
						// 设置正确的重定向URI
						redirectURI: `${env.BETTER_AUTH_URL || env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/google`,
					},
				}
			: {},

	// 插件
	plugins: [username(), admin()],

	// 用户字段扩展
	user: {
		additionalFields: {
			fullName: {
				type: "string",
				required: false,
			},
			isAdmin: {
				type: "boolean",
				required: false,
				defaultValue: false,
			},
			adminLevel: {
				type: "number",
				required: false,
				defaultValue: 0,
			},
			isActive: {
				type: "boolean",
				required: false,
				defaultValue: true,
			},
			locale: {
				type: "string",
				required: false,
				defaultValue: "zh",
			},
			preferences: {
				type: "string", // Better-Auth 不直接支持 object，使用 JSON 字符串
				required: false,
				defaultValue: JSON.stringify({
					theme: "light",
					language: "zh",
					currency: "USD",
					timezone: "Asia/Shanghai",
				}),
			},
		},
	},

	// 会话配置（优化状态同步）
	session: {
		expiresIn: 60 * 60 * 24 * 30, // 30天 - 配合前端"记住我30天"选项
		updateAge: 60 * 60 * 2, // 2小时更新一次（提高同步频率）
		cookieCache: {
			enabled: true,
			maxAge: 60 * 60 * 2, // 2小时缓存（缩短缓存时间以提高状态同步）
		},
	},

	// 高级配置
	advanced: {
		crossSubDomainCookies: {
			enabled: false,
			domain: (() => {
				if (env.BETTER_AUTH_COOKIE_DOMAIN) return env.BETTER_AUTH_COOKIE_DOMAIN;
				if (!env.NEXT_PUBLIC_SITE_URL) return undefined;
				try {
					return new URL(env.NEXT_PUBLIC_SITE_URL).hostname;
				} catch {
					logger.error("BETTER_AUTH_URL 格式错误", new Error(env.NEXT_PUBLIC_SITE_URL || ""));
					return undefined;
				}
			})(),
		},
		cookiePrefix: "better-auth",
		defaultCookieAttributes: {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
		},
	},

	// OAuth 配置 - 关键修复
	// 确保包含所有可能的域名（开发和生产环境）
	trustedOrigins: [
		// 开发环境
		"http://localhost:3000",
		"http://localhost:3001",
		"http://127.0.0.1:3000",
		// 从环境变量动态获取（生产环境）
		env.NEXT_PUBLIC_SITE_URL,
		env.BETTER_AUTH_URL,
	].filter(Boolean) as string[],

	// 速率限制 - 启用内置限流，防止暴力破解
	rateLimit: {
		enabled: true,
		window: 60, // 1分钟窗口
		max: 20, // 每个窗口最多20次请求
	},

	// 回调处理
	callbacks: {
		async signUp({
			user,
			account,
		}: {
			user: { email: string; name?: string; fullName?: string };
			account?: { providerId?: string };
		}) {
			if (process.env.NODE_ENV === "development") {
				logger.info("Better Auth - 用户注册回调", {
					email: user.email,
					provider: account?.providerId,
				});
			}

			// 如果是OAuth登录，确保用户信息完整
			if (account?.providerId === "google") {
				const updates: Record<string, string> = {};

				// 如果缺少用户名，从邮箱生成
				if (!user.name && user.email) {
					updates.name = user.email.split("@")[0] ?? "";
				}

				// 如果缺少fullName，设置为name
				if (!user.fullName && user.name) {
					updates.fullName = user.name;
				}

				if (Object.keys(updates).length > 0 && process.env.NODE_ENV === "development") {
					logger.info("补全用户信息", updates);
					// 这里可以调用数据库更新，但Better Auth会自动处理基本字段
				}
			}

			return user;
		},

		async signIn({
			user,
			account,
		}: {
			user: { email: string; name?: string };
			account?: { providerId?: string };
		}) {
			if (process.env.NODE_ENV === "development") {
				logger.info("Better Auth - 用户登录回调", {
					email: user.email,
					provider: account?.providerId,
				});
			}
			return user;
		},
	},
});

// 导出类型
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

// 辅助函数（注意：以下函数在无法获取请求头的环境中会返回 null，
// 建议在 tRPC context 或 Server Component 中直接使用 auth.api.getSession 并传入正确的 headers）
export const getServerSession = async (requestHeaders?: Headers) => {
	if (!requestHeaders) {
		logger.warn("getServerSession 被调用但未传入请求头，无法获取会话");
		return null;
	}
	return auth.api.getSession({
		headers: requestHeaders,
	});
};

export const getServerCurrentUser = async (requestHeaders?: Headers) => {
	const session = await getServerSession(requestHeaders);
	return session?.user || null;
};
