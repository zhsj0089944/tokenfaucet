"use client";

import { Globe, Languages, Mic, Sparkles, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";

const useCases = [
	{
		icon: Globe,
		titleKey: "useCases.video.title",
		descriptionKey: "useCases.video.description",
		color: "from-blue-500 to-cyan-500",
		bgColor: "bg-blue-50",
		iconColor: "text-blue-600",
	},
	{
		icon: Mic,
		titleKey: "useCases.story.title",
		descriptionKey: "useCases.story.description",
		color: "from-purple-500 to-pink-500",
		bgColor: "bg-purple-50",
		iconColor: "text-purple-600",
	},
	{
		icon: Sparkles,
		titleKey: "useCases.creative.title",
		descriptionKey: "useCases.creative.description",
		color: "from-rose-500 to-orange-500",
		bgColor: "bg-rose-50",
		iconColor: "text-rose-600",
	},
	{
		icon: Volume2,
		titleKey: "useCases.education.title",
		descriptionKey: "useCases.education.description",
		color: "from-green-500 to-emerald-500",
		bgColor: "bg-green-50",
		iconColor: "text-green-600",
	},
	{
		icon: Languages,
		titleKey: "useCases.branding.title",
		descriptionKey: "useCases.branding.description",
		color: "from-amber-500 to-yellow-500",
		bgColor: "bg-amber-50",
		iconColor: "text-amber-600",
	},
];

export default function UseCasesSection() {
	const t = useTranslations("home");

	return (
		<section className="py-24 bg-white dark:bg-gray-900">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* 标题 */}
				<div className="text-center mb-16">
					<h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
						{t("useCases.title")}
					</h2>
					<p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
						{t("useCases.subtitle")}
					</p>
				</div>

				{/* 场景卡片网格 */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{useCases.map((useCase) => {
						const Icon = useCase.icon;
						return (
							<div
								key={useCase.icon.displayName}
								className="group relative p-8 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-xl hover:border-gray-200 dark:hover:border-gray-600 transition-colors transition-shadow duration-300"
							>
								{/* 图标 */}
								<div
									className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-gradient-to-br ${useCase.color} shadow-lg`}
								>
									<Icon className="w-6 h-6 text-white" />
								</div>

								{/* 标题和描述 */}
								<h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
									{t(useCase.titleKey)}
								</h3>
								<p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">
									{t(useCase.descriptionKey)}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
