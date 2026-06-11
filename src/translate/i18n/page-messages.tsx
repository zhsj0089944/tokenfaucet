import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import { COMMON_NAMESPACES, PAGE_NAMESPACES } from "@/translate/i18n/message-namespaces";

/** 从完整 messages 中提取指定 namespace */
export function pickNamespaces(
	messages: Record<string, unknown>,
	namespaces: readonly string[],
): Record<string, unknown> {
	const picked: Record<string, unknown> = {};
	for (const ns of namespaces) {
		if (ns in messages) {
			picked[ns] = messages[ns];
		}
	}
	return picked;
}

type PageNamespaceKey = keyof typeof PAGE_NAMESPACES;

/**
 * 为页面加载指定 namespace 的 i18n 消息（自动包含 common namespace）
 * 用于在页面中包裹内容，确保 useTranslations 能访问所有需要的 namespace
 */
export async function withPageMessages(
	locale: string,
	pageKey: PageNamespaceKey,
	children: ReactNode,
) {
	const allMessages = await getMessages({ locale });
	const pageNamespaces = PAGE_NAMESPACES[pageKey];
	const namespaces = [...COMMON_NAMESPACES, ...pageNamespaces];
	const pageMessages = pickNamespaces(allMessages, namespaces);

	return (
		<NextIntlClientProvider locale={locale} messages={pageMessages}>
			{children}
		</NextIntlClientProvider>
	);
}

/**
 * 获取页面所需的 messages（不包裹组件，供手动使用）
 */
export async function getPageMessages(locale: string, pageKey: PageNamespaceKey) {
	const allMessages = await getMessages({ locale });
	const pageNamespaces = PAGE_NAMESPACES[pageKey];
	const namespaces = [...COMMON_NAMESPACES, ...pageNamespaces];
	return pickNamespaces(allMessages, namespaces);
}
