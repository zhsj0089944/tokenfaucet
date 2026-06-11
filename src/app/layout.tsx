import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { ServerStructuredData } from "@/components/front/seo/structured-data";
import {
	generateOrganizationStructuredData,
	generatePageMetadata,
	generateWebsiteStructuredData,
	SEO_CONFIG,
} from "@/lib/seo-utils";

import "./globals.css";

const MyAppFont = {
	variable: "--font-system",
	className: "font-sans",
};

interface LocaleLayoutParams {
	params: Promise<{ locale?: "zh" | "en" }>;
}

// 生成网站根metadata
export async function generateMetadata({
	params: paramsPromise,
}: LocaleLayoutParams): Promise<Metadata> {
	const params = await paramsPromise;
	const locale = params.locale || "en";
	return generatePageMetadata({
		locale,
		type: "website",
		url: "/",
	});
}

export default async function LocaleLayout({
	children,
	params: paramsPromise,
}: {
	children: React.ReactNode;
	params: Promise<{ locale?: "zh" | "en" }>;
}) {
	const params = await paramsPromise;
	const locale = params.locale || "en";
	const langConfig = SEO_CONFIG[locale] || SEO_CONFIG.en;

	const websiteStructuredData = generateWebsiteStructuredData({
		siteName: SEO_CONFIG.siteName,
		siteUrl: SEO_CONFIG.siteUrl,
		description: langConfig.defaultDescription,
	});

	const organizationStructuredData = generateOrganizationStructuredData({
		siteName: SEO_CONFIG.siteName,
		siteUrl: SEO_CONFIG.siteUrl,
		description: langConfig.orgDescription,
	});

	return (
		<html lang={locale} suppressHydrationWarning={true} style={{ colorScheme: "dark light" }}>
			<head>
				<link rel="icon" href="/favicon.ico" />
				<link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				{/* biome-ignore lint/correctness/useUniqueElementIds: Server component - unique per layout instance */}
				<ServerStructuredData data={websiteStructuredData} id="website-structured-data" />
				{/* biome-ignore lint/correctness/useUniqueElementIds: Server component - unique per layout instance */}
				<ServerStructuredData data={organizationStructuredData} id="organization-structured-data" />
			</head>
			<body className={`${MyAppFont.variable} font-sans antialiased`}>
				{children}
				<GoogleAnalytics gaId="G-XM3JVRRSL9" />
				<script
					defer
					src="https://static.cloudflareinsights.com/beacon.min.js"
					data-cf-beacon='{"token": "60cd145a49b74befaa508a8711e7c33e"}'
				></script>
			</body>
		</html>
	);
}
