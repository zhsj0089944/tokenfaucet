"use client";

import { motion } from "framer-motion";
import { KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useId, useRef, useState } from "react";
import { Turnstile, type TurnstileRef } from "@/components/auth/Turnstile";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const texts = {
	zh: {
		title: "重置密码",
		subtitle: "输入注册邮箱，我们将发送重置链接",
		emailPlaceholder: "请输入注册邮箱",
		sendButton: "发送重置链接",
		sending: "发送中...",
		backToLogin: "返回登录",
		sentTitle: "邮件已发送",
		sentDesc: "请检查您的邮箱，点击其中的链接来重置密码。如果找不到邮件，请检查垃圾邮件文件夹。",
		resendHint: "没收到？重新发送",
		sendFailed: "发送失败，请稍后重试",
		invalidEmail: "请输入有效的邮箱地址",
		turnstileFail: "请完成安全验证后重试",
		turnstileLoadFailed: "安全验证加载失败，请检查网络后刷新页面",
		networkError: "网络错误，请稍后重试",
		resendCountdown: "{seconds}秒后可重新发送",
	},
	en: {
		title: "Reset Password",
		subtitle: "Enter your registered email and we'll send a reset link",
		emailPlaceholder: "Enter your registered email",
		sendButton: "Send Reset Link",
		sending: "Sending...",
		backToLogin: "Back to Login",
		sentTitle: "Email Sent",
		sentDesc:
			"Please check your inbox and click the link to reset your password. If you don't see it, check your spam folder.",
		resendHint: "Didn't receive? Resend",
		sendFailed: "Failed to send, please try again",
		invalidEmail: "Please enter a valid email address",
		turnstileFail: "Please complete the security verification first.",
		turnstileLoadFailed:
			"Security verification failed to load. Please check your network and refresh.",
		networkError: "Network error, please try again",
		resendCountdown: "Resend in {seconds}s",
	},
};

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const COUNTDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
	const pathname = usePathname();
	const prefersReducedMotion = usePrefersReducedMotion();
	const locale = pathname.split("/")[1] || "zh";
	const t = texts[locale as keyof typeof texts] || texts.zh;
	const emailId = useId();

	const [email, setEmail] = useState("");
	const turnstileRef = useRef<TurnstileRef>(null);
	const [isSending, setIsSending] = useState(false);
	const [sent, setSent] = useState(false);
	const [error, setError] = useState("");
	const [countdown, setCountdown] = useState(0);

	const handleSend = useCallback(async () => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email || !emailRegex.test(email)) {
			setError(t.invalidEmail);
			return;
		}

		setError("");
		setIsSending(true);

		let token = "";
		if (TURNSTILE_SITE_KEY) {
			try {
				token = (await turnstileRef.current?.waitForToken(10000)) || "";
			} catch {
				setError(t.turnstileFail);
				setIsSending(false);
				return;
			}
		}

		try {
			const res = await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, turnstileToken: token }),
			});
			const data = await res.json();

			if (data.success) {
				setSent(true);
				setCountdown(COUNTDOWN_SECONDS);
				const timer = setInterval(() => {
					setCountdown((prev) => {
						if (prev <= 1) {
							clearInterval(timer);
							return 0;
						}
						return prev - 1;
					});
				}, 1000);
			} else {
				setError(data.error || t.sendFailed);
			}
		} catch {
			setError(t.networkError);
		} finally {
			setIsSending(false);
		}
	}, [email, t]);

	const handleResend = useCallback(() => {
		setSent(false);
		setError("");
	}, []);

	const _inputBaseClass =
		"w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-11 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-300 transition-colors transition-shadow duration-200";

	if (sent) {
		return (
			<div className="min-h-screen flex bg-[#faf9f7] relative overflow-hidden">
				{/* 左侧 - 成功状态 */}
				<div className="w-full xl:w-[560px] flex items-center justify-center px-6 sm:px-10 lg:px-12 py-8 lg:py-0 relative z-10 bg-white">
					<div className="absolute top-4 right-4 lg:top-5 lg:right-5 z-20">
						<LanguageSwitcher />
					</div>
					<div className="w-full max-w-[440px] space-y-6">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
							className="flex items-center gap-3"
						>
							<div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.15)]">
								<ShieldCheck className="w-5 h-5 text-emerald-600" />
							</div>
							<div>
								<h1 className="text-xl font-semibold text-gray-900 tracking-tight">
									{t.sentTitle}
								</h1>
								<p className="text-xs text-gray-500">TokenFaucet</p>
							</div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.3, duration: 0.3 }}
							className="space-y-4"
						>
							<p className="text-sm text-gray-500 leading-relaxed">{t.sentDesc}</p>

							<Button
								asChild
								className="w-full h-11 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl transition-colors transition-shadow duration-200 shadow-lg shadow-amber-500/20"
							>
								<Link href={`/${locale}/auth/login`}>{t.backToLogin}</Link>
							</Button>

							{countdown <= 0 && (
								<Button
									variant="ghost"
									onClick={handleResend}
									className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
								>
									{t.resendHint}
								</Button>
							)}

							{countdown > 0 && (
								<p className="text-center text-xs text-gray-500">
									{t.resendCountdown.replace("{seconds}", String(countdown))}
								</p>
							)}
						</motion.div>
					</div>
				</div>

				{/* 右侧 - 品牌展示 */}
				<RightPanel locale={locale} />
			</div>
		);
	}

	return (
		<div className="min-h-screen flex bg-[#faf9f7] relative overflow-hidden">
			{/* 左侧 - 表单 */}
			<div className="w-full xl:w-[560px] flex items-center justify-center px-6 sm:px-10 lg:px-12 py-8 lg:py-0 relative z-10 bg-white">
				<div className="absolute top-4 right-4 lg:top-5 lg:right-5 z-20">
					<LanguageSwitcher />
				</div>
				<div className="w-full max-w-[440px] space-y-6">
					{/* 标题区域 */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
						className="flex items-center gap-3"
					>
						<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.15)]">
							<KeyRound className="w-5 h-5 text-amber-600" />
						</div>
						<div>
							<h1 className="text-xl font-semibold text-gray-900 tracking-tight">{t.title}</h1>
							<p className="text-xs text-gray-500">{t.subtitle}</p>
						</div>
					</motion.div>

					<motion.form
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.1, duration: 0.4 }}
						className="space-y-5"
						onSubmit={(e) => {
							e.preventDefault();
							handleSend();
						}}
					>
						{/* 错误提示 */}
						{error && (
							<motion.div
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={prefersReducedMotion ? { duration: 0 } : undefined}
								className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"
							>
								<p className="text-sm text-red-600 text-center">{error}</p>
							</motion.div>
						)}

						{/* 邮箱输入 */}
						<div className="space-y-3">
							<Label htmlFor={emailId} className="block text-sm font-medium text-gray-700">
								邮箱
							</Label>
							<div className="relative">
								<Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
								<Input
									id={emailId}
									type="email"
									placeholder={t.emailPlaceholder}
									value={email}
									onChange={(e) => {
										setEmail(e.target.value);
										if (error) setError("");
									}}
									className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-300 transition-colors transition-shadow duration-200"
									disabled={isSending}
									autoComplete="email"
									spellCheck={false}
								/>
							</div>
						</div>

						{TURNSTILE_SITE_KEY && (
							<Turnstile ref={turnstileRef} siteKey={TURNSTILE_SITE_KEY} theme="light" />
						)}

						{/* 发送按钮 */}
						<Button
							type="submit"
							className="w-full h-12 text-sm font-medium bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl transition-colors transition-shadow duration-200 hover:shadow-lg hover:shadow-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
							disabled={isSending}
						>
							{isSending ? (
								<div className="flex items-center justify-center gap-2">
									<Loader2 className="w-4 h-4 animate-spin" />
									{t.sending}
								</div>
							) : (
								t.sendButton
							)}
						</Button>
					</motion.form>

					{/* 分隔线 + 返回登录 */}
					<div className="space-y-4">
						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<Separator className="w-full bg-gray-200" />
							</div>
							<div className="relative flex justify-center">
								<span className="bg-white px-4 text-xs text-gray-500 uppercase tracking-wider"></span>
							</div>
						</div>

						<div className="text-center">
							<Link
								href={`/${locale}/auth/login`}
								className="text-sm text-amber-600 hover:text-amber-500 font-medium transition-colors"
							>
								{t.backToLogin}
							</Link>
						</div>
					</div>
				</div>
			</div>

			{/* 右侧 - 品牌展示 */}
			<RightPanel locale={locale} />
		</div>
	);
}

