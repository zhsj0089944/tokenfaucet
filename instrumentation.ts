/**
 * Sentry instrumentation
 * 用于启用 Next.js 的 Server Components 和 Route Handlers 错误追踪
 *
 * 需要安装: pnpm add @sentry/nextjs
 * 并在 next.config.ts 中添加:
 *   experimental: {
 *     instrumentationHook: true
 *   }
 */

export async function register() {
	if (process.env.SENTRY_DSN) {
		const Sentry = await import("@sentry/nextjs");
		Sentry.init({
			enabled: true,
		});
	}
}
