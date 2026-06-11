import type { ReactNode } from "react";
import { createNamespaceLayout } from "@/translate/i18n/namespace-layout";

/**
 * 联系页 — 按需加载 contact namespace
 */
export default async function ContactLayout({
	children,
	params,
}: {
	children: ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	return createNamespaceLayout(locale, "contact", children);
}
