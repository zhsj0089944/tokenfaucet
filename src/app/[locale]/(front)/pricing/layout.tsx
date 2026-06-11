import type { ReactNode } from "react";
import { createNamespaceLayout } from "@/translate/i18n/namespace-layout";

/**
 * 定价页 — 按需加载 pricing namespace
 */
export default async function PricingLayout({
	children,
	params,
}: {
	children: ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	return createNamespaceLayout(locale, "pricing", children);
}
