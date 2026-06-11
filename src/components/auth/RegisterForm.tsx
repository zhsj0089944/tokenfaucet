"use client";

import { motion } from "framer-motion";
import { CheckCircle, Eye, EyeOff, Gift, Loader2, Lock, Mail, Send, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Turnstile, type TurnstileRef } from "@/components/auth/Turnstile";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/auth";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { logger } from "@/lib/logger";
import { localizePath } from "@/lib/utils";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const COUNTDOWN_SECONDS = 60;

const texts = {
	zh: {
		username: "用户名",
		usernamePlaceholder: "请输入您的用户名",
		email: "邮箱地址",
		emailPlaceholder: "请输入您的邮箱",
		verificationCode: "邮箱验证码",
		codePlaceholder: "请输入6位验证码",
		password: "密码",
		passwordPlaceholder: "请输入您的密码",
		sendCode: "发送验证码",
		verify: "验证",
		creating: "创建中...",
		createAccount: "创建账户",
		sendCodeFirst: "请先发送验证码",
		verifyFirst: "请先验证邮箱",
		googleRegister: "使用 Google 注册",
		googleRedirect: "正在跳转到 Google...",
		or: "或",
		termsIntro: "我已阅读并同意",
		terms: "服务条款",
		privacy: "隐私政策",
		weak: "弱",
		medium: "中",
		strong: "强",
		atLeast6: "至少6个字符",
		upperLower: "包含大小写字母",
		hasNumber: "包含数字",
		codeVerified: "邮箱验证通过",
		haveAccount: "已有账户？",
		login: "立即登录",
		typoPrefix: "您是不是想输入",
		typoSuffix: "？",
		enterValidEmail: "请输入有效的邮箱地址",
		enter6Digits: "请输入6位验证码",
		sendFailed: "验证码发送失败，请重试",
		codeError: "验证码错误",
		networkError: "网络错误，请稍后重试",
		registerFailed: "注册失败，请稍后重试",
		googleFailed: "Google登录失败",
		turnstileExpired: "验证已过期，请重新验证",
		turnstileIncomplete: "请完成安全验证后重试",
		turnstileLoadFailed: "安全验证加载失败，请检查网络后刷新页面",
		verifyEmailFirst: "请先验证邮箱验证码",
		sendCodeFirstMsg: "请先发送验证码到您的邮箱",
		and: "和",
		showPassword: "显示密码",
		hidePassword: "隐藏密码",
		usernameTooShort: "用户名至少需要3个字符",
		usernameTooLong: "用户名不能超过20个字符",
		usernameTaken: "用户名已被占用",
		passwordTooShort: "密码至少需要6个字符",
		passwordTooLong: "密码不能超过100个字符",
		passwordRegex: "密码需要包含大小写字母和数字",
		acceptTermsRequired: "请同意服务条款和隐私政策",
		invitationCode: "邀请码（选填）",
		invitationCodePlaceholder: "输入邀请码，双方各得2500积分",
	},
	en: {
		username: "Username",
		usernamePlaceholder: "Enter your username",
		email: "Email Address",
		emailPlaceholder: "Enter your email",
		verificationCode: "Verification Code",
		codePlaceholder: "Enter 6-digit code",
		password: "Password",
		passwordPlaceholder: "Enter your password",
		sendCode: "Send Code",
		verify: "Verify",
		creating: "Creating...",
		createAccount: "Create Account",
		sendCodeFirst: "Send verification code first",
		verifyFirst: "Verify email first",
		googleRegister: "Sign up with Google",
		googleRedirect: "Redirecting to Google...",
		or: "or",
		termsIntro: "I have read and agree to the",
		terms: "Terms of Service",
		privacy: "Privacy Policy",
		weak: "Weak",
		medium: "Medium",
		strong: "Strong",
		atLeast6: "At least 6 characters",
		upperLower: "Uppercase & lowercase letters",
		hasNumber: "Contains a number",
		codeVerified: "Email verified",
		haveAccount: "Already have an account?",
		login: "Sign in",
		typoPrefix: "Did you mean",
		typoSuffix: "?",
		enterValidEmail: "Please enter a valid email",
		enter6Digits: "Please enter the 6-digit code",
		sendFailed: "Failed to send code",
		codeError: "Invalid code",
		networkError: "Network error, please try again",
		registerFailed: "Registration failed, please try again",
		googleFailed: "Google sign in failed",
		turnstileExpired: "Verification expired, please try again",
		turnstileIncomplete: "Please complete the security verification first.",
		turnstileLoadFailed:
			"Security verification failed to load. Please check your network and refresh.",
		verifyEmailFirst: "Please verify your email code first",
		sendCodeFirstMsg: "Please send a verification code first",
		and: "and",
		showPassword: "Show password",
		hidePassword: "Hide password",
		usernameTooShort: "Username must be at least 3 characters",
		usernameTooLong: "Username cannot exceed 20 characters",
		usernameTaken: "Username is already taken",
		passwordTooShort: "Password must be at least 6 characters",
		passwordTooLong: "Password cannot exceed 100 characters",
		passwordRegex: "Password must contain uppercase, lowercase and number",
		acceptTermsRequired: "Please agree to the Terms of Service and Privacy Policy",
		invitationCode: "Invitation Code (optional)",
		invitationCodePlaceholder: "Enter code, both get 2500 points",
	},
};

