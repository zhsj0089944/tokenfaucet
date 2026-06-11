import { AuthProviders } from "@/components/common/auth-providers";
import { BaseProviders } from "@/components/common/base-providers";
import { createNamespaceLayout } from "@/translate/i18n/namespace-layout";

export default async function AILayout({
	children,
	params: paramsPromise,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: "zh" | "en" }>;
}) {
	const { locale } = await paramsPromise;

	const content = (
		<BaseProviders>
			<AuthProviders>{children}</AuthProviders>
		</BaseProviders>
	);

	// 加载 TTS namespace 让 useTranslations("tts") 可用
	return createNamespaceLayout(locale, "tts", content);
}
