"use client";

import { ChevronRight, Clock, Gift, Mic, Sparkles, Volume2 } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { localizePath } from "@/lib/utils";

export default function HeroSection() {
	const t = useTranslations("home.hero");
	const locale = useLocale();

	return (
		<header className="relative min-h-[70vh] sm:min-h-[75vh] flex items-center justify-center overflow-hidden bg-white dark:bg-gray-900">
			{/* 动态渐变背景 */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-gradient-to-br from-pink-200/40 via-purple-200/30 to-blue-200/20 dark:from-pink-500/10 dark:via-purple-500/10 dark:to-blue-500/10 rounded-full blur-3xl animate-pulse" />
				<div
					className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] bg-gradient-to-tr from-blue-200/40 via-purple-200/30 to-pink-200/20 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10 rounded-full blur-3xl animate-pulse"
					style={{ animationDelay: "1s" }}
				/>
			</div>

			<div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
				<div className="text-center">
					{/* 主标题 */}
					<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-3 sm:mb-4 tracking-tight">
						<span className="bg-gradient-to-r from-gray-900 via-purple-800 to-gray-900 dark:from-white dark:via-purple-300 dark:to-white bg-clip-text text-transparent">
							{t("title")}
						</span>
					</h1>

					{/* 副标题 */}
					<p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-4 sm:mb-5 leading-relaxed whitespace-pre-line px-2 sm:px-0">
						{t("subtitle")}
					</p>

					{/* 限时活动通栏 */}
					<div className="mb-4 sm:mb-5 w-full max-w-3xl mx-auto px-0 sm:px-0">
						<div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 p-[2px] shadow-lg shadow-orange-300/40">
							<div className="rounded-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-4 sm:px-6 md:px-10 py-4 sm:py-5 md:py-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-8 items-center">
									{/* 活动1 */}
									<div className="flex items-center gap-3 sm:gap-4">
										<div className="flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-300/50">
											<Gift className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
										</div>
										<div className="text-left min-w-0">
											<div className="flex items-center gap-2">
												<span className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white truncate">
													{t("promo1")}
												</span>
												<span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 flex-shrink-0">
													<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
													<span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-red-500" />
												</span>
											</div>
											<p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300 mt-0.5 leading-tight">
												{t("promo1Desc")}
											</p>
										</div>
									</div>

									{/* 分隔线（移动端隐藏） */}
									<div className="hidden md:block absolute left-1/2 top-3 bottom-3 w-px bg-gradient-to-b from-transparent via-orange-300 to-transparent" />

									{/* 活动2 */}
									<div className="flex items-center gap-3 sm:gap-4">
										<div className="flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-300/50">
											<Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
										</div>
										<div className="text-left min-w-0">
											<div className="flex items-center gap-2">
												<span className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white truncate">
													{t("promo2")}
												</span>
												<span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 flex-shrink-0">
													<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
													<span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-red-500" />
												</span>
											</div>
											<p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300 mt-0.5 leading-tight">
												{t("promo2Desc")}
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* 功能标签 */}
					<div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-5 px-2 sm:px-0">
						<div className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-sm">
							<Mic className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
							<span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
								{t("feature1")}
							</span>
						</div>
						<div className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-sm">
							<Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
							<span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
								{t("feature2")}
							</span>
						</div>
						<div className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-sm">
							<Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
							<span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
								{t("feature3")}
							</span>
						</div>
					</div>

					{/* CTA 按钮 */}
					<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 sm:px-0">
						<Link href={localizePath(locale, "/ai/tts")} className="w-full sm:w-auto">
							<button
								type="button"
								className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-3.5 sm:py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-full shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-105 transition-transform transition-shadow duration-300 text-sm sm:text-base"
							>
								{t("startButton")}
								<ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
							</button>
						</Link>
						<Link href={localizePath(locale, "/pricing")} className="w-full sm:w-auto">
							<button
								type="button"
								className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-3.5 sm:py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-full hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-colors transition-shadow duration-300 text-sm sm:text-base"
							>
								{t("pricingButton")}
							</button>
						</Link>
					</div>
				</div>
			</div>
		</header>
	);
}
