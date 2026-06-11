import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales } from "./config";

type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
	// next-intl v4: requestLocale 是一个 Promise，需要 await
	const locale = await requestLocale;

	// 确保locale不为undefined，使用默认值
	// 如果locale不在支持的语言列表中，使用默认语言
	const validLocale = locale && locales.includes(locale as Locale) ? locale : defaultLocale;

	return {
		locale: validLocale,
		messages: (await import(`../messages/${validLocale}.json`)).default,
	};
});
