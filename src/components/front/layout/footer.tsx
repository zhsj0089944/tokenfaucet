"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useSiteConfig } from "@/hooks/use-site-config";

export default function Footer() {
	const locale = useLocale();
	const localePath = (path: string) => `/${locale}${path}`;
	const { siteName, isLoading } = useSiteConfig();

	// 获取当前年份
	const currentYear = new Date().getFullYear();

	// 获取网站名称（优先使用配置，其次默认，只取品牌名部分）
	const displaySiteName = isLoading ? "TokenFaucet" : siteName?.split(" - ")[0] || "TokenFaucet";

	// 法律免责声明（中英双语）
	const legalDisclaimerZh =
		"本平台仅提供 AI 合成技术服务。用户对其生成的内容负全部法律责任，包括但不限于确保已获得音频中涉及的任何人物的真实授权同意。严禁利用本服务进行政治误导、冒充公众人物、欺诈或任何侵权行为。";
	const legalDisclaimerEn =
		"This platform provides AI synthesis technology services only. Users bear full legal responsibility for all content generated, including ensuring proper authorization consent from any individuals whose voices are contained in the audio. Any use for political misinformation, impersonating public figures, fraud, or infringement is strictly prohibited.";

	return (
		<footer className="bg-gray-50 dark:bg-gray-900 border-t">
			<div className="max-w-7xl mx-auto py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
					<div className="col-span-1 sm:col-span-2 md:col-span-2">
						<div className="flex items-center">
							<span className="text-lg sm:text-xl font-bold">{displaySiteName}</span>
						</div>
						<p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-md leading-relaxed">
							{locale === "zh"
								? "基于先进的 AI 语音合成技术，为您提供自然流畅、情感丰富的语音生成服务"
								: "Advanced AI voice synthesis technology providing natural, expressive speech generation services"}
						</p>
					</div>

					<div>
						<h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase">
							{locale === "zh" ? "产品" : "Product"}
						</h3>
						<ul className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
							<li>
								<Link
									href={localePath("/pricing")}
									className="text-sm sm:text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
								>
									{locale === "zh" ? "定价" : "Pricing"}
								</Link>
							</li>
							<li>
								<Link
									href={localePath("/ai/tts")}
									className="text-sm sm:text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
								>
									{locale === "zh" ? "语音合成" : "Voice Synthesis"}
								</Link>
							</li>
						</ul>
					</div>

					<div>
						<h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase">
							{locale === "zh" ? "支持" : "Support"}
						</h3>
						<ul className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
							<li>
								<Link
									href={localePath("/contact")}
									className="text-sm sm:text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
								>
									{locale === "zh" ? "联系我们" : "Contact Us"}
								</Link>
							</li>
							<li>
								<Link
									href={localePath("/privacy")}
									className="text-sm sm:text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
								>
									{locale === "zh" ? "隐私政策" : "Privacy Policy"}
								</Link>
							</li>
							<li>
								<Link
									href={localePath("/terms")}
									className="text-sm sm:text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
								>
									{locale === "zh" ? "服务条款" : "Terms of Service"}
								</Link>
							</li>
							<li>
								<Link
									href={localePath("/refund")}
									className="text-sm sm:text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
								>
									{locale === "zh" ? "退款政策" : "Refund Policy"}
								</Link>
							</li>
						</ul>
					</div>
				</div>

				{/* 法律免责声明 */}
				<div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
					<div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
						<p className="text-[11px] sm:text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
							{locale === "zh" ? legalDisclaimerZh : legalDisclaimerEn}
						</p>
					</div>
				</div>

				{/* Product Hunt, SourceForge, Startup Fame & SideProjectors Badges */}
				<div className="mt-6 sm:mt-8 flex flex-wrap justify-center items-center gap-4">
					<a
						href="https://www.producthunt.com/products/tokenfaucet?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-tokenfaucet"
						target="_blank"
						rel="noopener noreferrer"
					>
						{/* biome-ignore lint/performance/noImgElement: external SVG badge from Product Hunt */}
						<img
							alt="TokenFaucet - Free AI Voice Daily - Top-Ranked Engine, 40+ Languages | Product Hunt"
							width={250}
							height={54}
							src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1159667&theme=light&t=1780218400367"
						/>
					</a>
					<a
						href="https://sourceforge.net/p/tokenfaucet/"
						target="_blank"
						rel="noopener noreferrer"
					>
						{/* biome-ignore lint/performance/noImgElement: external badge from SourceForge */}
						<img
							alt="Download Tokenfaucet"
							width={200}
							src="https://sourceforge.net/sflogo.php?type=17&group_id=4101529"
						/>
					</a>
					<a
						href="https://startupfa.me/s/tokenfaucet-1?utm_source=tokenfaucet.fun"
						target="_blank"
						rel="noopener noreferrer"
					>
						{/* biome-ignore lint/performance/noImgElement: external badge from Startup Fame */}
						<img
							alt="TokenFaucet - Featured on Startup Fame"
							width={224}
							height={36}
							src="https://startupfa.me/badges/featured-badge-small.webp"
						/>
					</a>
					<a
						href="https://www.sideprojectors.com/project/81903/tokenfaucet"
						target="_blank"
						rel="noopener noreferrer"
					>
						{/* biome-ignore lint/performance/noImgElement: external badge from SideProjectors */}
						<img
							alt="Check out TokenFaucet at @SideProjectors"
							width={171}
							height={54}
							src="https://www.sideprojectors.com/img/badges/badge_show_black.png"
						/>
					</a>
				</div>

				<div className="mt-6 sm:mt-8 border-t border-gray-200 dark:border-gray-700 pt-6 sm:pt-8">
					<p className="text-sm sm:text-base text-gray-400 text-center">
						© {currentYear} {displaySiteName}. All rights reserved. ·{" "}
						<a
							href="https://startupfa.me"
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-gray-600 dark:hover:text-gray-300 underline"
						>
							Featured on Startup Fame
						</a>
					</p>
				</div>
			</div>
		</footer>
	);
}
