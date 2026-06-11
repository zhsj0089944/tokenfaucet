"use client";

import {
	Crown,
	Gift,
	Laptop,
	LogOut,
	Menu,
	Moon,
	Settings,
	Shield,
	Sparkles,
	Star,
	Sun,
	User,
	X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SignInButton } from "@/components/auth/SignInButton";
import { Logo } from "@/components/common/logo";
import { InvitationModal } from "@/components/invitation/InvitationModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/auth";
import { useUserMembership } from "@/hooks/use-membership";
import { usePointsBalance } from "@/hooks/use-points";
import { AdminLevel } from "@/lib/auth/better-auth/roles";
import { logger } from "@/lib/logger";
import { cn, localizePath } from "@/lib/utils";
import { locales } from "@/translate/i18n/config";

export default function Navigation() {
	const { isAuthenticated, user, signOut } = useAuth();
	const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);

	// 使用tRPC查询会员状态，带性能优化
	// 只在用户已认证且初始化完成时查询
	const { hasActiveMembership, currentPlan } = useUserMembership(
		isAuthenticated && user?.id ? user.id : undefined,
	);
	const { theme, setTheme } = useTheme();
	const pathname = usePathname();
	const locale = useLocale();
	const router = useRouter();
	const t = useTranslations("navigation");
	const localeT = useTranslations("locale");
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isMounted, setIsMounted] = useState(false);

	// 用户积分余额
	const { points: userPoints } = usePointsBalance();

	// 确保组件在客户端挂载后才显示用户相关内容
	useEffect(() => {
		setIsMounted(true);
	}, []);

	// 检查用户是否是管理员
	const adminLevel = user?.adminLevel ?? AdminLevel.USER;
	const isUserAdmin = user?.isAdmin === true || adminLevel >= AdminLevel.ADMIN;

	const handleSignOut = async () => {
		try {
			await signOut();
			logger.info("User signed out successfully", {
				category: "auth",
				userId: user?.id,
				action: "sign_out",
			});
		} catch (error) {
			const errorObj = error instanceof Error ? error : new Error(String(error));
			logger.error("Sign out failed", errorObj, {
				category: "auth",
				userId: user?.id,
				action: "sign_out",
			});
			// 即使退出失败，也强制重定向
			router.push(`/${locale}`);
		}
	};

	// 更新语言切换逻辑，使用路由跳转
	const handleLanguageChange = (newLocale: "zh" | "en") => {
		const segments = pathname.split("/").filter(Boolean);
		if (segments.length > 0 && locales.includes(segments[0] as string)) {
			segments.shift();
		}
		const basePath = segments.length ? `/${segments.join("/")}` : "/";
		router.push(localizePath(newLocale, basePath));
	};

	const getUserInitials = (user: { fullName?: string | null; email?: string | null }) => {
		if (user?.fullName) {
			const names = user.fullName.split(" ");
			if (names.length >= 2) {
				return `${names[0]?.[0]}${names[1]?.[0]}`.toUpperCase();
			}
			return user.fullName[0]?.toUpperCase();
		}
		if (user?.email) {
			return user.email[0]?.toUpperCase();
		}
		return "U";
	};

	const getUserDisplayName = (user: { fullName?: string | null; email?: string | null }) => {
		return user?.fullName || user?.email || "User";
	};

	// 导航项类型定义
	interface NavItem {
		href: string;
		label: string;
		active: boolean;
		icon?: React.ReactNode;
		premium?: boolean;
	}

	// 更新导航项使用语言路由
	const navItems: NavItem[] = [
		{
			href: localizePath(locale, "/"),
			label: t("home"),
			active: pathname === localizePath(locale, "/") || pathname === `/${locale}`,
		},
		{
			href: localizePath(locale, "/pricing"),
			label: t("pricing"),
			active: pathname.startsWith(localizePath(locale, "/pricing")),
		},
		{
			href: localizePath(locale, "/ai/tts"),
			label: t("tts"),
			active: pathname.startsWith(localizePath(locale, "/ai/tts")),
		},
		{
			href: localizePath(locale, "/guide"),
			label: t("guide"),
			active:
				pathname.startsWith(localizePath(locale, "/guide")) ||
				pathname.startsWith(localizePath(locale, "/privacy")) ||
				pathname.startsWith(localizePath(locale, "/terms")),
		},
	];

	return (
		<nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60 transition-colors duration-300">
			<div className="relative z-10 max-w-none mx-auto px-6 sm:px-8 lg:px-12">
				<div className="flex justify-between h-16">
					<div className="flex items-center">
						<div className="flex-shrink-0 flex items-center group">
							<Logo />
						</div>
					</div>

					{/* 桌面端导航菜单 */}
					<div className="hidden md:flex items-center space-x-1">
						{navItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									"relative px-4 py-2 text-sm font-medium rounded-lg transition-transform transition-shadow duration-300 group transform hover:scale-105 flex items-center gap-2",
									item.active
										? "text-blue-600 dark:text-white bg-gradient-to-r from-blue-500/30 to-purple-500/30 dark:from-blue-500/20 dark:to-purple-500/20 backdrop-blur-sm border border-blue-400/50 dark:border-blue-400/30 shadow-[0_0_20px_rgba(59,130,246,0.4)] dark:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
										: item.premium
											? "text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-500 hover:to-purple-500 hover:bg-gray-100/80 dark:hover:bg-white/10 hover:backdrop-blur-sm hover:border hover:border-gradient-to-r hover:from-blue-400/50 hover:to-purple-400/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
											: "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/10 hover:backdrop-blur-sm hover:border hover:border-gray-300/50 dark:hover:border-white/20 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] dark:hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]",
								)}
								style={{
									transformStyle: "preserve-3d",
								}}
							>
								{item.icon && <span className="relative z-10">{item.icon}</span>}
								<span className="relative z-10">{item.label}</span>
								{item.premium && !item.active && (
									<div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
								)}
								{item.active && (
									<div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
								)}
								{/* 3D悬浮效果背景 */}
								<div
									className={cn(
										"absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10",
										item.premium
											? "bg-gradient-to-r from-blue-500/10 to-purple-500/10"
											: "bg-gradient-to-r from-blue-500/5 to-purple-500/5",
									)}
								/>
							</Link>
						))}
					</div>

					{/* 右侧操作区域 */}
					<div className="flex items-center space-x-2">
						{/* 积分显示 - 仅登录用户可见 */}
						{isMounted && user && userPoints && (
							<button
								type="button"
								className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-primary/10 dark:bg-primary/20 rounded-full border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors group relative"
								onClick={() => router.push(localizePath(locale, "/dashboard"))}
							>
								<Sparkles className="h-3.5 w-3.5 text-primary" />
								<span className="text-sm font-medium text-primary tabular-nums">
									{userPoints.totalBalance.toLocaleString()}
								</span>
								<span className="text-xs text-muted-foreground">{t("points")}</span>

								{/* Hover tooltip */}
								<div className="absolute top-full right-0 mt-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity text-xs whitespace-nowrap z-50 pointer-events-none">
									<div className="space-y-1 tabular-nums">
										<div className="flex justify-between gap-4">
											<span className="text-muted-foreground">{t("dailyPoints")}</span>
											<span className="font-medium">
												{userPoints.dailyBalance.toLocaleString()}
											</span>
										</div>
										<div className="flex justify-between gap-4">
											<span className="text-muted-foreground">{t("monthlyPoints")}</span>
											<span className="font-medium">
												{userPoints.monthlyBalance.toLocaleString()}
											</span>
										</div>
										<div className="border-t border-border pt-1 mt-1 flex justify-between gap-4">
											<span className="text-muted-foreground">{t("totalPoints")}</span>
											<span className="font-bold text-primary">
												{userPoints.totalBalance.toLocaleString()}
											</span>
										</div>
									</div>
									<div className="text-center text-muted-foreground mt-1 text-[10px]">
										{t("clickToViewDetails")} →
									</div>
								</div>
							</button>
						)}

						{/* 桌面端语言切换器 */}
						<div className="hidden md:block">
							<Button
								variant="outline"
								size="sm"
								onClick={() => handleLanguageChange(locale === "zh" ? "en" : "zh")}
							>
								{locale === "zh" ? "EN" : "中文"}
							</Button>
						</div>

						{/* 桌面端主题切换器 */}
						<div className="hidden md:block">
							<Button
								variant="outline"
								size="icon"
								aria-label={t("switchTheme")}
								onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
							>
								{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
							</Button>
						</div>

						{/* 移动端菜单按钮 */}
						<Button
							variant="ghost"
							size="icon"
							className="md:hidden touch-btn"
							aria-label={isMenuOpen ? t("closeMenu") : t("openMenu")}
							onClick={() => setIsMenuOpen(!isMenuOpen)}
						>
							{isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
						</Button>

						{/* 邀请好友按钮 - 所有用户可见 */}
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsInvitationModalOpen(true)}
							className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full shadow-md hover:shadow-lg transition-colors transition-shadow duration-300"
						>
							<Gift className="h-4 w-4" />
							<span className="font-medium text-sm">{t("inviteFriend")}</span>
							<span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">+2500</span>
						</Button>

						{/* 用户菜单区域 */}
						{user ? (
							// 已登录用户菜单
							<div className="flex items-center gap-2">
								{/* 会员标识 */}
								{hasActiveMembership && currentPlan && (
									<div className="hidden md:flex items-center">
										{currentPlan.name === "Professional" && (
											<div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-medium rounded-full">
												<Star className="h-3 w-3" />
												<span>{localeT("professional")}</span>
											</div>
										)}
										{currentPlan.name === "Enterprise" && (
											<div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-medium rounded-full">
												<Crown className="h-3 w-3" />
												<span>{localeT("enterprise")}</span>
											</div>
										)}
									</div>
								)}
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											className="relative h-10 w-10 rounded-full p-0 transform transition-transform transition-shadow duration-300 hover:scale-110 hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]"
										>
											<div className="relative">
												<Avatar className="h-9 w-9 border-2 border-gradient-to-r from-blue-400 to-purple-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
													<AvatarImage src={user?.image || ""} alt={getUserDisplayName(user)} />
													<AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
														{getUserInitials(user)}
													</AvatarFallback>
												</Avatar>
												{/* 发光环效果 */}
												<div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-sm animate-pulse" />
											</div>
											{/* 会员状态小标识 - 增强版 */}
											{hasActiveMembership && (
												<div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse">
													<Crown className="h-3 w-3 text-white" />
												</div>
											)}
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="w-56" align="end" forceMount>
										<DropdownMenuLabel className="font-normal">
											<div className="flex flex-col space-y-1">
												<p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
											</div>
										</DropdownMenuLabel>
										<DropdownMenuSeparator />
										<DropdownMenuItem asChild>
											<Link href={localizePath(locale, "/dashboard")} className="flex items-center">
												<User className="mr-2 h-4 w-4" />
												<span>{t("dashboard")}</span>
											</Link>
										</DropdownMenuItem>
										{/* 会员用户显示会员中心入口 */}
										{hasActiveMembership && (
											<DropdownMenuItem asChild>
												<Link
													href={localizePath(locale, "/membership")}
													className="flex items-center text-blue-600 dark:text-blue-400"
												>
													<Crown className="mr-2 h-4 w-4" />
													<span>{t("membershipCenter")}</span>
												</Link>
											</DropdownMenuItem>
										)}
										<DropdownMenuItem asChild>
											<Link href={localizePath(locale, "/settings")} className="flex items-center">
												<Settings className="mr-2 h-4 w-4" />
												<span>{t("settings")}</span>
											</Link>
										</DropdownMenuItem>
										{/* 管理员入口 */}
										{isUserAdmin && (
											<>
												<DropdownMenuSeparator />
												<DropdownMenuItem asChild>
													<Link
														href={localizePath(locale, "/admin")}
														className="text-amber-600 dark:text-amber-400"
													>
														<Shield className="mr-2 h-4 w-4" />
														<span>{t("adminPanel")}</span>
													</Link>
												</DropdownMenuItem>
											</>
										)}
										<DropdownMenuSeparator />
										<DropdownMenuItem onClick={handleSignOut}>
											<LogOut className="mr-2 h-4 w-4" />
											<span>{t("signOut")}</span>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						) : (
							// 未登录状态
							<div className="flex items-center space-x-2">
								<SignInButton />
							</div>
						)}
					</div>
				</div>
			</div>

			{/* 移动端菜单 - 全屏毛玻璃覆盖层 */}
			{isMenuOpen && (
				<div className="md:hidden fixed inset-0 z-[100] animate-fade-in">
					{/* 背景遮罩 */}
					<button
						type="button"
						className="absolute inset-0 bg-black/40 backdrop-blur-xl"
						onClick={() => setIsMenuOpen(false)}
						aria-label={t("closeMenu")}
					/>
					{/* 菜单面板 */}
					<div className="relative z-10 h-full flex flex-col justify-between px-5 pt-20 pb-10 overflow-y-auto">
						{/* 导航链接 */}
						<div className="space-y-1.5">
							{navItems.map((item, idx) => (
								<Link
									key={item.href}
									href={item.href}
									className={cn(
										"mobile-menu-item block w-full px-5 py-4 text-lg font-medium rounded-2xl transition-all duration-200 touch-active",
										item.active
											? "text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-purple-500/25"
											: "text-white/80 hover:text-white hover:bg-white/10",
									)}
									style={{ animationDelay: `${idx * 0.06}s` }}
									onClick={() => setIsMenuOpen(false)}
								>
									<div className="flex items-center gap-3">
										{item.icon && <span>{item.icon}</span>}
										<span>{item.label}</span>
										{item.premium && !item.active && (
											<span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white">
												PRO
											</span>
										)}
									</div>
								</Link>
							))}
						</div>

						{/* 底部工具区 */}
						<div className="space-y-5 mt-8">
							{/* 语言切换 */}
							<div className="flex items-center justify-between px-2">
								<span className="text-sm font-medium text-white/60">{localeT("label")}</span>
								<div className="flex gap-2">
									<button
										type="button"
										onClick={() => {
											handleLanguageChange("zh");
											setIsMenuOpen(false);
										}}
										className={cn(
											"px-4 py-2 text-sm font-medium rounded-full transition-all",
											locale === "zh"
												? "bg-white text-gray-900 shadow-lg"
												: "bg-white/10 text-white/70 hover:bg-white/20",
										)}
									>
										中文
									</button>
									<button
										type="button"
										onClick={() => {
											handleLanguageChange("en");
											setIsMenuOpen(false);
										}}
										className={cn(
											"px-4 py-2 text-sm font-medium rounded-full transition-all",
											locale === "en"
												? "bg-white text-gray-900 shadow-lg"
												: "bg-white/10 text-white/70 hover:bg-white/20",
										)}
									>
										EN
									</button>
								</div>
							</div>

							{/* 主题切换 */}
							<div className="flex items-center justify-between px-2">
								<span className="text-sm font-medium text-white/60">{localeT("switchTheme")}</span>
								<div className="flex gap-1.5">
									<button
										type="button"
										onClick={() => setTheme("light")}
										className={cn(
											"p-2.5 rounded-xl transition-all",
											theme === "light"
												? "bg-white text-gray-900 shadow-lg"
												: "bg-white/10 text-white/70 hover:bg-white/20",
										)}
									>
										<Sun className="h-4 w-4" />
									</button>
									<button
										type="button"
										onClick={() => setTheme("dark")}
										className={cn(
											"p-2.5 rounded-xl transition-all",
											theme === "dark"
												? "bg-white text-gray-900 shadow-lg"
												: "bg-white/10 text-white/70 hover:bg-white/20",
										)}
									>
										<Moon className="h-4 w-4" />
									</button>
									<button
										type="button"
										onClick={() => setTheme("system")}
										className={cn(
											"p-2.5 rounded-xl transition-all",
											theme === "system"
												? "bg-white text-gray-900 shadow-lg"
												: "bg-white/10 text-white/70 hover:bg-white/20",
										)}
									>
										<Laptop className="h-4 w-4" />
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* 邀请弹窗 */}
			<InvitationModal
				open={isInvitationModalOpen}
				onOpenChange={setIsInvitationModalOpen}
				isLoggedIn={!!user}
			/>
		</nav>
	);
}
