"use client";

import { ArrowRight, Film, Mic2, PenLine, Rocket, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { localizePath } from "@/lib/utils";

export default function FeaturesHighlightSection() {
	const t = useTranslations("home");
	const locale = useLocale();
	const avatarKeys = useMemo(() => Array.from({ length: 5 }, () => crypto.randomUUID()), []);
	const waveformKeys = useMemo(() => Array.from({ length: 20 }, () => crypto.randomUUID()), []);

	const topCards = [
		{
			title: t("studio.correction.title"),
			description: t("studio.correction.description"),
			highlight: t("studio.correction.highlight"),
			icon: PenLine,
			gradient: "from-blue-500 to-cyan-500",
			shadowColor: "shadow-blue-500/30",
			bgColor: "bg-gradient-to-br from-blue-500 to-cyan-500",
			tagBg: "bg-blue-50",
			tagText: "text-blue-600",
			iconColor: "text-blue-400",
		},
		{
			title: t("studio.anime.title"),
			description: t("studio.anime.description"),
			highlight: t("studio.anime.highlight"),
			icon: Film,
			gradient: "from-orange-500 to-pink-500",
			shadowColor: "shadow-orange-500/30",
			bgColor: "bg-gradient-to-br from-orange-500 to-pink-500",
			tagBg: "bg-orange-50",
			tagText: "text-orange-600",
			iconColor: "text-orange-400",
		},
		{
			title: t("studio.creator.title"),
			description: t("studio.creator.description"),
			highlight: t("studio.creator.highlight"),
			icon: Rocket,
			gradient: "from-purple-500 to-violet-500",
			shadowColor: "shadow-purple-500/30",
			bgColor: "bg-gradient-to-br from-purple-500 to-violet-500",
			tagBg: "bg-purple-50",
			tagText: "text-purple-600",
			iconColor: "text-purple-400",
		},
	];

	return (
		<section className="py-24 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900 dark:to-gray-900">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* 标题区域 */}
				<div className="text-center mb-16">
					<h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
						{t("studio.title")}
					</h2>
					<p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
						{t("studio.subtitle")}
					</p>
				</div>

				{/* 全部 5 张卡片网格 */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{/* 第一排：3 张卡片（占据左中位置） */}
					{topCards.map((card, _index) => {
						const Icon = card.icon;
						return (
							<div
								key={card.title}
								className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-colors transition-shadow duration-300"
							>
								{/* 左侧彩色装饰条 */}
								<div
									className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${card.gradient}`}
								/>

								<div className="p-7">
									{/* 图标和标题同一行 */}
									<div className="flex items-center gap-4 mb-4">
										<div
											className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center shadow-lg ${card.shadowColor} shrink-0`}
										>
											<Icon className="w-6 h-6 text-white" />
										</div>
										<h3 className="text-xl font-bold text-gray-900 dark:text-white">
											{card.title}
										</h3>
									</div>

									{/* 描述 */}
									<p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
										{card.description}
									</p>

									{/* 高亮标签 */}
									<div
										className={`inline-flex items-center gap-2 px-3 py-1.5 ${card.tagBg} rounded-full`}
									>
										<Sparkles className={`w-3.5 h-3.5 ${card.iconColor}`} />
										<span className={`text-sm font-semibold ${card.tagText}`}>
											{card.highlight}
										</span>
									</div>
								</div>
							</div>
						);
					})}

					{/* 音色库卡片（占据右下位置） */}
					<div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-colors transition-shadow duration-300">
						<div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-orange-100/50 to-pink-100/50 dark:from-orange-500/10 dark:to-pink-500/10 rounded-full blur-2xl transform translate-x-1/4 -translate-y-1/4" />

						<div className="relative p-7">
							{/* 图标 */}
							<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center mb-5 shadow-lg shadow-orange-500/30 shrink-0">
								<Users className="w-6 h-6 text-white" />
							</div>

							{/* 标题 */}
							<h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
								{t("studio.voiceLibrary.title")}
							</h3>

							{/* 描述 */}
							<p className="text-gray-600 dark:text-gray-300 mb-5">
								{t("studio.voiceLibrary.description")}
							</p>

							{/* 数量和头像 */}
							<div className="flex items-center gap-3 mb-5">
								<div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900/30 dark:to-pink-900/30 rounded-full">
									<span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 dark:from-orange-400 dark:to-pink-400 bg-clip-text text-transparent">
										{t("studio.voiceLibrary.count")}
									</span>
									<span className="text-sm text-gray-600 dark:text-gray-300">
										{t("studio.voiceLibrary.countLabel")}
									</span>
								</div>
							</div>

							{/* 声音头像列表 */}
							<div className="flex items-center gap-2 mb-5">
								<div className="flex -space-x-2">
									{[...Array(5)].map((_, i) => (
										<div
											key={avatarKeys[i]}
											className="w-9 h-9 rounded-full border-2 border-white dark:border-gray-800 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold shadow-md"
										>
											{String.fromCharCode(65 + i)}
										</div>
									))}
								</div>
								<span className="text-sm text-gray-500 dark:text-gray-400">+99</span>
							</div>

							{/* CTA */}
							<Link
								href={localizePath(locale, "/ai/tts")}
								className="inline-flex items-center gap-2 text-orange-500 font-medium hover:text-orange-600 transition-colors group"
							>
								{t("studio.voiceLibrary.cta")}
								<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
							</Link>
						</div>

						{/* 装饰 */}
						<div className="absolute bottom-0 right-0 w-32 h-32 opacity-15">
							<div className="absolute inset-0 bg-gradient-to-br from-orange-300 to-pink-300 dark:from-orange-500 dark:to-pink-500 rounded-t-full rounded-bl-full" />
						</div>
					</div>

					{/* 声音克隆卡片（占据右下角） */}
					<div className="group relative bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-colors transition-shadow duration-300 lg:col-span-2">
						<div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-2xl transform translate-x-1/4 -translate-y-1/4" />

						<div className="relative p-7">
							<div className="flex items-start gap-6">
								{/* 左侧内容 */}
								<div className="flex-1">
									{/* 图标和标题 */}
									<div className="flex items-center gap-4 mb-4">
										<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/30 shrink-0">
											<Mic2 className="w-6 h-6 text-white" />
										</div>
										<h3 className="text-xl font-bold text-white">{t("studio.voiceClone.title")}</h3>
									</div>

									{/* 描述 */}
									<p className="text-gray-400 mb-5">{t("studio.voiceClone.description")}</p>

									{/* 亮点标签 */}
									<div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full mb-5">
										<Sparkles className="w-3.5 h-3.5 text-purple-400" />
										<span className="text-sm text-white font-medium">
											{t("studio.voiceClone.highlight")}
										</span>
									</div>

									{/* CTA */}
									<Link
										href={localizePath(locale, "/ai/tts")}
										className="inline-flex items-center gap-2 text-purple-400 font-medium hover:text-purple-300 transition-colors group"
									>
										{t("studio.voiceClone.cta")}
										<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
									</Link>
								</div>

								{/* 右侧流程图 */}
								<div className="flex items-center gap-3">
									<div className="flex flex-col items-center gap-2">
										<div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400/20 to-blue-400/20 border-2 border-dashed border-purple-400/50 flex items-center justify-center">
											<Mic2 className="w-5 h-5 text-purple-400" />
										</div>
										<span className="text-xs text-gray-500 dark:text-gray-400">
											{t("studio.voiceClone.step1")}
										</span>
									</div>

									<div className="w-8 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500" />

									<div className="flex flex-col items-center gap-2">
										<div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400/20 to-cyan-400/20 flex items-center justify-center">
											<Sparkles className="w-5 h-5 text-blue-400" />
										</div>
										<span className="text-xs text-gray-500 dark:text-gray-400">
											{t("studio.voiceClone.step2")}
										</span>
									</div>

									<div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500" />

									<div className="flex flex-col items-center gap-2">
										<div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400/20 to-teal-400/20 flex items-center justify-center">
											<Users className="w-5 h-5 text-cyan-400" />
										</div>
										<span className="text-xs text-gray-500 dark:text-gray-400">
											{t("studio.voiceClone.step3")}
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* 装饰波形 */}
						<div className="absolute bottom-4 left-8 right-8 flex items-end justify-center gap-1 h-10 opacity-30">
							{[...Array(20)].map((_, i) => (
								<div
									key={waveformKeys[i]}
									className="w-1 bg-gradient-to-t from-purple-400 to-blue-400 rounded-full"
									style={{
										height: `${20 + Math.sin(i * 0.5) * 60}%`,
									}}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
