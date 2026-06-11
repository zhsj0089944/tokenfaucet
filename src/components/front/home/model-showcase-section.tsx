"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useId } from "react";
import { localizePath } from "@/lib/utils";

export default function ModelShowcaseSection() {
	const t = useTranslations("home");
	const locale = useLocale();
	const featuresId = useId();

	return (
		<section className="py-24 bg-gray-50/50 dark:bg-gray-900">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* 标题 */}
				<div className="text-center mb-16">
					<h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
						{t("models.title")}{" "}
						<span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
							{t("models.titleHighlight")}
						</span>
					</h2>
					<p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
						{t("models.subtitle")}
					</p>
				</div>

				{/* 能力展示卡片 */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
					{/* 基础版 */}
					<div className="relative group rounded-2xl overflow-hidden p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-colors transition-shadow duration-300">
						<div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-100/60 to-rose-100/60 dark:from-pink-500/10 dark:to-rose-500/10 rounded-full blur-2xl transform translate-x-1/3 -translate-y-1/3" />
						<div className="relative">
							<h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
								{t("models.basic.name")}
							</h3>
							<p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
								{t("models.basic.description")}
							</p>
							<div className="flex flex-wrap gap-2">
								{[t("models.basic.feature1"), t("models.basic.feature2")].map((feature) => (
									<span
										key={`${featuresId}-${feature}`}
										className="px-3 py-1 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full text-xs font-medium"
									>
										{feature}
									</span>
								))}
							</div>
						</div>
					</div>

					{/* 推荐版 */}
					<div className="relative group rounded-2xl overflow-hidden p-6 bg-gradient-to-br from-purple-600 to-indigo-700 dark:from-purple-700 dark:to-indigo-800 shadow-xl scale-105 hover:scale-110 transition-transform transition-shadow duration-300">
						<div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/3 -translate-y-1/3" />
						<div className="relative">
							<div className="flex items-center gap-2 mb-2">
								<span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white">
									推荐
								</span>
							</div>
							<h3 className="text-xl font-bold text-white mb-2">{t("models.pro.name")}</h3>
							<p className="text-sm text-white/70 mb-6 leading-relaxed">
								{t("models.pro.description")}
							</p>
							<div className="flex flex-wrap gap-2">
								{[t("models.pro.feature1"), t("models.pro.feature2"), t("models.pro.feature3")].map(
									(feature) => (
										<span
											key={`${featuresId}-${feature}`}
											className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white"
										>
											{feature}
										</span>
									),
								)}
							</div>
						</div>
					</div>

					{/* 多语言版 */}
					<div className="relative group rounded-2xl overflow-hidden p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-colors transition-shadow duration-300">
						<div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-100/60 to-cyan-100/60 dark:from-teal-500/10 dark:to-cyan-500/10 rounded-full blur-2xl transform translate-x-1/3 -translate-y-1/3" />
						<div className="relative">
							<h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
								{t("models.multilingual.name")}
							</h3>
							<p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
								{t("models.multilingual.description")}
							</p>
							<div className="flex flex-wrap gap-2">
								{[t("models.multilingual.feature1"), t("models.multilingual.feature2")].map(
									(feature) => (
										<span
											key={`${featuresId}-${feature}`}
											className="px-3 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full text-xs font-medium"
										>
											{feature}
										</span>
									),
								)}
							</div>
						</div>
					</div>
				</div>

				{/* CTA 按钮 */}
				<div className="text-center">
					<Link href={localizePath(locale, "/auth/register")}>
						<button
							type="button"
							className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-full shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-105 transition-transform transition-shadow duration-300"
						>
							{t("models.cta")}
							<ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
						</button>
					</Link>
				</div>
			</div>
		</section>
	);
}
