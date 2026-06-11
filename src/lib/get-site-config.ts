import { eq } from "drizzle-orm";
import { systemConfigs } from "@/drizzle/schemas";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * 从数据库获取站点配置（服务端使用）
 */
export async function getSiteConfigFromDb() {
	try {
		const configs = await db
			.select()
			.from(systemConfigs)
			.where(eq(systemConfigs.category, "general"));

		const configMap: Record<string, string> = {};
		configs.forEach((config) => {
			// JSONB 值可能是字符串或直接值，需要处理
			const rawValue = config.value;
			if (typeof rawValue === "string") {
				// 如果是字符串，去掉首尾引号（JSONB 存储的字符串带引号）
				configMap[config.key] = rawValue.replace(/^"(.*)"$/, "$1");
			} else {
				configMap[config.key] = String(rawValue);
			}
		});

		return {
			siteName: configMap["site.name"] || "TokenFaucet",
			siteNameEn: configMap["site.name.en"] || configMap["site.name"] || "TokenFaucet",
			siteUrl: configMap["site.url"] || "https://tokenfaucet.fun",
			siteDescription: configMap["site.description"] || "",
			siteDescriptionEn: configMap["site.description.en"] || configMap["site.description"] || "",
			siteSupportEmail: configMap["site.supportEmail"] || "",
		};
	} catch (error) {
		logger.error(
			"Failed to get site config",
			error instanceof Error ? error : new Error(String(error)),
		);
		return {
			siteName: "TokenFaucet",
			siteUrl: "https://tokenfaucet.fun",
			siteDescription: "",
			siteDescriptionEn: "",
			siteSupportEmail: "",
		};
	}
}
