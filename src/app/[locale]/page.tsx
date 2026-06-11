import { HomePage } from "@/components/front/home";
import { Footer, Navigation } from "@/components/front/layout";
import { generatePageMetadata } from "@/lib/seo-utils";
import { withPageMessages } from "@/translate/i18n/page-messages";

export async function generateMetadata({
	params: paramsPromise,
}: {
	params: Promise<{ locale: "zh" | "en" }>;
}) {
	const { locale } = await paramsPromise;
	return generatePageMetadata({
		locale,
		type: "website",
		url: "/",
	});
}

export default async function Home({
	params: paramsPromise,
}: {
	params: Promise<{ locale: "zh" | "en" }>;
}) {
	const { locale } = await paramsPromise;
	return withPageMessages(
		locale,
		"home",
		<>
			<Navigation />
			<HomePage />
			<Footer />
		</>,
	);
}
