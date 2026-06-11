import type { ReactNode } from "react";
import { createNamespaceLayout } from "@/translate/i18n/namespace-layout";

/**
 * 指南页 — 按需加载 guide namespace
 */
export default async function GuideLayout({
	children,
	params,
}: {
	children: ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	return createNamespaceLayout(locale, "guide", children);
}
