import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { BaseProviders } from "@/components/common/base-providers";
import { HomePage } from "@/components/front/home/home-page";
import { Footer, Navigation } from "@/components/front/layout";
import { defaultLocale } from "@/translate/i18n/config";

export default async function RootPage() {
	const messages = await getMessages({ locale: defaultLocale });

	return (
		<NextIntlClientProvider locale={defaultLocale} messages={messages}>
			<BaseProviders>
				<Navigation />
				<HomePage />
				<Footer />
			</BaseProviders>
		</NextIntlClientProvider>
	);
}
