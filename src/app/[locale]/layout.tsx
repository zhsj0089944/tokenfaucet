import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { BaseProviders } from "@/components/common/base-providers";

export default async function LocaleLayout({
	children,
	params: paramsPromise,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: "zh" | "en" }>;
}) {
	const { locale } = await paramsPromise;
	const messages = await getMessages({ locale });

	return (
		<NextIntlClientProvider locale={locale} messages={messages}>
			<BaseProviders>{children}</BaseProviders>
		</NextIntlClientProvider>
	);
}
