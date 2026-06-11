/**
 * Sentry 服务端配置
 * 需要安装: pnpm add @sentry/nextjs
 *
 * 然后在 .env 中添加:
 * SENTRY_DSN=your_dsn_here
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: process.env.SENTRY_DSN,

	// 环境
	environment: process.env.NODE_ENV,

	// 是否启用
	enabled: !!process.env.SENTRY_DSN,

	// 采样率
	tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

	// 集成配置（使用新版 Sentry 集成方式）
	integrations: [],

	// 调试模式
	debug: process.env.NODE_ENV === "development",

	// 最大错误堆栈深度
	maxValueLength: 500,
});
