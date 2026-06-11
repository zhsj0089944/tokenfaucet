"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useCallback, useId, useState } from "react";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const texts = {
	zh: {
		title: "设置新密码",
		subtitle: "请输入您的新密码",
		passwordPlaceholder: "输入新密码",
		confirmPlaceholder: "再次输入新密码",
		submitButton: "确认重置",
		submitting: "处理中...",
		backToLogin: "返回登录",
		passwordTooShort: "密码至少需要6个字符",
		passwordNotMatch: "两次输入的密码不一致",
		resetSuccess: "密码重置成功",
		resetSuccessMsg: "请使用新密码登录您的账户",
		resetFailed: "密码重置失败，链接可能已过期，请重新发起",
		networkError: "网络错误，请检查网络连接",
		invalidToken: "无效的重置链接，请重新发起",
		enterNewPassword: "新密码",
		confirmNewPassword: "确认新密码",
	},
	en: {
		title: "Set New Password",
		subtitle: "Please enter your new password",
		passwordPlaceholder: "Enter new password",
		confirmPlaceholder: "Re-enter new password",
		submitButton: "Confirm Reset",
		submitting: "Processing...",
		backToLogin: "Back to Login",
		passwordTooShort: "Password must be at least 6 characters",
		passwordNotMatch: "Passwords do not match",
		resetSuccess: "Password reset successful",
		resetSuccessMsg: "Please sign in with your new password",
		resetFailed: "Password reset failed. The link may have expired. Please request a new reset.",
		networkError: "Network error, please check your connection",
		invalidToken: "Invalid reset link. Please request a new password reset.",
		enterNewPassword: "New Password",
		confirmNewPassword: "Confirm New Password",
	},
};

export default function ResetPasswordPage() {
	const _router = useRouter();
	const locale = useLocale();
	const t = texts[locale as keyof typeof texts] || texts.zh;
	const passwordId = useId();
	const confirmId = useId();

	const searchParams = new URLSearchParams(window.location.search);
	const token = searchParams.get("token") || "";

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			setError("");

			if (!token) {
				setError(t.invalidToken);
				return;
			}

			if (password.length < 6) {
				setError(t.passwordTooShort);
				return;
			}

			if (password !== confirmPassword) {
				setError(t.passwordNotMatch);
				return;
			}

			setIsSubmitting(true);

			try {
				const res = await fetch("/api/auth/reset-password", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ token, password }),
				});
				const data = await res.json();

				if (data.success) {
					setSuccess(true);
				} else {
					setError(data.error || t.resetFailed);
				}
			} catch {
				setError(t.networkError);
			} finally {
				setIsSubmitting(false);
			}
		},
		[token, password, confirmPassword, t],
	);

	if (success) {
		return (
			<div className="min-h-screen flex flex-col lg:flex-row">
				<div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 xl:px-12 bg-white dark:bg-gray-900 py-6 sm:py-8 lg:py-0 relative">
					<div className="absolute top-3 right-3 z-10">
						<LanguageSwitcher />
					</div>
					<div className="max-w-md sm:max-w-lg w-full space-y-6 text-center">
						<div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
							<Lock className="w-8 h-8 text-green-600 dark:text-green-400" />
						</div>
						<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
							{t.resetSuccess}
						</h1>
						<p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
							{t.resetSuccessMsg}
						</p>
						<Link href={`/${locale}/auth/login`}>
							<Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
								{t.backToLogin}
							</Button>
						</Link>
					</div>
				</div>

				<div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 items-center justify-center p-8 xl:p-12">
					<div className="max-w-md text-center text-white space-y-6">
						<h2 className="text-3xl xl:text-4xl font-bold">TokenFaucet</h2>
						<p className="text-lg text-white/80">
							{locale === "zh" ? "智能语音合成平台" : "AI Text-to-Speech Platform"}
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col lg:flex-row">
			<div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 xl:px-12 bg-white dark:bg-gray-900 py-6 sm:py-8 lg:py-0 relative">
				<div className="absolute top-3 right-3 z-10">
					<LanguageSwitcher />
				</div>
				<div className="max-w-md sm:max-w-lg w-full space-y-3 sm:space-y-4">
					<div className="text-center">
						<div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
							<Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
						</div>
						<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
							{t.title}
						</h1>
						<p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{t.subtitle}</p>
					</div>

					{error && (
						<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
							<p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label
								htmlFor={passwordId}
								className="text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								{t.enterNewPassword}
							</Label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
								<Input
									id={passwordId}
									type={showPassword ? "text" : "password"}
									placeholder={t.passwordPlaceholder}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="pl-10 pr-10 h-11"
									disabled={isSubmitting}
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
								>
									{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
								</button>
							</div>
						</div>

						<div className="space-y-2">
							<Label
								htmlFor={confirmId}
								className="text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								{t.confirmNewPassword}
							</Label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
								<Input
									id={confirmId}
									type={showConfirm ? "text" : "password"}
									placeholder={t.confirmPlaceholder}
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									className="pl-10 pr-10 h-11"
									disabled={isSubmitting}
								/>
								<button
									type="button"
									onClick={() => setShowConfirm(!showConfirm)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
								>
									{showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
								</button>
							</div>
						</div>

						<Button
							type="submit"
							disabled={isSubmitting || !token}
							className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
						>
							{isSubmitting ? t.submitting : t.submitButton}
						</Button>

						<div className="text-center">
							<Link
								href={`/${locale}/auth/login`}
								className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
							>
								{t.backToLogin}
							</Link>
						</div>
					</form>
				</div>
			</div>

			<div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 items-center justify-center p-8 xl:p-12">
				<div className="max-w-md text-center text-white space-y-6">
					<h2 className="text-3xl xl:text-4xl font-bold">TokenFaucet</h2>
					<p className="text-lg text-white/80">
						{locale === "zh" ? "智能语音合成平台" : "AI Text-to-Speech Platform"}
					</p>
				</div>
			</div>
		</div>
	);
}
