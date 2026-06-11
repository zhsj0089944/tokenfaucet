"use client";

import { useMemo } from "react";
import { trpc } from "@/server/client";

/**
 * 站点配置 Hook
 * 用于前端动态读取 system_configs 表中的配置
 */
export function useSiteConfig() {
	const {
		data: configs,
		isLoading,
		error,
	} = trpc.system.getPublicConfigs.useQuery(
		{},
		{
			// 配置缓存策略
			staleTime: 1000 * 60 * 5, // 5分钟内不重新获取
			refetchOnWindowFocus: false,
		},
	);

	// 将配置数组转换为 Map，方便快速查找
	const configMap = useMemo(() => {
		const map = new Map<string, string>();
		if (configs) {
			configs.forEach((config: { key: string; value: unknown }) => {
				const rawValue = config.value;
				if (typeof rawValue === "string") {
					// JSONB 存储的字符串带引号，需要去掉
					map.set(config.key, rawValue.replace(/^"(.*)"$/, "$1"));
				} else {
					map.set(config.key, String(rawValue));
				}
			});
		}
		return map;
	}, [configs]);

	// 便捷方法：获取配置值
	const getConfig = <T = string>(key: string, defaultValue?: T): T | undefined => {
		const value = configMap.get(key);
		if (value === undefined) {
			return defaultValue as T | undefined;
		}
		return value as T;
	};

	// 常用配置的便捷访问器
	const siteName = getConfig<string>("site.name", "TokenFaucet");
	const siteUrl = getConfig<string>("site.url", "");
	const siteDescription = getConfig<string>("site.description", "");
	const siteSupportEmail = getConfig<string>("site.supportEmail", "");

	return {
		// 原始数据
		configs,
		configMap,
		isLoading,
		error,

		// 便捷方法
		getConfig,

		// 常用配置
		siteName,
		siteUrl,
		siteDescription,
		siteSupportEmail,

		// 所有配置（便于调试）
		allConfigs: configs,
	};
}

/**
 * 获取单个配置的值
 * 这是一个简化的版本，返回配置值或默认值
 */
export function useConfigValue<T = string>(key: string, defaultValue?: T) {
	const { getConfig } = useSiteConfig();
	return getConfig<T>(key, defaultValue);
}
