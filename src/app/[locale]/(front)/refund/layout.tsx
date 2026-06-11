import type { ReactNode } from "react";
import { createNamespaceLayout } from "@/translate/i18n/namespace-layout";

/**
 * 退款政策页 — 按需加载 legal namespace（privacy/terms/refund）
 */
export default async function RefundLayout({
	children,
	params,
}: {
	children: ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	return createNamespaceLayout(locale, "legal", children);
}