function RightPanel({ locale }: { locale: string }) {
	const t =
		locale === "zh"
			? {
					brandName: "TokenFaucet",
					tagline: "忘记密码？别担心",
					description:
						"输入您的注册邮箱，我们会发送一封包含重置链接的邮件。点击链接即可设置新密码，全程安全加密。",
					feature1: "安全重置",
					feature1Desc: "加密链接，单次有效",
					feature2: "快速恢复",
					feature2Desc: "几分钟内完成重置",
					feature3: "隐私保护",
					feature3Desc: "不会泄露账户信息",
				}
			: {
					brandName: "TokenFaucet",
					tagline: "Forgot Password?",
					description:
						"Enter your registered email and we'll send a secure reset link. Click it to set a new password in minutes.",
					feature1: "Secure Reset",
					feature1Desc: "Encrypted, single-use link",
					feature2: "Quick Recovery",
					feature2Desc: "Reset in minutes",
					feature3: "Privacy First",
					feature3Desc: "Account info stays private",
				};

	return (
		<div className="hidden lg:flex flex-1 relative">
			{/* 背景渐变 */}
			<div className="absolute inset-0 bg-gradient-to-br from-[#f5f0eb] via-[#faf5ef] to-[#f0ebe5]" />

			{/* 装饰光效 */}
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
								<path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
						</div>
						<span className="text-2xl font-bold text-gray-900 tracking-tight">{t.brandName}</span>
					</div>

					{/* 主标题 */}
					<div className="space-y-5">
						<h2 className="text-4xl xl:text-5xl font-bold text-gray-900 leading-[1.1] tracking-tight">
							{t.tagline}
						</h2>
						<p className="text-base text-gray-500 leading-relaxed max-w-[420px]">{t.description}</p>
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
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
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
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
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
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
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
	);
}
