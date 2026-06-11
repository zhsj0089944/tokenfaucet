"use client";

import type { LucideIcon } from "lucide-react";
import { BookOpen, ChevronRight, FileText, RefreshCcw, Shield } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const sectionConfigs: Array<{
	id: string;
	href: string;
	icon: LucideIcon;
	comingSoon?: boolean;
}> = [
	{ id: "privacy", href: "/privacy", icon: Shield },
	{ id: "terms", href: "/terms", icon: FileText },
	{ id: "refund", href: "/refund", icon: RefreshCcw },
	{ id: "tutorial", href: "/guide/tutorial", icon: BookOpen, comingSoon: true },
];

export default function GuidePage() {
	const t = useTranslations("guide");
	const locale = useLocale();

	return (
		<main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-16 px-4">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{t("title")}</h1>
					<p className="text-lg text-gray-600 dark:text-gray-400">{t("subtitle")}</p>
				</div>

				{/* Navigation Cards */}
				<div className="space-y-4">
					{sectionConfigs.map((section) => (
						<Link
							key={section.id}
							href={section.comingSoon ? "#" : `/${locale}${section.href}`}
							className={cn(
								"block p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700",
								"hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-colors transition-shadow duration-300",
								"group",
								section.comingSoon && "opacity-75",
							)}
						>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									<div
										className={cn(
											"w-12 h-12 rounded-lg flex items-center justify-center",
											"bg-gradient-to-br from-blue-500 to-purple-500 text-white",
										)}
									>
										<section.icon className="w-6 h-6" />
									</div>
									<div>
										<h2 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
											{t(section.id)}
											{section.comingSoon && (
												<span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
													{t("comingSoon")}
												</span>
											)}
										</h2>
										<p className="text-gray-500 dark:text-gray-400 mt-1">
											{t(`${section.id}Desc`)}
										</p>
									</div>
								</div>
								<ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-transform transition-colors" />
							</div>
						</Link>
					))}
				</div>

				{/* Quick Links Footer */}
				<div className="mt-12 p-6 bg-gray-100 dark:bg-gray-800/50 rounded-xl">
					<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
						{t("quickLinks")}
					</h3>
					<div className="flex flex-wrap gap-3">
						<Link
							href={`/${locale}/ai/tts`}
							className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
						>
							{t("tryTTS")}
						</Link>
						<span className="text-gray-300">|</span>
						<Link
							href={`/${locale}/pricing`}
							className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
						>
							{t("viewPricing")}
						</Link>
						<span className="text-gray-300">|</span>
						<Link
							href={`/${locale}/contact`}
							className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
						>
							{t("contactUs")}
						</Link>
					</div>
				</div>
			</div>
		</main>
	);
}
