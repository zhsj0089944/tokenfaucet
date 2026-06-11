import type { MetadataRoute } from "next";

/**
 * TokenFaucet robots.txt configuration
 * - Allow all crawlers on /en/* public pages
 * - Block /zh/* (target market is overseas, Chinese pages don't need SEO)
 * - Block /auth/*, /api/*, /dashboard/* (private/internal routes)
 */

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: "*",
				allow: "/en/",
				disallow: ["/zh/", "/auth/", "/api/", "/dashboard/"],
			},
		],
		sitemap: "https://tokenfaucet.fun/sitemap.xml",
	};
}
