import type { Metadata } from "next";
import { getSiteConfigFromDb } from "./get-site-config";

export const SEO_CONFIG = {
	siteName: "TokenFaucet",
	siteUrl: "https://tokenfaucet.fun",
	zh: {
		defaultTitle: "TokenFaucet",
		defaultDescription: "TokenFaucet - AI Token 平台",
		orgDescription: "提供 AI Token 管理与分发解决方案",
	},
	en: {
		defaultTitle: "TokenFaucet",
		defaultDescription: "TokenFaucet - AI Token Platform",
		orgDescription: "Providing AI Token management and distribution solutions",
	},
};

interface GeneratePageMetadataProps {
	locale: "zh" | "en";
	type: "website" | "article";
	url: string;
	title?: string;
	description?: string;
}

export async function generatePageMetadata({
	locale,
	type,
	url,
	title,
	description,
}: GeneratePageMetadataProps): Promise<Metadata> {
	// 从数据库获取配置
	const dbConfig = await getSiteConfigFromDb();
	const langConfig = SEO_CONFIG[locale];

	const finalTitle =
		title ||
		(locale === "en"
			? dbConfig.siteNameEn || langConfig?.defaultTitle
			: dbConfig.siteName || langConfig?.defaultTitle);
	const finalDescription =
		locale === "en"
			? dbConfig.siteDescriptionEn || description || langConfig?.defaultDescription
			: description || dbConfig.siteDescription || langConfig?.defaultDescription;
	const finalSiteUrl = (dbConfig.siteUrl || SEO_CONFIG.siteUrl).replace(/\/+$/, "");
	const finalSiteName =
		locale === "en" ? dbConfig.siteNameEn || dbConfig.siteName : dbConfig.siteName;

	const canonicalUrl = `${finalSiteUrl}${url}`;

	return {
		title: finalTitle,
		description: finalDescription,
		alternates: {
			canonical: canonicalUrl,
			languages: {
				en: `${finalSiteUrl}/en${url === "/" ? "" : url}`,
				zh: `${finalSiteUrl}/zh${url === "/" ? "" : url}`,
			},
		},
		openGraph: {
			title: finalTitle,
			description: finalDescription,
			url: canonicalUrl,
			siteName: finalSiteName,
			locale,
			type,
		},
		twitter: {
			card: "summary_large_image",
			title: finalTitle,
			description: finalDescription,
		},
	};
}

export function generateWebsiteStructuredData({
	siteName,
	siteUrl,
	description,
}: {
	siteName: string;
	siteUrl: string;
	description: string;
}) {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: siteName,
		url: siteUrl,
		description,
	};
}

export function generateOrganizationStructuredData({
	siteName,
	siteUrl,
	description,
}: {
	siteName: string;
	siteUrl: string;
	description: string;
}) {
	return {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: siteName,
		url: siteUrl,
		description,
	};
}
