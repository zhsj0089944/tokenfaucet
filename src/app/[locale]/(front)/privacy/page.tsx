"use client";

import { useTranslations } from "next-intl";

export default function PrivacyPage() {
	const t = useTranslations("privacy");

	return (
		<main className="min-h-screen bg-black text-white py-16 px-4 md:px-8">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
				<p className="text-gray-400 mb-8">{t("effectiveDate")}</p>

				<div className="space-y-12 text-gray-300 leading-relaxed">
					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section1Title")}</h2>
						<p className="mb-3">{t("section1P1")}</p>
						<p className="mb-3">{t("section1P2")}</p>
						<p className="mb-3">{t("section1P3")}</p>
						<p>{t("section1P4")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section2Title")}</h2>
						<h3 className="text-lg font-medium text-white mb-2">{t("section2ProvidedTitle")}</h3>
						<p className="mb-3">{t("section2ProvidedP1")}</p>
						<ul className="list-disc list-inside mb-4 space-y-1">
							<li>{t("section2ProvidedLi1")}</li>
							<li>{t("section2ProvidedLi2")}</li>
						</ul>
						<h3 className="text-lg font-medium text-white mb-2">{t("section2AutoTitle")}</h3>
						<p className="mb-3">{t("section2AutoP1")}</p>
						<ul className="list-disc list-inside mb-4 space-y-1">
							<li>{t("section2AutoLi1")}</li>
							<li>{t("section2AutoLi2")}</li>
							<li>{t("section2AutoLi3")}</li>
							<li>{t("section2AutoLi4")}</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section3Title")}</h2>
						<p className="mb-3">{t("section3P1")}</p>
						<ul className="list-disc list-inside space-y-1">
							<li>{t("section3Li1")}</li>
							<li>{t("section3Li2")}</li>
							<li>{t("section3Li3")}</li>
							<li>{t("section3Li4")}</li>
							<li>{t("section3Li5")}</li>
							<li>{t("section3Li6")}</li>
							<li>{t("section3Li7")}</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section4Title")}</h2>
						<ul className="list-disc list-inside space-y-2">
							<li>{t("section4Li1")}</li>
							<li>{t("section4Li2")}</li>
							<li>{t("section4Li3")}</li>
							<li>{t("section4Li4")}</li>
							<li>{t("section4Li5")}</li>
							<li>{t("section4Li6")}</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section5Title")}</h2>
						<p className="mb-3">{t("section5P1")}</p>
						<p>{t("section5P2")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section6Title")}</h2>
						<p className="mb-3">{t("section6P1")}</p>
						<p>{t("section6P2")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section7Title")}</h2>
						<ul className="list-disc list-inside space-y-2">
							<li>{t("section7Li1")}</li>
							<li>{t("section7Li2")}</li>
							<li>{t("section7Li3")}</li>
							<li>{t("section7Li4")}</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section8Title")}</h2>
						<p className="mb-3">{t("section8P1")}</p>
						<p>{t("section8P2")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section9Title")}</h2>
						<p className="mb-3">{t("section9P1")}</p>
						<p>{t("section9P2")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section10Title")}</h2>
						<p className="mb-3">{t("section10P1")}</p>
						<p className="mb-3">{t("section10P2")}</p>
						<p>{t("section10P3")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section11Title")}</h2>
						<p className="mb-3">{t("section11P1")}</p>
						<p>{t("section11P2")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section12Title")}</h2>
						<p className="mb-3">{t("section12P1")}</p>
						<ul className="list-disc list-inside space-y-1">
							<li>{t("section12Li1")}</li>
							<li>{t("section12Li2")}</li>
							<li>{t("section12Li3")}</li>
							<li>{t("section12Li4")}</li>
							<li>{t("section12Li5")}</li>
							<li>{t("section12Li6")}</li>
							<li>{t("section12Li7")}</li>
							<li>{t("section12Li8")}</li>
							<li>{t("section12Li9")}</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section13Title")}</h2>
						<h3 className="text-lg font-medium text-white mb-3 mt-6">{t("section13CcpaTitle")}</h3>
						<p className="mb-3">{t("section13CcpaP1")}</p>
						<ul className="list-disc list-inside space-y-1 mb-4">
							<li>{t("section13CcpaLi1")}</li>
							<li>{t("section13CcpaLi2")}</li>
							<li>{t("section13CcpaLi3")}</li>
							<li>{t("section13CcpaLi4")}</li>
						</ul>
						<h3 className="text-lg font-medium text-white mb-3 mt-6">{t("section13GdprTitle")}</h3>
						<p className="mb-3">{t("section13GdprP1")}</p>
						<ul className="list-disc list-inside space-y-1">
							<li>{t("section13GdprLi1")}</li>
							<li>{t("section13GdprLi2")}</li>
							<li>{t("section13GdprLi3")}</li>
							<li>{t("section13GdprLi4")}</li>
							<li>{t("section13GdprLi5")}</li>
							<li>{t("section13GdprLi6")}</li>
							<li>{t("section13GdprLi7")}</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section14Title")}</h2>
						<p className="mb-3">{t("section14P1")}</p>
						<p className="mb-3">{t("section14P2")}</p>
						<p>{t("section14P3")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section15Title")}</h2>
						<p className="mb-3">{t("section15P1")}</p>
						<p className="text-white">
							Email：support@tokenfaucet.fun
							<br />
							Company：Flowing Cup Technology
						</p>
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
