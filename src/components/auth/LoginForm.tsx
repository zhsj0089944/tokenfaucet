"use client";

import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/auth";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { logger } from "@/lib/logger";
import { localizePath } from "@/lib/utils";

const texts = {
	zh: {
		email: "邮箱地址",
		emailPlaceholder: "请输入您的邮箱",
		password: "密码",
		passwordPlaceholder: "请输入您的密码",
		rememberMe: "记住我 30 天",
		signIn: "登录",
		signingIn: "登录中...",
		forgotPassword: "忘记密码？",
		or: "或",
		googleSignIn: "使用 Google 登录",
		googleRedirect: "正在跳转到 Google...",
		termsIntro: "我已阅读并同意",
		terms: "服务条款",
		privacy: "隐私政策",
		and: "和",
		noAccount: "还没有账户？",
		signUpFree: "免费注册",
		showPassword: "显示密码",
		hidePassword: "隐藏密码",
		loginFailed: "登录失败，请稍后重试",
		googleFailed: "Google登录失败",
	} as const,
	en: {
		email: "Email Address",
		emailPlaceholder: "Enter your email",
		password: "Password",
		passwordPlaceholder: "Enter your password",
		rememberMe: "Remember me for 30 days",
		signIn: "Sign In",
		signingIn: "Signing in...",
		forgotPassword: "Forgot password?",
		or: "or",
		googleSignIn: "Sign in with Google",
		googleRedirect: "Redirecting to Google...",
		termsIntro: "I have read and agree to the",
		terms: "Terms of Service",
		privacy: "Privacy Policy",
		and: "and",
		noAccount: "Don't have an account?",
		signUpFree: "Sign up for free",
		showPassword: "Show password",
		hidePassword: "Hide password",
		loginFailed: "Login failed, please try again",
		googleFailed: "Google sign in failed",
	} as const,
};

const loginSchema = z.object({
	email: z.string().email("请输入有效的邮箱地址"),
	password: z.string().min(1, "请输入密码"),
});

interface LoginFormProps {
	redirectTo?: string;
	showSignUp?: boolean;
	className?: string;
}