const commonEmailTypos: Record<string, string> = {
	"gmial.com": "gmail.com",
	"gmai.com": "gmail.com",
	"gmail.co": "gmail.com",
	"gmail.con": "gmail.com",
	"gamil.com": "gmail.com",
	"yahooo.com": "yahoo.com",
	"yaho.com": "yahoo.com",
	"yahoo.co": "yahoo.com",
	"yahoo.con": "yahoo.com",
	"hotmial.com": "hotmail.com",
	"hotmail.co": "hotmail.com",
	"hotmail.con": "hotmail.com",
	"outlok.com": "outlook.com",
	"outlook.co": "outlook.com",
	"outlook.con": "outlook.com",
	"qq.co": "qq.com",
	"qq.con": "qq.com",
	"163.co": "163.com",
	"163.con": "163.com",
	"126.co": "126.com",
	"126.con": "126.com",
	"sina.co": "sina.com",
	"sina.con": "sina.com",
};

function checkEmailDomainTypo(email: string): string | null {
	const domain = email.split("@")[1]?.toLowerCase();
	if (!domain) return null;
	const correction = commonEmailTypos[domain];
	return correction ? `${email.split("@")[0]}@${correction}` : null;
}

const getRegisterSchema = (t: Record<string, string>) =>
	z.object({
		fullName: z.string().min(3, t.usernameTooShort).max(20, t.usernameTooLong),
		email: z.string().email(t.enterValidEmail),
		password: z
			.string()
			.min(6, t.passwordTooShort)
			.max(100, t.passwordTooLong)
			.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, t.passwordRegex),
		acceptTerms: z.boolean().refine((val) => val === true, t.acceptTermsRequired),
	});

interface RegisterFormProps {
	redirectTo?: string;
	showSignIn?: boolean;
	className?: string;
}

