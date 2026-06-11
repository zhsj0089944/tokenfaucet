/**
 * Sentry 客户端配置
 * 需要安装: pnpm add @sentry/nextjs
 *
 * 然后在 .env 中添加:
 * NEXT_PUBLIC_SENTRY_DSN=your_dsn_here
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

	// 环境
	environment: process.env.NODE_ENV,

	// 是否启用
	enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

	// 采样率
	tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

	// 会话采样
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,

	// 允许调试
	debug: process.env.NODE_ENV === "development",
});
