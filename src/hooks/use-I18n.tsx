import { useLocale } from "next-intl";

export const useI18n = (data: Record<string, string>) => {
	const locale = useLocale();
	return data[locale];
};
