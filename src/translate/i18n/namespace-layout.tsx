import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import { COMMON_NAMESPACES, PAGE_NAMESPACES } from "@/translate/i18n/message-namespaces";
import { pickNamespaces } from "@/translate/i18n/page-messages";

type PageNamespaceKey = keyof typeof PAGE_NAMESPACES;

/**
 * 为路由布局加载指定 namespace 的 i18n 消息（自动包含 common namespace）
 * 与根布局的 NextIntlClientProvider 合并，子页面可通过 useTranslations 访问所有 namespace
 */
export async function createNamespaceLayout(
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
