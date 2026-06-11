import type { ReactNode } from "react";
import { createNamespaceLayout } from "@/translate/i18n/namespace-layout";

/**
 * 服务条款页 — 按需加载 legal namespace（privacy/terms/refund）
 */
export default async function TermsLayout({
	children,
	params,
}: {
	children: ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	return createNamespaceLayout(locale, "legal", children);
}
