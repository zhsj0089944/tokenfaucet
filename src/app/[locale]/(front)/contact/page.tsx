"use client";

import { CheckCircle2, Globe2, Mail, MessageCircle, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

function ContactCard({
	icon: Icon,
	title,
	titleEn,
	content,
	href,
}: {
	icon: React.ElementType;
	title: string;
	titleEn: string;
	content: string;
	href?: string;
}) {
	return (
		<a
			href={href}
			target={href?.startsWith("http") ? "_blank" : undefined}
			rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
			className="group flex items-start gap-4 p-5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:border-violet-200 dark:hover:border-violet-700 hover:shadow-lg hover:shadow-violet-500/5 transition-colors transition-shadow duration-300"
		>
			<div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
				<Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
			</div>
			<div className="min-w-0">
				<h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
				<p className="text-[11px] text-gray-400 mb-2">{titleEn}</p>
				<p className="text-sm text-gray-600 dark:text-gray-300">{content}</p>
			</div>
		</a>
	);
}

function FAQAccordion({
	question,
	questionEn,
	answer,
}: {
	question: string;
	questionEn: string;
	answer: string;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const locale = useLocale();

	return (
		<div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="w-full flex items-center justify-between px-4 py-3.5 text-left bg-white/60 dark:bg-gray-800/60 hover:bg-violet-50/50 dark:hover:bg-violet-900/20 transition-colors"
			>
				<span className="text-sm font-medium text-gray-900 dark:text-gray-100">
					{locale === "zh" ? question : questionEn}
				</span>
				<span
					className={`shrink-0 ml-2 w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-[10px] font-bold text-violet-600 dark:text-violet-400 transition-transform ${isOpen ? "rotate-45" : ""}`}
				>
					+
				</span>
			</button>
			{isOpen && (
				<div className="px-4 py-3 bg-gray-50/80 dark:bg-gray-900/50 border-t border-gray-200/50 dark:border-gray-700/50">
					<p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{answer}</p>
				</div>
			)}
		</div>
	);
}

export default function ContactPage() {
	const t = useTranslations("contact");
	const locale = useLocale();

	const faqs = [
		{
			question: "响应时间是多长？",
			questionEn: "What is the response time?",
			answer:
				locale === "zh"
					? "我们通常在 24-48 小时内回复。如遇高峰期，回复可能稍有延迟。"
					: "We typically respond within 24-48 hours. Response time may be slightly longer during peak periods.",
		},
		{
			question: "支持哪些语言？",
			questionEn: "What languages are supported?",
			answer:
				locale === "zh"
					? "支持中文和英文。我们会尽快回复您的语言。"
					: "We support Chinese and English. We'll respond in your language as soon as possible.",
		},
		{
			question: "支付问题找谁？",
			questionEn: "Who do I contact for payment issues?",
			answer:
				locale === "zh"
					? "支付相关问题请通过邮件联系我们，提供您的订单号和详细描述，我们会尽快处理。"
					: "For payment-related issues, please contact us via email with your order number and description, and we'll process it as soon as possible.",
		},
	];

	return (
		<main className="min-h-screen bg-gradient-to-br from-gray-50 via-violet-50/30 to-purple-50/30 dark:from-gray-900 dark:via-violet-950/20 dark:to-purple-950/20">
			{/* Hero Section */}
			<section className="relative py-16 md:py-24">
				<div className="max-w-3xl mx-auto px-4 text-center">
					<div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-100/80 dark:bg-violet-900/40 rounded-full text-xs font-medium text-violet-700 dark:text-violet-300 mb-6">
						<CheckCircle2 className="w-3.5 h-3.5" />
						{locale === "zh" ? "我们随时为您服务" : "We're Here to Help"}
					</div>
					<h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
						{t("title")}
					</h1>
					<p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
						{locale === "zh"
							? "有任何问题或建议？我们很乐意听到您的声音"
							: "Have questions or suggestions? We'd love to hear from you"}
					</p>
				</div>
			</section>

			{/* Contact Options */}
			<section className="max-w-5xl mx-auto px-4 pb-16">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
					<ContactCard
						icon={Mail}
						title="发送邮件"
						titleEn="Send Email"
						content="support@tokenfaucet.fun"
						href="mailto:support@tokenfaucet.fun"
					/>
					<ContactCard
						icon={Globe2}
						title="访问帮助中心"
						titleEn="Visit Help Center"
						content={locale === "zh" ? "查看常见问题和使用指南" : "Browse FAQs and guides"}
						href={`/${locale}/guide`}
					/>
					<ContactCard
						icon={Users}
						title="加入社区"
						titleEn="Join Community"
						content={locale === "zh" ? "与其他用户交流经验" : "Connect with other users"}
						href="#"
					/>
					<ContactCard
						icon={MessageCircle}
						title="在线客服"
						titleEn="Live Chat"
						content={
							locale === "zh" ? "工作时间：周一至周五 9:00-18:00" : "Mon-Fri 9:00-18:00 (UTC+8)"
						}
						href="#"
					/>
				</div>

				{/* FAQ Section */}
				<div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-3xl border border-gray-200/50 dark:border-gray-700/50 p-6 md:p-8">
					<h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
						{locale === "zh" ? "常见问题" : "Frequently Asked Questions"}
					</h2>
					<div className="space-y-3">
						{faqs.map((faq) => (
							<FAQAccordion
								key={faq.question}
								question={faq.question}
								questionEn={faq.questionEn}
								answer={faq.answer}
							/>
						))}
					</div>
				</div>

				{/* Footer Note */}
				<div className="mt-8 text-center">
					<p className="text-sm text-gray-500 dark:text-gray-400">
						{locale === "zh"
							? "我们会尽快回复您的消息。感谢您的耐心！"
							: "We'll get back to you as soon as possible. Thank you for your patience!"}
					</p>
				</div>
			</section>
		</main>
	);
}