export function RegisterForm({
	redirectTo = "/dashboard",
	showSignIn = true,
	className,
}: RegisterFormProps) {
	const id = useId();
	const [formData, setFormData] = useState({
		fullName: "",
		email: "",
		password: "",
		acceptTerms: false,
		invitationCode: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [registerError, setRegisterError] = useState("");
	const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
	const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
	const turnstileRef = useRef<TurnstileRef>(null);
	const [emailTypoSuggestion, setEmailTypoSuggestion] = useState<string | null>(null);
	const [acceptGoogleTerms, setAcceptGoogleTerms] = useState(false);

	const [verificationCode, setVerificationCode] = useState("");
	const [codeSent, setCodeSent] = useState(false);
	const [codeSending, setCodeSending] = useState(false);
	const [codeVerified, setCodeVerified] = useState(false);
	const [countdown, setCountdown] = useState(0);
	const countdownRef = useRef<NodeJS.Timeout | null>(null);

	const { signUp, signInWithGoogle, error, clearError } = useAuth();
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

	useEffect(() => {
		if (countdown <= 0) {
			if (countdownRef.current) {
				clearInterval(countdownRef.current);
				countdownRef.current = null;
			}
			return;
		}
		countdownRef.current = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					if (countdownRef.current) {
						clearInterval(countdownRef.current);
						countdownRef.current = null;
					}
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
		return () => {
			if (countdownRef.current) {
				clearInterval(countdownRef.current);
				countdownRef.current = null;
			}
		};
	}, [countdown]);

	const handleSendCode = useCallback(async () => {
		const emailResult = z.string().email(t.enterValidEmail).safeParse(formData.email);
		if (!emailResult.success) {
			setRegisterError(t.enterValidEmail);
			return;
		}

		setCodeSending(true);
		setRegisterError("");

		let token = "";
		if (TURNSTILE_SITE_KEY) {
			try {
				token = (await turnstileRef.current?.waitForToken(10000)) || "";
			} catch {
				setCodeSending(false);
				setRegisterError(t.turnstileIncomplete);
				return;
			}
		}

		try {
			const res = await fetch("/api/auth/send-verification-code", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: formData.email,
					turnstileToken: token || "",
				}),
			});
			const data = await res.json();

			if (data.success) {
				setCodeSent(true);
				setCountdown(COUNTDOWN_SECONDS);
				setCodeVerified(false);
				setVerificationCode("");
			} else {
				setRegisterError(data.error || t.sendFailed);
			}
		} catch {
			setRegisterError(t.networkError);
		} finally {
			setCodeSending(false);
		}
	}, [formData.email, t]);

	const handleInputChange = (field: string, value: string | boolean) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: "" }));
		}
		if (registerError) {
			setRegisterError("");
		}
		if (error) {
			clearError();
		}
		if (field === "email" && typeof value === "string" && value.includes("@")) {
			const suggestion = checkEmailDomainTypo(value);
			setEmailTypoSuggestion(suggestion);
		} else if (field === "email") {
			setEmailTypoSuggestion(null);
		}
	};

	const validateForm = () => {
		try {
			getRegisterSchema(t).parse(formData);
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

	const getPasswordStrength = (password: string) => {
		let strength = 0;
		const checks = [
			password.length >= 6,
			/[a-z]/.test(password),
			/[A-Z]/.test(password),
			/\d/.test(password),
			/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password),
		];

		strength = checks.filter(Boolean).length;

		if (strength < 2) return { level: "weak", color: "bg-red-500", text: t.weak };
		if (strength < 4) return { level: "medium", color: "bg-yellow-500", text: t.medium };
		return { level: "strong", color: "bg-emerald-500", text: t.strong };
	};

	const passwordStrength = getPasswordStrength(formData.password);

	const invitationCode = searchParams.get("code");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		if (!codeVerified) {
			setRegisterError(codeSent ? t.verifyEmailFirst : t.sendCodeFirstMsg);
			return;
		}

		setRegisterError("");
		setIsEmailSubmitting(true);

		try {
			const checkRes = await fetch(
				`/api/auth/check-username?username=${encodeURIComponent(formData.fullName)}`,
			);
			const checkData = await checkRes.json();
			if (!checkData.available) {
				setRegisterError(t.usernameTaken);
				setIsEmailSubmitting(false);
				return;
			}
		} catch {
			// 检查接口异常时不阻断注册
		}

		try {
			const result = await signUp(formData.email, formData.password, formData.fullName);
			if (result.success) {
				const codeToUse = formData.invitationCode || invitationCode;
				if (codeToUse) {
					try {
						const validateRes = await fetch("/api/invitation/validate", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ code: codeToUse }),
						});
						const validateData = await validateRes.json();
						if (!validateData.success) {
							toast.error(validateData.error || "邀请码无效");
						}
					} catch {
						// 静默处理网络异常
					}
				}
				await new Promise((resolve) => setTimeout(resolve, 300));
				router.push(redirectUrl);
			} else {
				setRegisterError(result.error || t.registerFailed);
				setIsEmailSubmitting(false);
			}
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : t.registerFailed;
			setRegisterError(message);
			setIsEmailSubmitting(false);
		}
	};

	const handleVerifyCode = useCallback(async () => {
		if (!verificationCode || verificationCode.length !== 6) {
			setRegisterError(t.enter6Digits);
			return;
		}

		setIsEmailSubmitting(true);
		setRegisterError("");

		try {
			const res = await fetch("/api/auth/verify-code", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: formData.email, code: verificationCode }),
			});
			const data = await res.json();

			if (data.success) {
				setCodeVerified(true);
				setRegisterError("");
			} else {
				setRegisterError(data.error || t.codeError);
				setCodeVerified(false);
			}
		} catch {
			setRegisterError(t.networkError);
		} finally {
			setIsEmailSubmitting(false);
		}
	}, [formData.email, verificationCode, t]);

	const prevCodeLength = useRef(verificationCode.length);
	useEffect(() => {
		if (
			verificationCode.length === 6 &&
			prevCodeLength.current === 5 &&
			codeSent &&
			!codeVerified
		) {
			handleVerifyCode();
		}
		prevCodeLength.current = verificationCode.length;
	}, [verificationCode, codeSent, codeVerified, handleVerifyCode]);

	const handleGoogleLogin = async () => {
		try {
			setIsGoogleSubmitting(true);
			setRegisterError("");
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
			setRegisterError(message);
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
				{(registerError || error) && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={prefersReducedMotion ? { duration: 0 } : undefined}
						className="rounded-lg border border-red-200 bg-red-50 px-3 py-2"
					>
						<p className="text-xs text-red-600">{registerError || error}</p>
					</motion.div>
				)}

				{/* 用户名 */}
				<div>
					<Label htmlFor={`${id}-fullName`} className={labelClass}>
						{t.username}
					</Label>
					<div className="relative">
						<User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
						<Input
							id={`${id}-fullName`}
							type="text"
							placeholder={t.usernamePlaceholder}
							value={formData.fullName}
							onChange={(e) => handleInputChange("fullName", e.target.value)}
							className={`${inputBaseClass} ${errors.fullName ? inputErrorClass : ""}`}
							disabled={isEmailSubmitting || isGoogleSubmitting}
							autoComplete="name"
						/>
					</div>
					{errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
				</div>

				{/* 邮箱 */}
				<div className="space-y-1.5">
					<Label htmlFor={`${id}-email`} className={labelClass}>
						{t.email}
					</Label>
					<div className="relative">
						<Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
						<Input
							id={`${id}-email`}
							type="email"
							placeholder={t.emailPlaceholder}
							value={formData.email}
							onChange={(e) => {
								handleInputChange("email", e.target.value);
								setCodeSent(false);
								setCodeVerified(false);
								setVerificationCode("");
							}}
							className={`${inputBaseClass} ${errors.email ? inputErrorClass : ""}`}
							disabled={isEmailSubmitting || isGoogleSubmitting || codeSending}
							autoComplete="email"
							spellCheck={false}
						/>
					</div>
					{errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
					{emailTypoSuggestion && !errors.email && (
						<p className="text-xs text-amber-600">
							{t.typoPrefix}{" "}
							<button
								type="button"
								className="underline font-medium hover:text-amber-500"
								onClick={() => {
									setFormData((prev) => ({ ...prev, email: emailTypoSuggestion }));
									setEmailTypoSuggestion(null);
								}}
							>
								{emailTypoSuggestion}
							</button>
							{t.typoSuffix}
						</p>
					)}
					<div className="flex gap-2 items-center">
						<Button
							type="button"
							onClick={handleSendCode}
							disabled={codeSending || countdown > 0 || !formData.email}
							className="h-10 px-4 bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 hover:border-amber-300 rounded-lg transition-colors transition-shadow duration-200 disabled:opacity-40 shrink-0 text-xs font-medium"
						>
							{codeSending ? (
								<Loader2 className="w-3.5 h-3.5 animate-spin" />
							) : countdown > 0 ? (
								<span className="tabular-nums font-medium">{countdown}s</span>
							) : (
								<span className="flex items-center gap-1.5 font-medium">
									<Send className="w-3.5 h-3.5" />
									{t.sendCode}
								</span>
							)}
						</Button>
					</div>
					{TURNSTILE_SITE_KEY && (
						<Turnstile ref={turnstileRef} siteKey={TURNSTILE_SITE_KEY} theme="light" />
					)}
				</div>

				{/* 验证码 - 条件渲染不占位 */}
				{codeSent && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.25 }}
						className="space-y-2"
					>
						<Label htmlFor={`${id}-verificationCode`} className={labelClass}>
							{t.verificationCode}
						</Label>
						<div className="flex gap-2 items-center">
							<Input
								id={`${id}-verificationCode`}
								type="text"
								inputMode="numeric"
								maxLength={6}
								placeholder={t.codePlaceholder}
								value={verificationCode}
								onChange={(e) => {
									const val = e.target.value.replace(/\D/g, "").slice(0, 6);
									setVerificationCode(val);
									setCodeVerified(false);
									if (registerError) setRegisterError("");
								}}
								className={`flex-1 h-10 bg-gray-50 border border-gray-200 rounded-lg px-4 text-center tracking-[0.4em] font-mono text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-300 transition-colors transition-shadow duration-200 ${
									codeVerified ? "border-emerald-200 bg-emerald-50" : ""
								}`}
								disabled={isEmailSubmitting || codeVerified}
								autoComplete="one-time-code"
								spellCheck={false}
							/>
							{!codeVerified && (
								<Button
									type="button"
									onClick={handleVerifyCode}
									disabled={isEmailSubmitting || verificationCode.length !== 6}
									className="h-10 px-5 bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 hover:border-amber-300 rounded-lg transition-colors transition-shadow duration-200 disabled:opacity-40 shrink-0 text-xs font-medium"
								>
									{isEmailSubmitting ? (
										<Loader2 className="w-4 h-4 animate-spin" />
									) : (
										<span className="font-medium">{t.verify}</span>
									)}
								</Button>
							)}
						</div>
						{codeVerified && (
							<p className="flex items-center gap-2 text-sm text-emerald-600">
								<CheckCircle className="w-4 h-4" />
								{t.codeVerified}
							</p>
						)}
					</motion.div>
				)}

				{/* 密码 */}
				<div className="space-y-2">
					<Label htmlFor={`${id}-password`} className={labelClass}>
						{t.password}
					</Label>
					<div className="relative">
						<Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
						<Input
							id={`${id}-password`}
							type={showPassword ? "text" : "password"}
							placeholder={t.passwordPlaceholder}
							value={formData.password}
							onChange={(e) => handleInputChange("password", e.target.value)}
							className={`${inputBaseClass} pr-10 ${errors.password ? inputErrorClass : ""}`}
							disabled={isEmailSubmitting || isGoogleSubmitting}
							autoComplete="new-password"
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
							disabled={isEmailSubmitting || isGoogleSubmitting}
						>
							{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
						</button>
					</div>

					{formData.password && (
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
									<motion.div
										className={`h-full ${passwordStrength.color}`}
										initial={{ width: 0 }}
										animate={{
											width: `${
												getPasswordStrength(formData.password).level === "weak"
													? 33
													: getPasswordStrength(formData.password).level === "medium"
														? 66
														: 100
											}%`,
										}}
										transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
									/>
								</div>
								<span className="text-xs text-gray-500 w-5">{passwordStrength.text}</span>
							</div>
							<div className="flex gap-2 text-xs text-gray-500">
								<span
									className={`flex items-center gap-1 ${formData.password.length >= 6 ? "text-emerald-600" : ""}`}
								>
									{formData.password.length >= 6 ? (
										<CheckCircle className="w-3 h-3" />
									) : (
										<div className="w-3 h-3 rounded-full border border-gray-300" />
									)}
									{t.atLeast6}
								</span>
								<span
									className={`flex items-center gap-1 ${/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password) ? "text-emerald-600" : ""}`}
								>
									{/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password) ? (
										<CheckCircle className="w-3 h-3" />
									) : (
										<div className="w-3 h-3 rounded-full border border-gray-300" />
									)}
									{t.upperLower}
								</span>
								<span
									className={`flex items-center gap-1 ${/\d/.test(formData.password) ? "text-emerald-600" : ""}`}
								>
									{/\d/.test(formData.password) ? (
										<CheckCircle className="w-3 h-3" />
									) : (
										<div className="w-3 h-3 rounded-full border border-gray-300" />
									)}
									{t.hasNumber}
								</span>
							</div>
						</div>
					)}

					{errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
				</div>

				{/* 服务条款 */}
				<div className="flex items-start gap-2">
					<Checkbox
						id={`${id}-acceptTerms`}
						checked={formData.acceptTerms}
						onCheckedChange={(checked) => handleInputChange("acceptTerms", checked as boolean)}
						disabled={isEmailSubmitting || isGoogleSubmitting}
						className="mt-0.5 border-gray-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
					/>
					<Label
						htmlFor={`${id}-acceptTerms`}
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
				{errors.acceptTerms && <p className="mt-0.5 text-xs text-red-600">{errors.acceptTerms}</p>}

				{/* 邀请码 */}
				<div>
					<Label htmlFor={`${id}-invitationCode`} className={labelClass}>
						{t.invitationCode}
					</Label>
					<div className="relative">
						<Gift className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
						<Input
							id={`${id}-invitationCode`}
							type="text"
							placeholder={t.invitationCodePlaceholder}
							value={formData.invitationCode || ""}
							onChange={(e) => handleInputChange("invitationCode", e.target.value.toUpperCase())}
							className={inputBaseClass}
							disabled={isEmailSubmitting || isGoogleSubmitting}
							autoComplete="off"
							maxLength={16}
						/>
					</div>
				</div>

				{/* 注册按钮 */}
				<Button
					type="submit"
					className="w-full h-11 text-sm font-medium bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl transition-colors transition-shadow duration-200 hover:shadow-lg hover:shadow-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
					disabled={isEmailSubmitting || !formData.acceptTerms || !codeVerified}
				>
					{isEmailSubmitting ? (
						<div className="flex items-center justify-center gap-2">
							<Loader2 className="w-4 h-4 animate-spin" />
							{t.creating}
						</div>
					) : !codeSent ? (
						t.sendCodeFirst
					) : !codeVerified ? (
						t.verifyFirst
					) : (
						t.createAccount
					)}
				</Button>
			</form>

			{/* Google 登录 */}
			<div className="mt-5 space-y-3">
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
					className="w-full h-11 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 rounded-xl transition-colors transition-shadow duration-200"
					variant="outline"
					disabled={isGoogleSubmitting || !acceptGoogleTerms}
				>
					{isGoogleSubmitting ? (
						<div className="flex items-center justify-center gap-2">
							<Loader2 className="w-4 h-4 animate-spin" />
							<span className="animate-pulse text-sm">{t.googleRedirect}</span>
						</div>
					) : (
						<div className="flex items-center justify-center gap-2">
							<svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24">
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
							<span className="text-sm">{t.googleRegister}</span>
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

			{/* 登录链接 */}
			{showSignIn && (
				<div className="text-center">
					<p className="text-xs text-gray-500">
						{t.haveAccount}
						<Link
							href={`/${locale}/auth/login`}
							className="ml-1 text-amber-600 hover:text-amber-500 font-medium transition-colors"
						>
							{t.login}
						</Link>
					</p>
				</div>
			)}
		</motion.div>
	);
}
