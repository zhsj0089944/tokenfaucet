"use client";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";

export const LanguageSwitcher = () => {
	const locale = useLocale();
	const router = useRouter();
	const pathname = usePathname();

	const switchLanguage = (newLocale: string) => {
		const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
		router.push(`/${newLocale}${pathWithoutLocale}`);
	};

	const isZh = locale === "zh";

	return (
		<Button
			onClick={() => switchLanguage(isZh ? "en" : "zh")}
			className="h-11 px-4 text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 rounded-lg transition-colors duration-200 shadow-sm"
		>
			<span className="leading-none">{isZh ? "EN" : "中文"}</span>
		</Button>
	);
};

export default LanguageSwitcher;