export function LoginForm({
	redirectTo = "/dashboard",
	showSignUp = true,
	className,
}: LoginFormProps) {
	const id = useId();
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [loginError, setLoginError] = useState("");
	const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
	const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
	const [acceptGoogleTerms, setAcceptGoogleTerms] = useState(false);

	const { signIn, signInWithGoogle, error, clearError } = useAuth();
	const prefersReducedMotion = usePrefersReducedMotion();

	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();

	const locale = pathname.split("/")[1] || "zh";
	const t = texts[locale as keyof typeof texts] || texts.zh;

	const rawRedirectUrl = searchParams.get("redirect_url") || redirectTo;
	const redirectUrl =
		rawRedirectUrl.startsWith("/") && !rawRedirectUrl.startsWith(`/${locale}`)
			? `/${locale}${rawRedirectUrl}`
			: rawRedirectUrl;

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: "" }));
		}
		if (loginError) {
			setLoginError("");
		}
		if (error) {
			clearError();
		}
	};

	const validateForm = () => {
		try {
			loginSchema.parse(formData);
			setErrors({});
			return true;
		} catch (error) {
			if (error instanceof z.ZodError) {
				const newErrors: Record<string, string> = {};
				error.issues.forEach((err: z.ZodIssue) => {
					if (err.path[0]) {
						newErrors[err.path[0] as string] = err.message;
					}
				});
				setErrors(newErrors);
			}
			return false;
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setLoginError("");
		setIsEmailSubmitting(true);

		const result = await signIn(formData.email, formData.password, {
			rememberMe,
		});

		if (result.success) {
			router.push(redirectUrl);
		} else {
			logger.error("Login failed", new Error(result.error || "Unknown login error"));
			setLoginError(result.error || t.loginFailed);
		}

		setIsEmailSubmitting(false);
	};

	const handleGoogleLogin = async () => {
		try {
			setIsGoogleSubmitting(true);
			setLoginError("");
			await new Promise((resolve) => setTimeout(resolve, 300));
			const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
			const callbackURL =
				redirectUrl && redirectUrl !== `/${locale}`
					? `${baseUrl}/${locale}/auth/callback?redirect=${encodeURIComponent(redirectUrl)}`
					: `${baseUrl}/${locale}/auth/callback`;
			await signInWithGoogle(callbackURL);
		} catch (error: unknown) {
			logger.error(
				"Google login failed",
				error instanceof Error ? error : new Error(String(error)),
			);
			const message = error instanceof Error ? error.message : t.googleFailed;
			setLoginError(message);
			setIsGoogleSubmitting(false);
		}
	};

	const inputBaseClass =
		"w-full h-11 bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-300 transition-colors transition-shadow duration-200";
	const inputErrorClass = "border-red-300 focus:ring-red-200 focus:border-red-300";
	const labelClass = "block text-xs font-medium text-gray-700 mb-1.5";

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: "easeOut" }}
			className={`w-full ${className}`}
		>
			<form onSubmit={handleSubmit} className="space-y-3">
				{(loginError || error) && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={prefersReducedMotion ? { duration: 0 } : undefined}
						className="rounded-lg border border-red-200 bg-red-50 px-3 py-2"
					>
						<p className="text-xs text-red-600">{loginError || error}</p>
					</motion.div>
				)}

				{/* 邮箱 */}
				<div>
					<Label htmlFor={`${id}-email`} className={labelClass}>
						{t.email}
					</Label>
					<div className="relative">
						<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
						<Input
							id={`${id}-email`}
							type="email"
							placeholder={t.emailPlaceholder}
							value={formData.email}
							onChange={(e) => handleInputChange("email", e.target.value)}
							className={`${inputBaseClass} ${errors.email ? inputErrorClass : ""}`}
							disabled={isEmailSubmitting || isGoogleSubmitting}
							autoComplete="email"
							spellCheck={false}
						/>
					</div>
					{errors.email && <p className="mt-0.5 text-xs text-red-400">{errors.email}</p>}
				</div>

				{/* 密码 */}
				<div>
					<Label htmlFor={`${id}-password`} className={labelClass}>
						{t.password}
					</Label>
					<div className="relative">
						<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
						<Input
							id={`${id}-password`}
							type={showPassword ? "text" : "password"}
							placeholder={t.passwordPlaceholder}
							value={formData.password}
							onChange={(e) => handleInputChange("password", e.target.value)}
							className={`${inputBaseClass} pr-9 ${errors.password ? inputErrorClass : ""}`}
							disabled={isEmailSubmitting || isGoogleSubmitting}
							autoComplete="current-password"
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
							disabled={isEmailSubmitting || isGoogleSubmitting}
						>
							{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
						</button>
					</div>
					{errors.password && <p className="mt-0.5 text-xs text-red-400">{errors.password}</p>}
				</div>

				{/* 记住我和忘记密码 */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
					<label className="flex items-center cursor-pointer">
						<input
							type="checkbox"
							checked={rememberMe}
							onChange={(e) => setRememberMe(e.target.checked)}
							className="w-4 h-4 rounded border-gray-300 bg-white text-amber-500 focus:ring-amber-500/50 focus:ring-offset-0"
							disabled={isEmailSubmitting || isGoogleSubmitting}
						/>
						<span className="ml-2 text-xs text-gray-600">{t.rememberMe}</span>
					</label>
					<Link
						href={localizePath(locale, "/auth/forgot-password")}
						className="text-xs text-amber-600 hover:text-amber-500 transition-colors"
					>
						{t.forgotPassword}
					</Link>
				</div>

				{/* 登录按钮 */}
				<Button
					type="submit"
					className="w-full h-11 text-sm font-medium bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl transition-colors transition-shadow duration-200 hover:shadow-lg hover:shadow-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
					disabled={isEmailSubmitting}
				>
					{isEmailSubmitting ? (
						<div className="flex items-center justify-center gap-2">
							<Loader2 className="w-4 h-4 animate-spin" />
							{t.signingIn}
						</div>
					) : (
						t.signIn
					)}
				</Button>
			</form>

			{/* Google 登录 */}
			<div className="space-y-3">
				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<Separator className="w-full bg-gray-200" />
					</div>
					<div className="relative flex justify-center">
						<span className="bg-white px-3 text-xs text-gray-500 uppercase tracking-wider">
							{t.or}
						</span>
					</div>
				</div>

				<Button
					onClick={handleGoogleLogin}
					className="w-full py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 rounded-lg transition-colors transition-shadow duration-200"
					variant="outline"
					disabled={isGoogleSubmitting || !acceptGoogleTerms}
				>
					{isGoogleSubmitting ? (
						<div className="flex items-center justify-center gap-2">
							<Loader2 className="w-4 h-4 animate-spin" />
							<span className="animate-pulse text-xs">{t.googleRedirect}</span>
						</div>
					) : (
						<div className="flex items-center justify-center gap-2">
							<svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24">
								<path
									fill="#4285F4"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								/>
								<path
									fill="#34A853"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="#FBBC05"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="#EA4335"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							<span className="text-xs">{t.googleSignIn}</span>
						</div>
					)}
				</Button>

				<div className="flex items-start gap-2">
					<Checkbox
						id={`${id}-acceptGoogleTerms`}
						checked={acceptGoogleTerms}
						onCheckedChange={(checked) => setAcceptGoogleTerms(checked as boolean)}
						disabled={isGoogleSubmitting}
						className="mt-0.5 border-gray-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
					/>
					<Label
						htmlFor={`${id}-acceptGoogleTerms`}
						className="text-xs text-gray-600 leading-relaxed cursor-pointer"
					>
						{t.termsIntro}{" "}
						<Link
							href={localizePath(locale, "/terms")}
							className="text-amber-600 hover:text-amber-500 transition-colors"
						>
							{t.terms}
						</Link>{" "}
						{t.and}{" "}
						<Link
							href={localizePath(locale, "/privacy")}
							className="text-amber-600 hover:text-amber-500 transition-colors"
						>
							{t.privacy}
						</Link>
					</Label>
				</div>
			</div>

			{/* 注册链接 */}
			{showSignUp && (
				<div className="text-center">
					<p className="text-xs text-gray-500">
						{t.noAccount}
						<Link
							href={`/${locale}/auth/register`}
							className="ml-1 text-amber-600 hover:text-amber-500 font-medium transition-colors"
						>
							{t.signUpFree}
						</Link>
					</p>
				</div>
			)}
		</motion.div>
	);
}
