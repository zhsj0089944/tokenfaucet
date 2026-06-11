import { User } from "lucide-react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { LanguageSwitcher } from "@/components/common/language-switcher";

export async function generateMetadata({
	params: paramsPromise,
}: {
	params: Promise<{ locale: "zh" | "en" }>;
}) {
	const { locale } = await paramsPromise;
	const titles = {
		zh: "注册 - TokenFaucet",
		en: "Sign Up - TokenFaucet",
	};
	const descriptions = {
		zh: "创建您的 TokenFaucet 账户，开始智能化体验",
		en: "Create your TokenFaucet account and start your AI journey",
	};
	return {
		title: titles[locale],
		description: descriptions[locale],
	};
}

const texts = {
	zh: {
		title: "创建账户",
		subtitle: "加入 TokenFaucet，开启 AI 智能之旅",
		brandName: "TokenFaucet",
		tagline: "释放 AI 的无限创造力",
		description:
			"一站式 AI 智能平台，让创作更简单，让效率更出众。从文本生成到代码编写，从内容创作到数据分析，一切尽在指尖。",
		feature1: "智能创作",
		feature1Desc: "AI 驱动的内容生成与优化",
		feature2: "丰富音色",
		feature2Desc: "多种 AI 音色，自然逼真",
		feature3: "安全可靠",
		feature3Desc: "企业级数据保护与加密",
	},
	en: {
		title: "Create Account",
		subtitle: "Join TokenFaucet, start your AI journey",
		brandName: "TokenFaucet",
		tagline: "Unlock Infinite Creativity",
		description:
			"All-in-one AI platform for creation and productivity. From text generation to code writing, everything at your fingertips.",
		feature1: "Smart Creation",
		feature1Desc: "AI-powered content generation",
		feature2: "Rich Voices",
		feature2Desc: "Multiple AI voices, natural and lifelike",
		feature3: "Secure & Reliable",
		feature3Desc: "Enterprise-grade data protection",
	},
};

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
	const { locale } = await params;
	const t = texts[locale as keyof typeof texts] || texts.zh;

	return (
		<div className="min-h-screen flex bg-[#faf9f7] relative overflow-hidden">
			{/* 左侧 - 注册表单 */}
			<div className="w-full xl:w-[560px] flex items-center justify-center px-6 sm:px-10 lg:px-12 py-8 lg:py-0 relative z-10 bg-white">
				<div className="absolute top-4 right-4 lg:top-5 lg:right-5 z-20">
					<LanguageSwitcher />
				</div>
				<div className="w-full max-w-[440px] space-y-6">
					{/* 标题区域 */}
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.15)]">
							<User className="w-5 h-5 text-amber-600" />
						</div>
						<div>
							<h1 className="text-xl font-semibold text-gray-900 tracking-tight">{t.title}</h1>
							<p className="text-xs text-gray-500">{t.subtitle}</p>
						</div>
					</div>

					<RegisterForm />
				</div>
			</div>

			{/* 右侧 - 品牌展示区 */}
			<div className="hidden lg:flex flex-1 relative">
				{/* 背景渐变 - 更深邃的色调 */}
				<div className="absolute inset-0 bg-gradient-to-br from-[#f5f0eb] via-[#faf5ef] to-[#f0ebe5]" />

				{/* 装饰光效 - 琥珀色主调 */}
				<div className="absolute inset-0">
					<div className="absolute top-[15%] left-[20%] w-[500px] h-[500px] bg-amber-200/30 rounded-full blur-[180px]" />
					<div className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] bg-orange-200/25 rounded-full blur-[150px]" />
					<div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-yellow-200/20 rounded-full blur-[120px]" />
				</div>

				{/* 网格纹理 */}
				<div
					className="absolute inset-0 opacity-[0.03]"
					style={{
						backgroundImage: `linear-gradient(rgba(180,130,60,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(180,130,60,0.5) 1px, transparent 1px)`,
						backgroundSize: "64px 64px",
					}}
				/>

				{/* 装饰圆环 */}
				<div
					className="absolute top-[18%] right-[12%] w-32 h-32 rounded-full border border-amber-300/20 animate-spin"
					style={{ animationDuration: "40s" }}
				>
					<div className="absolute inset-4 rounded-full border border-amber-300/10" />
				</div>
				<div
					className="absolute bottom-[25%] left-[8%] w-20 h-20 rounded-full border border-orange-300/20 animate-spin"
					style={{ animationDuration: "25s", animationDirection: "reverse" }}
				/>

				{/* 装饰线条 */}
				<div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-amber-300/15 to-transparent" />
				<div className="absolute top-[30%] right-0 w-px h-[40%] bg-gradient-to-b from-transparent via-amber-300/10 to-transparent" />

				{/* 内容区域 */}
				<div className="relative z-10 flex flex-col justify-center w-full px-16 xl:px-24">
					<div className="max-w-lg space-y-12">
						{/* 品牌标识 */}
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
								<svg
									className="w-6 h-6 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2}
									aria-hidden="true"
								>
									<title>Lightning bolt</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M13 10V3L4 14h7v7l9-11h-7z"
									/>
								</svg>
							</div>
							<span className="text-2xl font-bold text-gray-900 tracking-tight">{t.brandName}</span>
						</div>

						{/* 主标题 */}
						<div className="space-y-5">
							<h2 className="text-4xl xl:text-5xl font-bold text-gray-900 leading-[1.1] tracking-tight">
								{t.tagline}
							</h2>
							<p className="text-base text-gray-500 leading-relaxed max-w-[420px]">
								{t.description}
							</p>
						</div>

						{/* 特性列表 */}
						<div className="space-y-5">
							<div className="flex items-start gap-4 group">
								<div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0 group-hover:bg-amber-100 group-hover:border-amber-300/60 transition-colors transition-shadow duration-300">
									<svg
										className="w-5 h-5 text-amber-600"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={1.5}
										aria-hidden="true"
									>
										<title>Sparkles</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
										/>
									</svg>
								</div>
								<div className="pt-1">
									<h3 className="text-gray-900 text-base font-medium">{t.feature1}</h3>
									<p className="text-sm text-gray-500 mt-0.5">{t.feature1Desc}</p>
								</div>
							</div>

							<div className="flex items-start gap-4 group">
								<div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center shrink-0 group-hover:bg-orange-100 group-hover:border-orange-300/60 transition-colors transition-shadow duration-300">
									<svg
										className="w-5 h-5 text-orange-600"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={1.5}
										aria-hidden="true"
									>
										<title>Image</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
										/>
									</svg>
								</div>
								<div className="pt-1">
									<h3 className="text-gray-900 text-base font-medium">{t.feature2}</h3>
									<p className="text-sm text-gray-500 mt-0.5">{t.feature2Desc}</p>
								</div>
							</div>

							<div className="flex items-start gap-4 group">
								<div className="w-10 h-10 rounded-xl bg-yellow-50 border border-yellow-200/60 flex items-center justify-center shrink-0 group-hover:bg-yellow-100 group-hover:border-yellow-300/60 transition-colors transition-shadow duration-300">
									<svg
										className="w-5 h-5 text-yellow-600"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={1.5}
										aria-hidden="true"
									>
										<title>Shield check</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
										/>
									</svg>
								</div>
								<div className="pt-1">
									<h3 className="text-gray-900 text-base font-medium">{t.feature3}</h3>
									<p className="text-sm text-gray-500 mt-0.5">{t.feature3Desc}</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
