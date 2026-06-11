"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { localizePath } from "@/lib/utils";

export default function CTASection() {
	const t = useTranslations("home");
	const locale = useLocale();

	return (
		<section className="py-24 bg-white dark:bg-gray-900 relative overflow-hidden">
			{/* 背景装饰 */}
			<div className="absolute inset-0">
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-pink-200/30 via-purple-200/30 to-blue-200/30 dark:from-pink-500/10 dark:via-purple-500/10 dark:to-blue-500/10 rounded-full blur-3xl" />
			</div>

			<div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="relative bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 rounded-3xl overflow-hidden">
					{/* 装饰元素 */}
					<div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
					<div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

					<div className="relative px-8 py-16 md:px-12 md:py-20 text-center">
						{/* 图标 */}
						<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 mb-8 shadow-lg shadow-pink-500/30">
							<Sparkles className="w-8 h-8 text-white" />
						</div>

						{/* 标题 */}
						<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
							{t("cta.title")}
						</h2>

						{/* 描述 */}
						<p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">{t("cta.description")}</p>

						{/* 按钮 */}
						<Link href={localizePath(locale, "/auth/register")}>
							<button
								type="button"
								className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-full shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-105 transition-transform transition-shadow duration-300"
							>
								{t("cta.button")}
								<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
							</button>
						</Link>

						{/* 附加信息 */}
						<p className="mt-6 text-sm text-gray-400">{t("cta.note")}</p>
					</div>
				</div>
			</div>
		</section>
	);
}
