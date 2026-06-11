"use client";

import { ChevronDown, Headphones, MessageCircle, Music, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { PricingPlans } from "@/components/front/payment";
import { localizePath } from "@/lib/utils";

const LANGUAGES = [
	["中文", "粤语", "English", "Español", "Français", "Русский", "Deutsch"],
	["Português", "العربية", "Italiano", "日本語", "한국어", "Indonesian", "Tiếng Việt"],
	["Türkçe", "Nederlands", "Українська", "ไทย", "Polski", "Română", "Ελληνικά"],
	["Čeština", "Suomi", "हिन्दी", "Български", "Dansk", "עברית", "Melayu"],
	["فارسی", "Slovenčina", "Svenska", "Hrvatski", "Filipino", "Magyar", "Norsk"],
	["Slovenščina", "Català", "Nynorsk", "தமிழ்", "Afrikaans"],
];

/**
 * 动态粒子背景
 */
function ParticleBackground() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		let animationId: number;
		let particles: Array<{
			x: number;
			y: number;
			vx: number;
			vy: number;
			size: number;
			opacity: number;
		}> = [];

		const resize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};

		const createParticles = () => {
			particles = Array.from({ length: 50 }, () => ({
				x: Math.random() * canvas.width,
				y: Math.random() * canvas.height,
				vx: (Math.random() - 0.5) * 0.5,
				vy: (Math.random() - 0.5) * 0.5,
				size: Math.random() * 2 + 1,
				opacity: Math.random() * 0.5 + 0.1,
			}));
		};

		const drawParticles = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			particles.forEach((p, i) => {
				// 更新位置
				p.x += p.vx;
				p.y += p.vy;

				// 边界检测
				if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
				if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

				// 绘制粒子
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(83, 58, 253, ${p.opacity})`;
				ctx.fill();

				// 连接临近粒子
				particles.slice(i + 1).forEach((p2) => {
					const dx = p.x - p2.x;
					const dy = p.y - p2.y;
					const dist = Math.sqrt(dx * dx + dy * dy);

					if (dist < 150) {
						ctx.beginPath();
						ctx.moveTo(p.x, p.y);
						ctx.lineTo(p2.x, p2.y);
						ctx.strokeStyle = `rgba(83, 58, 253, ${0.1 * (1 - dist / 150)})`;
						ctx.lineWidth = 0.5;
						ctx.stroke();
					}
				});
			});

			animationId = requestAnimationFrame(drawParticles);
		};

		resize();
		createParticles();
		drawParticles();

		window.addEventListener("resize", () => {
			resize();
			createParticles();
		});

		return () => {
			cancelAnimationFrame(animationId);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="fixed inset-0 pointer-events-none z-0"
			style={{ opacity: 0.6 }}
		/>
	);
}

/**
 * 滚动渐入动画 Hook
 */
function useScrollReveal() {
	const ref = useRef<HTMLDivElement>(null);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					setIsVisible(true);
				}
			},
			{ threshold: 0.1 },
		);

		if (ref.current) {
			observer.observe(ref.current);
		}

		return () => observer.disconnect();
	}, []);

	return { ref, isVisible };
}

/**
 * 炫酷 FAQ 手风琴
 */
function FAQItem({
	title,
	children,
	defaultOpen = false,
	index,
}: {
	title: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
	index: number;
}) {
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const { ref, isVisible } = useScrollReveal();

	return (
		<div
			ref={ref}
			className="group relative overflow-hidden rounded-2xl transition-all duration-700"
			style={{
				opacity: isVisible ? 1 : 0,
				transform: isVisible ? "translateY(0)" : "translateY(30px)",
				transitionDelay: `${index * 80}ms`,
				background: isOpen ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.7)",
				backdropFilter: "blur(20px)",
				border: isOpen ? "1px solid rgba(83, 58, 253, 0.3)" : "1px solid rgba(255, 255, 255, 0.5)",
				boxShadow: isOpen
					? "0 25px 65px -15px rgba(83, 58, 253, 0.25), 0 0 0 1px rgba(83, 58, 253, 0.1)"
					: "0 4px 20px -5px rgba(0, 0, 0, 0.05)",
			}}
		>
			{/* 渐变光晕效果 */}
			<div
				className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-700 blur-3xl"
				style={{
					background:
						"radial-gradient(circle, rgba(83, 58, 253, 0.6) 0%, rgba(249, 107, 238, 0.3) 50%, transparent 70%)",
				}}
			/>

			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="relative z-10 w-full flex items-center justify-between px-6 py-5 text-left group-hover:bg-white/30 dark:group-hover:bg-gray-700/30 transition-all duration-300"
			>
				<span className="text-[15px] font-medium text-[#0d253d] dark:text-gray-100 pr-4 transition-all duration-300 group-hover:text-[#533afd] dark:group-hover:text-[#7c5dfd] group-hover:translate-x-1">
					{title}
				</span>
				<div
					className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
						isOpen
							? "bg-[#533afd] text-white rotate-180 shadow-lg shadow-[#533afd]/40 scale-110"
							: "bg-[#f6f9fc] dark:bg-gray-700 text-[#64748d] dark:text-gray-400 group-hover:bg-[#533afd]/10 group-hover:text-[#533afd] group-hover:scale-110"
					}`}
				>
					<ChevronDown className="w-4 h-4" />
				</div>
			</button>
			<div
				className={`relative z-10 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
					isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
				}`}
			>
				<div className="px-6 pb-6 pt-2">
					<div className="border-l-2 border-[#533afd]/20 pl-4">
						<p className="text-[14px] leading-[1.7] text-[#64748d] dark:text-gray-400">
							{children}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

/**
 * 语言标签
 */
function LanguageGrid() {
	return (
		<div className="flex flex-wrap gap-2">
			{LANGUAGES.flat().map((lang, i) => (
				<span
					key={lang}
					className="inline-flex items-center px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-300 cursor-default hover:scale-105"
					style={{
						animationDelay: `${i * 30}ms`,
						background:
							"linear-gradient(135deg, rgba(83, 58, 253, 0.08) 0%, rgba(249, 107, 238, 0.08) 100%)",
						color: "#533afd",
						border: "1px solid rgba(83, 58, 253, 0.15)",
					}}
				>
					{lang}
				</span>
			))}
		</div>
	);
}

/**
 * 特性卡片
 */
function _FeatureCard({
	icon,
	label,
	index,
}: {
	icon: React.ReactNode;
	label: string;
	index: number;
}) {
	const { ref, isVisible } = useScrollReveal();

	return (
		<div
			ref={ref}
			className="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 hover:scale-105"
			style={{
				opacity: isVisible ? 1 : 0,
				transform: isVisible ? "translateX(0)" : "translateX(-20px)",
				transitionDelay: `${index * 100}ms`,
				background: "rgba(255, 255, 255, 0.6)",
				backdropFilter: "blur(10px)",
				border: "1px solid rgba(255, 255, 255, 0.8)",
			}}
		>
			<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#533afd] to-[#7c5dfd] flex items-center justify-center shadow-lg shadow-[#533afd]/20 group-hover:shadow-[#533afd]/40 transition-shadow duration-300">
				{icon}
			</div>
			<span className="text-[13px] font-medium text-[#0d253d]">{label}</span>
		</div>
	);
}

export default function PricingPage() {
	const locale = useLocale();
	const t = useTranslations("pricing.page");
	const tf = useTranslations("pricing.page.faq.questions");

	const faqItems = [
		{ key: "q1", title: tf("q1.title"), content: tf("q1.answer") },
		{ key: "q2", title: tf("q2.title"), content: tf("q2.answer") },
		{ key: "q3", title: tf("q3.title"), content: tf("q3.answer") },
		{ key: "q4", title: tf("q4.title"), content: tf("q4.answer") },
		{ key: "q5", title: tf("q5.title"), content: tf("q5.answer") },
		{ key: "q6", title: tf("q6.title"), content: tf("q6.answer") },
		{ key: "q8", title: tf("q8.title"), content: tf("q8.answer") },
	];

	const _features = [
		{
			icon: <Headphones className="w-5 h-5 text-white" />,
			label: locale === "zh" ? "40+ 语言支持" : "40+ Languages",
		},
		{
			icon: <Music className="w-5 h-5 text-white" />,
			label: locale === "zh" ? "100+ 音色" : "100+ Voices",
		},
		{
			icon: <Wand2 className="w-5 h-5 text-white" />,
			label: locale === "zh" ? "声音克隆" : "Voice Cloning",
		},
		{
			icon: <Sparkles className="w-5 h-5 text-white" />,
			label: locale === "zh" ? "情感控制" : "Emotion Control",
		},
	];

	return (
		<div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-white via-[#f8faff] to-[#f6f9fc] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
			{/* 粒子背景 */}
			<ParticleBackground />

			{/* 全局装饰光球 */}
			<div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
				<div
					className="absolute top-[10%] -left-[15%] w-[600px] h-[600px] rounded-full opacity-15 blur-[120px] animate-pulse dark:opacity-10"
					style={{
						background: "radial-gradient(circle, #533afd 0%, #f96bee 50%, transparent 70%)",
						animationDuration: "8s",
					}}
				/>
				<div
					className="absolute top-[50%] -right-[15%] w-[500px] h-[500px] rounded-full opacity-10 blur-[120px] animate-pulse dark:opacity-5"
					style={{
						background: "radial-gradient(circle, #ea2261 0%, #f96bee 50%, transparent 70%)",
						animationDuration: "10s",
						animationDelay: "2s",
					}}
				/>
				<div
					className="absolute bottom-[5%] left-[40%] w-[400px] h-[400px] rounded-full opacity-10 blur-[100px] animate-pulse dark:opacity-5"
					style={{
						background: "radial-gradient(circle, #533afd 0%, transparent 70%)",
						animationDuration: "12s",
						animationDelay: "4s",
					}}
				/>
			</div>

			{/* ========== SECTION 1: Pricing Cards ========== */}
			<div className="relative z-10">
				<PricingPlans showDescription={true} showTitle={false} />
			</div>

			{/* ========== SECTION 2: FAQ ========== */}
			<div className="relative z-10">
				<div className="relative">
					{/* 背景渐变 */}
					<div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#f6f9fc]/50 to-white/80 dark:via-gray-800/50 dark:to-gray-900/80" />

					<div className="relative max-w-3xl mx-auto px-4 py-16 sm:py-24">
						{/* Section Header */}
						<div className="text-center mb-12">
							<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-[#533afd]/10 dark:border-[#533afd]/20 shadow-sm mb-6">
								<span className="text-[11px] font-bold text-[#533afd] uppercase tracking-widest">
									FAQ
								</span>
							</div>
							<h2
								className="text-[28px] sm:text-[36px] font-bold mb-4"
								style={{
									letterSpacing: "-0.5px",
									background: "linear-gradient(135deg, #0d253d 0%, #533afd 100%)",
									WebkitBackgroundClip: "text",
									WebkitTextFillColor: "transparent",
								}}
							>
								{t("faq.title")}
							</h2>
							<p className="text-[15px] text-[#64748d] dark:text-gray-400 max-w-md mx-auto">
								{t("faq.description")}
							</p>
						</div>

						{/* FAQ Items */}
						<div className="space-y-3">
							{faqItems.map((item, index) => (
								<FAQItem key={item.key} title={item.title} index={index}>
									{item.content}
								</FAQItem>
							))}

							<FAQItem
								title={locale === "zh" ? "40种语言都包含哪些？" : "What languages are supported?"}
								index={faqItems.length}
							>
								<LanguageGrid />
							</FAQItem>
						</div>

						{/* CTA Card */}
						<div className="mt-12 relative group">
							{/* 动态渐变边框 */}
							<div
								className="absolute -inset-[2px] rounded-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700 blur-sm"
								style={{
									background: "linear-gradient(135deg, #533afd 0%, #f96bee 50%, #ea2261 100%)",
									backgroundSize: "200% 200%",
									animation: "gradientShift 3s ease infinite",
								}}
							/>

							<div className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-8 sm:p-10 text-center">
								<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#533afd] to-[#7c5dfd] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#533afd]/30 group-hover:shadow-[#533afd]/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
									<MessageCircle className="w-8 h-8 text-white" />
								</div>

								<h3 className="text-[22px] sm:text-[24px] font-bold text-[#0d253d] mb-3">
									{locale === "zh" ? "还有疑问？" : "Still Have Questions?"}
								</h3>
								<p className="text-[14px] text-[#64748d] mb-8 max-w-sm mx-auto">
									{locale === "zh"
										? "我们的客服团队随时为您解答"
										: "Our support team is always here to help"}
								</p>

								<Link
									href={localizePath(locale, "/contact")}
									className="group/btn relative inline-flex items-center justify-center px-8 py-3.5 rounded-full text-white font-medium text-[15px] overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#533afd]/30"
									style={{
										background: "linear-gradient(135deg, #533afd 0%, #7c5dfd 100%)",
									}}
								>
									<span className="relative z-10 flex items-center gap-2">
										{locale === "zh" ? "联系客服" : "Contact Support"}
										<svg
											className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											strokeWidth={2}
											aria-hidden="true"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M13 7l5 5m0 0l-5 5m5-5H6"
											/>
										</svg>
									</span>

									{/* 按钮光效 */}
									<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* 底部装饰 */}
			<div className="relative z-10 h-px bg-gradient-to-r from-transparent via-[#533afd]/20 to-transparent" />

			{/* 全局动画样式 */}
			<style jsx global>{`
				@keyframes gradientShift {
					0%, 100% { background-position: 0% 50%; }
					50% { background-position: 100% 50%; }
				}
			`}</style>
		</div>
	);
}
