import type { ReactNode } from "react";
import { AuthProviders } from "@/components/common/auth-providers";
import { createNamespaceLayout } from "@/translate/i18n/namespace-layout";

export default async function AiLayout({
	children,
	params,
}: {
	children: ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;

	const content = <AuthProviders>{children}</AuthProviders>;

	// 加载 TTS namespace 让 useTranslations("tts") 可用
	return createNamespaceLayout(locale, "tts", content);
}
