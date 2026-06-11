/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import "./src/env";

const withNextIntl = createNextIntlPlugin("./src/translate/i18n/request.ts");

const config: NextConfig = {
	devIndicators: false,
	reactStrictMode: true,
	poweredByHeader: false,
	compress: true,
	// output: 'standalone',  // 暂时禁用，Windows 非管理员无法创建 symlink

	// 跳过构建错误继续构建
	typescript: {
		ignoreBuildErrors: false,
	},
	eslint: {
		ignoreDuringBuilds: false,
	},

	// 图片优化配置
	images: {
		unoptimized: process.env.NODE_ENV === "development",
		formats: ["image/avif", "image/webp"],
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
		minimumCacheTTL: 60 * 60 * 24 * 30, // 30天缓存
		dangerouslyAllowSVG: false,
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
	},

	// 外部包配置 (moved from experimental)
	serverExternalPackages: ["sharp"],

	// Sentry 监控 (需要安装 @sentry/nextjs 并使用 withSentryConfig 包裹)
	// sentry: {
	// 	enabled: !!process.env.SENTRY_DSN,
	// 	hideSourceMapsForProp: true,
	// },

	// Turbopack 配置 (moved from experimental.turbo)
	turbopack: {
		rules: {
			"*.svg": {
				loaders: ["@svgr/webpack"],
				as: "*.js",
			},
		},
	},

	experimental: {
		serverActions: {
			bodySizeLimit: "10mb",
		},
		// 包导入优化
		optimizePackageImports: [
			"@radix-ui/react-icons",
			"@tabler/icons-react",
			"lucide-react",
			"framer-motion",
			"date-fns",
		],
		// 启用 PPR (Partial Prerendering) - 暂时禁用
		// ppr: process.env.NODE_ENV === 'production',
	},

	// Webpack 优化配置
	webpack: (config, { dev, isServer, webpack }) => {
		// 生产环境优化
		if (!(dev || isServer)) {
			// 代码分割优化 — 精简配置，让 Next.js 默认策略主导
			config.optimization.splitChunks = {
				chunks: "all",
				minSize: 20000,
				cacheGroups: {
					// 框架代码 — React/ReactDOM 单一 chunk
					framework: {
						test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
						name: "framework",
						chunks: "all",
						priority: 40,
						enforce: true,
					},
					// UI 组件库 — Radix + Lucide icons
					ui: {
						test: /[\\/]node_modules[\\/](@radix-ui|@tabler|lucide-react)[\\/]/,
						name: "ui",
						chunks: "all",
						priority: 30,
					},
					// AI SDK — 按需加载
					ai: {
						test: /[\\/]node_modules[\\/]@ai-sdk[\\/]/,
						name: "ai-sdk",
						chunks: "all",
						priority: 25,
					},
					// 工具库 — 轻量工具类聚合
					utils: {
						test: /[\\/]node_modules[\\/](date-fns|clsx|class-variance-authority)[\\/]/,
						name: "utils",
						chunks: "all",
						priority: 20,
					},
					// 其他第三方依赖 — 不强制命名，让 webpack 自动管理
					vendor: {
						test: /[\\/]node_modules[\\/]/,
						chunks: "all",
						priority: 10,
					},
				},
			};

			// 启用 Tree Shaking
			config.optimization.usedExports = true;
			config.optimization.sideEffects = false;

			// 压缩优化
			config.optimization.minimize = true;
		}

		// Bundle 分析
		if (process.env.ANALYZE === "true") {
			const BundleAnalyzerPlugin = require("@next/bundle-analyzer")({
				enabled: true,
				openAnalyzer: false,
			});
			config.plugins.push(BundleAnalyzerPlugin);
		}

		// 性能监控
		if (!dev) {
			config.plugins.push(
				new webpack.DefinePlugin({
					"process.env.ENABLE_PERFORMANCE_MONITORING": JSON.stringify("true"),
				}),
			);
		}

		return config;
	},

	// 缓存配置
	onDemandEntries: {
		maxInactiveAge: 25 * 1000, // 25秒
		pagesBufferLength: 2,
	},

	// 安全和性能头部
	headers: async () => [
		{
			source: "/(.*)",
			headers: [
				// 安全头部
				{
					key: "X-Frame-Options",
					value: "DENY",
				},
				{
					key: "X-Content-Type-Options",
					value: "nosniff",
				},
				{
					key: "Referrer-Policy",
					value: "strict-origin-when-cross-origin",
				},
				{
					key: "Content-Security-Policy",
					value: [
						"default-src 'self'",
						"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://stats.g.doubleclick.net https://challenges.cloudflare.com https://static.cloudflareinsights.com",
						"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
						"font-src 'self' https://fonts.gstatic.com",
						"img-src 'self' data: blob: https://*.google-analytics.com https://*.googletagmanager.com https://tokenfaucet.fun https://api.producthunt.com https://sourceforge.net https://startupfa.me https://www.sideprojectors.com",
						"media-src 'self' blob: data:",
						"connect-src 'self' blob: https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://stats.g.doubleclick.net https://va.vercel-scripts.com https://*.ingest.sentry.io https://*.posthog.com https://cloudflareinsights.com https://static.cloudflareinsights.com",
						"frame-src 'self' https://accounts.google.com https://vercel.live https://challenges.cloudflare.com https://*.creem.io",
						"object-src 'none'",
						"base-uri 'self'",
						"form-action 'self'",
						"frame-ancestors 'none'",
					].join("; "),
				},
				{
					key: "Permissions-Policy",
					value:
						"camera=(), microphone=(), geolocation=(), payment=(self), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
				},
				// 性能头部
				{
					key: "X-DNS-Prefetch-Control",
					value: "on",
				},
				// Google OAuth 相关安全头部（宽松值以支持跨域弹窗）
				{
					key: "Cross-Origin-Embedder-Policy",
					value: "unsafe-none",
				},
				{
					key: "Cross-Origin-Opener-Policy",
					value: "same-origin-allow-popups",
				},
			],
		},
		// 静态资源缓存
		{
			source: "/static/(.*)",
			headers: [
				{
					key: "Cache-Control",
					value: "public, max-age=31536000, immutable",
				},
			],
		},
		// 图片缓存
		{
			source: "/_next/image(.*)",
			headers: [
				{
					key: "Cache-Control",
					value: "public, max-age=31536000, immutable",
				},
			],
		},
		// API 缓存（敏感接口不设 public，防止跨用户数据泄露）
		{
			source: "/api/(.*)",
			headers: [
				{
					key: "Cache-Control",
					value: "private, no-store, max-age=0",
				},
			],
		},
	],

	// 重定向优化
	redirects: async () => [],

	// 重写优化
	rewrites: async () => [],
};

export default withNextIntl(config);
