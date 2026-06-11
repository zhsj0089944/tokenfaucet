"use client";

import { useTranslations } from "next-intl";

export default function RefundPage() {
	const t = useTranslations("refund");

	return (
		<main className="min-h-screen bg-black text-white py-16 px-4 md:px-8">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
				<p className="text-gray-400 mb-8">{t("effectiveDate")}</p>

				<div className="space-y-12 text-gray-300 leading-relaxed">
					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section1Title")}</h2>

						<h3 className="text-lg font-medium text-white mb-3">{t("section1PeriodTitle")}</h3>
						<p className="mb-3">{t("section1PeriodP1")}</p>

						<h3 className="text-lg font-medium text-white mb-3">{t("section1AfterTitle")}</h3>
						<p className="mb-3">{t("section1AfterP1")}</p>

						<div className="p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg mt-4">
							<p className="text-yellow-400 font-medium">{t("section1Note")}</p>
						</div>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section2Title")}</h2>
						<ul className="list-disc list-inside space-y-2">
							<li>
								{t("section2Li1Prefix")}
								<strong className="text-white">{t("section2Li1Highlight")}</strong>
								{t("section2Li1Suffix")}
							</li>
							<li>
								{t("section2Li2Prefix")}
								<strong className="text-white">{t("section2Li2Highlight")}</strong>
								{t("section2Li2Suffix")}
							</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section3Title")}</h2>
						<p className="mb-3">{t("section3P1")}</p>
						<p>{t("section3P2")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section4Title")}</h2>
						<p className="mb-3">{t("section4P1")}</p>
						<div className="p-4 bg-gray-800 rounded-lg">
							<p className="text-white">
								Email：
								<a href="mailto:support@tokenfaucet.fun" className="text-blue-400 hover:underline">
									support@tokenfaucet.fun
								</a>
							</p>
						</div>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section5Title")}</h2>
						<p className="mb-3">{t("section5P1")}</p>
						<div className="p-4 bg-gray-800 rounded-lg">
							<p className="text-white">
								Support Email：
								<a href="mailto:support@tokenfaucet.fun" className="text-blue-400 hover:underline">
									support@tokenfaucet.fun
								</a>
							</p>
						</div>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section6Title")}</h2>
						<p>{t("section6P1")}</p>
					</section>
				</div>

				<div className="mt-16 pt-8 border-t border-gray-800">
					<p className="text-gray-500 text-sm">
						{t("copyright", { year: new Date().getFullYear() })}
					</p>
				</div>
			</div>
		</main>
	);
}
