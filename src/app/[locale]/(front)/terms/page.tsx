"use client";

import { useTranslations } from "next-intl";

export default function TermsPage() {
	const t = useTranslations("terms");

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
						<p className="mb-3">{t("section1P4")}</p>
						<p>{t("section1P5")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section2Title")}</h2>
						<h3 className="text-lg font-medium text-white mb-3">{t("section2EligibilityTitle")}</h3>
						<p className="mb-3">{t("section2EligibilityP1")}</p>
						<p className="mb-3">{t("section2EligibilityP2")}</p>
						<h3 className="text-lg font-medium text-white mb-3">{t("section2LicenseTitle")}</h3>
						<p className="mb-3">{t("section2LicenseP1")}</p>
						<h3 className="text-lg font-medium text-white mb-3">{t("section2AuthUsersTitle")}</h3>
						<p className="mb-3">{t("section2AuthUsersP1")}</p>
						<h3 className="text-lg font-medium text-white mb-3">{t("section2CommTitle")}</h3>
						<p>{t("section2CommP1")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section3Title")}</h2>
						<p className="mb-3">{t("section3P1")}</p>
						<p className="mb-3">{t("section3P2")}</p>
						<p className="mb-3">{t("section3P3")}</p>
						<p className="mb-3">{t("section3P4")}</p>
						<p className="mb-3">{t("section3P5")}</p>
						<h3 className="text-lg font-medium text-white mb-3">{t("section3TaxTitle")}</h3>
						<p>{t("section3TaxP1")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section4Title")}</h2>
						<p>{t("section4P1")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section5Title")}</h2>
						<p className="mb-3">{t("section5P1")}</p>
						<p className="mb-2 font-medium text-white">{t("section5YearlyTitle")}</p>
						<p className="mb-3">{t("section5YearlyP1")}</p>
						<p className="mb-2 font-medium text-white">{t("section5MonthlyTitle")}</p>
						<p className="mb-3">{t("section5MonthlyP1")}</p>
						<p className="mb-3">{t("section5P2")}</p>
						<h3 className="text-lg font-medium text-white mb-3">{t("section5OneTimeTitle")}</h3>
						<p className="mb-3">{t("section5OneTimeP1")}</p>
						<ul className="list-disc list-inside space-y-1 mb-3">
							<li>
								<strong>{t("section5OneTimeLi1").split("：")[0]}：</strong>
								{t("section5OneTimeLi1").split("：").slice(1).join("：")}
							</li>
							<li>
								<strong>{t("section5OneTimeLi2").split("：")[0]}：</strong>
								{t("section5OneTimeLi2").split("：").slice(1).join("：")}
							</li>
						</ul>
						<h3 className="text-lg font-medium text-white mb-3">{t("section5PointsTitle")}</h3>
						<p className="mb-3">{t("section5PointsP1")}</p>
						<ul className="list-disc list-inside space-y-1">
							<li>
								<strong>{t("section5PointsLi1").split("：")[0]}：</strong>
								{t("section5PointsLi1").split("：").slice(1).join("：")}
							</li>
							<li>
								<strong>{t("section5PointsLi2").split("：")[0]}：</strong>
								{t("section5PointsLi2").split("：").slice(1).join("：")}
							</li>
							<li>
								<strong>{t("section5PointsLi3").split("：")[0]}：</strong>
								{t("section5PointsLi3").split("：").slice(1).join("：")}
							</li>
							<li>
								<strong>{t("section5PointsLi4").split("：")[0]}：</strong>
								{t("section5PointsLi4").split("：").slice(1).join("：")}
							</li>
							<li>
								<strong>{t("section5PointsLi5").split("：")[0]}：</strong>
								{t("section5PointsLi5").split("：").slice(1).join("：")}
							</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section6Title")}</h2>
						<p className="mb-3">{t("section6P1")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section7Title")}</h2>
						<p className="mb-3">{t("section7P1")}</p>
						<p className="mb-3">{t("section7P2")}</p>
						<p>{t("section7P3")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section8Title")}</h2>
						<p>{t("section8P1")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section9Title")}</h2>
						<p className="mb-3">{t("section9P1")}</p>
						<p className="mb-3">{t("section9P2")}</p>
						<p>{t("section9P3")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section10Title")}</h2>
						<p className="mb-3">{t("section10P1")}</p>
						<p className="mb-3">{t("section10P2")}</p>
						<p className="mb-3">{t("section10P3")}</p>
						<p className="mb-3">{t("section10P4")}</p>
						<p>{t("section10P5")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section11Title")}</h2>
						<p className="mb-3">{t("section11P1")}</p>
						<h3 className="text-lg font-medium text-white mb-3">{t("section11AuthUsersTitle")}</h3>
						<p className="mb-3">{t("section11AuthUsersP1")}</p>
						<h3 className="text-lg font-medium text-white mb-3">{t("section11LimitsTitle")}</h3>
						<p className="mb-3">{t("section11LimitsP1")}</p>
						<h3 className="text-lg font-medium text-white mb-3">{t("section11MinTermTitle")}</h3>
						<p className="mb-3">{t("section11MinTermP1")}</p>
						<h3 className="text-lg font-medium text-white mb-3">{t("section11RetentionTitle")}</h3>
						<p className="mb-3">{t("section11RetentionP1")}</p>
						<h3 className="text-lg font-medium text-white mb-3">{t("section11InvoiceTitle")}</h3>
						<p>{t("section11InvoiceP1")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section12Title")}</h2>
						<p className="mb-3">{t("section12P1")}</p>
						<h3 className="text-lg font-medium text-white mb-3">{t("section12RestrictTitle")}</h3>
						<p className="mb-3">{t("section12RestrictP1")}</p>
						<ul className="list-disc list-inside space-y-1">
							<li>{t("section12RestrictLi1")}</li>
							<li>{t("section12RestrictLi2")}</li>
							<li>{t("section12RestrictLi3")}</li>
							<li>{t("section12RestrictLi4")}</li>
							<li>{t("section12RestrictLi5")}</li>
							<li>{t("section12RestrictLi6")}</li>
							<li>{t("section12RestrictLi7")}</li>
							<li>{t("section12RestrictLi8")}</li>
							<li>{t("section12RestrictLi9")}</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section13Title")}</h2>
						<p className="mb-3">{t("section13P1")}</p>
						<p className="mb-3">{t("section13P2")}</p>
						<p>{t("section13P3")}</p>
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
						<p>{t("section15P2")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section16Title")}</h2>
						<p className="mb-3">{t("section16P1")}</p>
						<p className="mb-3">{t("section16P2")}</p>
						<p>{t("section16P3")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section17Title")}</h2>
						<p className="mb-3">{t("section17P1")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section18Title")}</h2>
						<p className="mb-3">{t("section18P1")}</p>
						<h3 className="text-lg font-medium text-white mb-3">{t("section18BreachTitle")}</h3>
						<p>{t("section18BreachP1")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section19Title")}</h2>
						<p>{t("section19P1")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section20Title")}</h2>
						<p>{t("section20P1")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section21Title")}</h2>
						<p className="mb-3">{t("section21P1")}</p>
						<h3 className="text-lg font-medium text-white mb-3">{t("section21EffectTitle")}</h3>
						<p className="mb-3">{t("section21EffectP1")}</p>
						<p>{t("section21EffectP2")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section22Title")}</h2>
						<p className="mb-3">{t("section22P1")}</p>
						<p className="mb-3">{t("section22P2")}</p>
						<p>{t("section22P3")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section23Title")}</h2>
						<p className="mb-3">{t("section23P1")}</p>
						<ul className="list-disc list-inside space-y-1">
							<li>{t("section23Li1")}</li>
							<li>{t("section23Li2")}</li>
							<li>{t("section23Li3")}</li>
							<li>{t("section23Li4")}</li>
							<li>{t("section23Li5")}</li>
							<li>{t("section23Li6")}</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section24Title")}</h2>
						<p className="mb-3">{t("section24P1")}</p>
						<p className="mb-3">
							<strong>Google Analytics:</strong> {t("section24P2")}
						</p>
						<p className="mb-3">
							<strong>Paddle:</strong> {t("section24P3")}
						</p>
						<p>{t("section24P4")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section25Title")}</h2>
						<p className="mb-3">{t("section25P1")}</p>
						<p>{t("section25P2")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section26Title")}</h2>
						<p className="mb-3">{t("section26P1")}</p>
						<ul className="list-disc list-inside space-y-1">
							<li>{t("section26Li1")}</li>
							<li>{t("section26Li2")}</li>
							<li>{t("section26Li3")}</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section27Title")}</h2>
						<p className="mb-3">{t("section27P1")}</p>
						<p>{t("section27P2")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section28Title")}</h2>
						<p className="mb-3">{t("section28P1")}</p>
						<p>{t("section28P2")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section29Title")}</h2>
						<p className="mb-3">{t("section29P1")}</p>
						<p>{t("section29P2")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section30Title")}</h2>
						<p className="mb-3">{t("section30P1")}</p>
						<p className="mb-3">{t("section30P2")}</p>
						<p>{t("section30P3")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section31Title")}</h2>
						<p className="mb-3">{t("section31P1")}</p>
						<p>{t("section31P2")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section32Title")}</h2>
						<p className="mb-3">{t("section32P1")}</p>
						<p className="mb-3">{t("section32P2")}</p>
						<p className="mb-3">{t("section32P3")}</p>
						<p>{t("section32P4")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section33Title")}</h2>
						<p className="mb-3">{t("section33P1")}</p>
						<p>{t("section33P2")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section34Title")}</h2>
						<p className="mb-3">{t("section34P1")}</p>
						<p>{t("section34P2")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section35Title")}</h2>
						<p>{t("section35P1")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section36Title")}</h2>
						<p className="mb-3">{t("section36P1")}</p>
						<p>{t("section36P2")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section37Title")}</h2>
						<p>{t("section37P1")}</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-white mb-4">{t("section38Title")}</h2>
						<p className="mb-3">{t("section38P1")}</p>
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
