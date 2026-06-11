"use client";

import Head from "next/head";
import { useSiteConfig } from "@/hooks/use-site-config";

interface SEOHeadProps {
	title?: string;
	description?: string;
	keywords?: string[];
	image?: string;
	url?: string;
	type?: "website" | "article" | "profile";
	publishedTime?: string;
	modifiedTime?: string;
	author?: string;
	tags?: string[];
	locale?: string;
	siteName?: string;
	structuredData?: Record<string, unknown>;
}

export default function SEOHead({
	title,
	description,
	keywords = [
		"TokenFaucet",
		"AI Token",
		"Token 管理",
		"AI 工具",
		"API 集成",
		"智能应用",
		"自动化",
		"RPA",
		"流程自动化",
	],
	image = "/images/og-default.jpeg",
	url,
	type = "website",
	publishedTime,
	modifiedTime,
	author,
	tags,
	locale = "zh_CN",
	siteName: propSiteName,
	structuredData,
}: SEOHeadProps) {
	const {
		siteName: configSiteName,
		siteUrl: configSiteUrl,
		siteDescription: configDescription,
		isLoading,
	} = useSiteConfig();

	// 使用 props 优先，否则使用配置文件，最后使用默认值
	const siteName = propSiteName || (isLoading ? "TokenFaucet" : configSiteName) || "TokenFaucet";
	const siteUrl = isLoading
		? "https://tokenfaucet.fun"
		: configSiteUrl || "https://tokenfaucet.fun";
	const metaDescription = description || (isLoading ? "" : configDescription) || "";

	const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
	const fullImageUrl = image.startsWith("http") ? image : `${siteUrl}${image}`;

	// 默认结构化数据
	const defaultStructuredData = {
		"@context": siteUrl,
		"@type": "WebSite",
		name: siteName,
		url: siteUrl,
		description: metaDescription,
		potentialAction: {
			"@type": "SearchAction",
			target: `${siteUrl}/search?q={search_term_string}`,
			"query-input": "required name=search_term_string",
		},
		sameAs: ["https://github.com/geallenboy/tokenfaucet"],
	};

	// 组织结构化数据
	const organizationData = {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: siteName,
		url: siteUrl,
		logo: `${siteUrl}/images/logo.png`,
		description: metaDescription,
		foundingDate: "2025",
		contactPoint: {
			"@type": "ContactPoint",
			contactType: "customer service",
			email: "support@tokenfaucet.fun",
		},
	};

	// 面包屑导航数据（如果提供了URL路径）
	const breadcrumbData = url
		? {
				"@context": "https://schema.org",
				"@type": "BreadcrumbList",
				itemListElement: url
					.split("/")
					.filter(Boolean)
					.map((segment, index, array) => ({
						"@type": "ListItem",
						position: index + 1,
						name: segment,
						item: `${siteUrl}/${array.slice(0, index + 1).join("/")}`,
					})),
			}
		: null;

	return (
		<Head>
			{/* 基础Meta标签 */}
			<title>{title || siteName}</title>
			<meta name="description" content={metaDescription} />
			<meta name="keywords" content={keywords.join(", ")} />
			<meta name="author" content={author || siteName} />
			<meta name="robots" content="index, follow" />
			<meta name="language" content="Chinese" />
			<meta name="revisit-after" content="7 days" />
			<meta name="rating" content="general" />

			{/* 视口和字符集 */}
			<meta name="viewport" content="width=device-width, initial-scale=1" />
			<meta charSet="utf-8" />

			{/* Canonical URL */}
			<link rel="canonical" href={fullUrl} />

			{/* 语言和地区 */}
			<meta httpEquiv="Content-Language" content="zh-cn" />
			<meta name="geo.region" content="CN" />
			<meta name="geo.placename" content="China" />

			{/* Open Graph / Facebook */}
			<meta property="og:type" content={type} />
			<meta property="og:url" content={fullUrl} />
			<meta property="og:title" content={title} />
			<meta property="og:description" content={description} />
			<meta property="og:image" content={fullImageUrl} />
			<meta property="og:image:alt" content={title} />
			<meta property="og:site_name" content={siteName} />
			<meta property="og:locale" content={locale} />

			{publishedTime && <meta property="article:published_time" content={publishedTime} />}
			{modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
			{author && <meta property="article:author" content={author} />}
			{tags?.map((tag) => (
				<meta key={tag} property="article:tag" content={tag} />
			))}

			{/* Twitter */}
			<meta name="twitter:card" content="summary_large_image" />
			<meta name="twitter:url" content={fullUrl} />
			<meta name="twitter:title" content={title} />
			<meta name="twitter:description" content={description} />
			<meta name="twitter:image" content={fullImageUrl} />
			<meta name="twitter:site" content="@tokenfaucet" />
			<meta name="twitter:creator" content="@tokenfaucet" />

			{/* Apple */}
			<meta name="apple-mobile-web-app-capable" content="yes" />
			<meta name="apple-mobile-web-app-status-bar-style" content="black" />
			<meta name="apple-mobile-web-app-title" content={siteName} />

			{/* Microsoft */}
			<meta name="msapplication-TileColor" content="#2563eb" />
			<meta name="msapplication-TileImage" content="/icons/ms-icon-144x144.png" />
			<meta name="theme-color" content="#2563eb" media="(prefers-color-scheme: light)" />
			<meta name="theme-color" content="#0a0a0f" media="(prefers-color-scheme: dark)" />

			{/* 网站图标 */}
			<link rel="icon" type="image/x-icon" href="/favicon.ico" />
			<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
			<link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
			<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />

			{/* RSS订阅 */}
			<link
				rel="alternate"
				type="application/rss+xml"
				title={`${siteName} RSS Feed`}
				href="/rss.xml"
			/>

			{/* DNS预解析 */}
			<link rel="dns-prefetch" href="//fonts.googleapis.com" />
			<link rel="dns-prefetch" href="//www.google-analytics.com" />

			{/* 结构化数据 */}
			<script type="application/ld+json">
				{JSON.stringify(structuredData || defaultStructuredData)}
			</script>

			<script type="application/ld+json">{JSON.stringify(organizationData)}</script>

			{breadcrumbData && (
				<script type="application/ld+json">{JSON.stringify(breadcrumbData)}</script>
			)}

			{/* 专门针对 TokenFaucet 相关的技术关键词 */}
			<meta name="topic" content="TokenFaucet, AI Token, API integration" />
			<meta name="summary" content="TokenFaucet - AI Token 管理与分发平台" />
			<meta name="Classification" content="Technology, AI, API Platform" />
			<meta name="designer" content="TokenFaucet Team" />
			<meta name="copyright" content="TokenFaucet" />
			<meta name="reply-to" content="hello@tokenfaucet.fun" />
			<meta name="owner" content="TokenFaucet" />
			<meta name="url" content={fullUrl} />
			<meta name="identifier-URL" content={fullUrl} />
			<meta name="directory" content="submission" />
			<meta name="category" content="Technology Education Platform" />
			<meta name="coverage" content="Worldwide" />
			<meta name="distribution" content="Global" />
			<meta name="rating" content="General" />
			<meta name="revisit-after" content="7 days" />

			{/* 针对中文搜索引擎的特殊标签 */}
			<meta name="baidu-site-verification" content="" />
			<meta name="sogou_site_verification" content="" />
			<meta name="360-site-verification" content="" />
		</Head>
	);
}
