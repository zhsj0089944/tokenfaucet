"use client";

import { Check, Crown, Sparkles, Star, Zap } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/auth";
import { cn } from "@/lib/utils";
import { trpc } from "@/server/client";
import { CreemCheckoutButton } from "./CreemCheckoutButton";

interface Plan {
	id: string;
	name: string;
	nameZh?: string;
	displayNameEn?: string | null;
	description?: string;
	descriptionZh?: string;
	priceUSDMonthly?: string;
	priceUSDYearly?: string;
	features?: string[];
	featuresZh?: string[];
	monthlyPoints?: number;
	dailyBonus?: number;
	hasUnlimitedPoints?: boolean;
	isPopular?: boolean;
	isFree?: boolean;
	sortOrder?: number;
	creemMonthlyProductId?: string | null;
	creemYearlyProductId?: string | null;
}

interface PricingSectionProps {
	className?: string;
	showTitle?: boolean;
	showDescription?: boolean;
}

export { PricingSection as PricingPlans };

const BASE_DAILY_POINTS = 1680;

function PricingSection({ className = "", showTitle = true }: PricingSectionProps) {
	const locale = useLocale();
	const { user, isAuthenticated } = useAuth();
	const [isYearly, setIsYearly] = useState(false);

	const { data: plans, isLoading: plansLoading } = trpc.payments.getMembershipPlans.useQuery(
		{ isActive: true },
		{ staleTime: 5 * 60 * 1000 },
	);

	const { data: membershipStatus } = trpc.payments.getUserMembershipStatus.useQuery(undefined, {
		enabled: isAuthenticated,
		staleTime: 0,
	});

	const { data: paymentConfig } = trpc.payments.getPaymentConfig.useQuery(undefined, {
		staleTime: 10 * 60 * 1000,
	});

	const hasActiveMembership = membershipStatus?.hasActiveMembership || false;
	const currentPlan = membershipStatus?.currentPlan || null;
	const currentMembership = membershipStatus?.membership || null;
	const remainingDays = membershipStatus?.remainingDays || 0;
	const isExpired = membershipStatus?.isExpired || false;
	const showCreem = paymentConfig?.creem === true;

	const getPlanPrice = (plan: Plan) => {
		if (isFreePlan(plan)) {
			return locale === "zh" ? "免费" : "Free";
		}
		const price = isYearly ? plan.priceUSDYearly || plan.priceUSDMonthly : plan.priceUSDMonthly;
		if (!price || Number(price) === 0) {
			return locale === "zh" ? "免费" : "Free";
		}
		return `$${Number(price).toFixed(2)}`;
	};

	const getDurationText = () => {
		if (isYearly) {
			return locale === "zh" ? "年" : "year";
		}
		return locale === "zh" ? "月" : "month";
	};

	const getYearlySavings = (plan: Plan) => {
		if (!(plan.priceUSDYearly && plan.priceUSDMonthly)) return null;
		const monthlyTotal = Number(plan.priceUSDMonthly) * 12;
		const yearlyPrice = Number(plan.priceUSDYearly);
		const savings = monthlyTotal - yearlyPrice;
		const savingsPercent = Math.round((savings / monthlyTotal) * 100);
		return { amount: savings, percent: savingsPercent };
	};

	const getPlanIcon = (planName: string) => {
		switch (planName.toLowerCase()) {
			case "free":
				return <Star className="h-5 w-5" />;
			case "professional":
			case "pro":
				return <Zap className="h-5 w-5" />;
			case "enterprise":
				return <Crown className="h-5 w-5" />;
			default:
				return <Sparkles className="h-5 w-5" />;
		}
	};

	const isCurrentPlan = (plan: Plan) => {
		return hasActiveMembership && currentPlan?.id === plan.id;
	};

	const isFreePlan = (plan: Plan) => {
		return (
			plan.isFree === true ||
			plan.name.toLowerCase() === "free" ||
			(Number(plan.priceUSDMonthly) === 0 && Number(plan.priceUSDYearly) === 0)
		);
	};

	const getValidPlans = (): Plan[] => {
		if (!plans) return [];
		const typedPlans = plans as unknown as Plan[];
		if (isYearly) {
			return typedPlans.filter(
				(plan) => isFreePlan(plan) || (plan.priceUSDYearly && Number(plan.priceUSDYearly) > 0),
			);
		}
		return typedPlans;
	};

	return (
		<section className={cn("relative", className)}>
			{/* Gradient mesh backdrop */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div
					className="absolute top-0 left-0 right-0 h-[480px] opacity-40"
					style={{
						background:
							"linear-gradient(135deg, #f5e9d4 0%, #f96bee22 25%, #533afd18 50%, #ea226115 75%, #f5e9d4 100%)",
						filter: "blur(60px)",
					}}
				/>
			</div>

			<div className="relative z-10 max-w-6xl mx-auto px-4 pt-8 sm:pt-12 pb-12 sm:pb-16">
				{/* Header */}
				{showTitle && (
					<div className="text-center mb-12">
						<p className="text-xs font-medium tracking-[0.1em] uppercase text-[#533afd] mb-4">
							{locale === "zh" ? "订阅计划" : "Subscription Plans"}
						</p>
						<h1
							className="text-3xl sm:text-4xl md:text-5xl font-light text-[#0d253d] dark:text-white mb-4"
							style={{ letterSpacing: "-0.64px", lineHeight: 1.1 }}
						>
							{locale === "zh" ? "选择适合您的计划" : "Choose Your Plan"}
						</h1>
						<p className="text-base text-[#64748d] dark:text-gray-400 max-w-xl mx-auto font-light">
							{locale === "zh"
								? "从免费版本开始，随时升级以解锁更多功能"
								: "Start with our free version and upgrade anytime to unlock more features"}
						</p>
					</div>
				)}

				{/* Billing toggle */}
				<div className="flex items-center justify-center mb-8">
					<div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-white/60 shadow-[0_4px_20px_-5px_rgba(0,55,112,0.08)]">
						<span
							className={cn(
								"text-sm font-light transition-colors",
								!isYearly ? "text-[#0d253d] dark:text-white" : "text-[#64748d]",
							)}
						>
							{locale === "zh" ? "月付" : "Monthly"}
						</span>
						<button
							type="button"
							role="switch"
							aria-checked={isYearly}
							onClick={() => setIsYearly(!isYearly)}
							className={cn(
								"relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300",
								isYearly
									? "bg-[#533afd] shadow-[0_2px_10px_rgba(83,58,253,0.4)]"
									: "bg-[#e3e8ee] dark:bg-gray-600",
							)}
						>
							<span
								className={cn(
									"inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300",
									isYearly
										? "translate-x-5 shadow-[0_2px_8px_rgba(83,58,253,0.3)]"
										: "translate-x-0 shadow-sm",
								)}
							/>
						</button>
						<span
							className={cn(
								"text-sm font-light transition-colors",
								isYearly ? "text-[#0d253d] dark:text-white" : "text-[#64748d]",
							)}
						>
							{locale === "zh" ? "年付" : "Yearly"}
						</span>
						{isYearly && (
							<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#b9b9f9] text-[#4434d4]">
								<Sparkles className="w-3 h-3 mr-1" />
								{locale === "zh" ? "节省高达20%" : "Save up to 20%"}
							</span>
						)}
					</div>
				</div>

				{/* Pricing cards */}
				{plansLoading ? (
					<PricingLoadingSkeleton />
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{getValidPlans().map((plan, _index) => {
							const savings = isYearly ? getYearlySavings(plan) : null;
							const isFeatured = plan.isPopular;
							const isCurrent = isCurrentPlan(plan);

							return (
								<div
									key={plan.id}
									className={cn(
										"relative rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]",
										isFeatured
											? "bg-[#1c1e54] text-white shadow-[0_20px_60px_-15px_rgba(83,58,253,0.3),0_8px_24px_rgba(0,55,112,0.12)] hover:shadow-[0_25px_70px_-15px_rgba(83,58,253,0.4),0_12px_30px_rgba(0,55,112,0.15)]"
											: "bg-white/90 dark:bg-gray-800 backdrop-blur-sm border border-white/60 dark:border-gray-700 shadow-[0_10px_40px_-15px_rgba(0,55,112,0.08),0_4px_16px_rgba(0,55,112,0.04)] hover:shadow-[0_20px_50px_-15px_rgba(83,58,253,0.15),0_8px_24px_rgba(0,55,112,0.08)]",
										isCurrent && !isFeatured && "border-[#533afd] border-2",
									)}
								>
									{/* Badges */}
									{isFeatured && !isCurrent && (
										<div className="absolute -top-3 right-6">
											<span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-medium bg-[#533afd] text-white">
												<Star className="w-3 h-3 mr-1" />
												{locale === "zh" ? "推荐" : "Popular"}
											</span>
										</div>
									)}
									{isCurrent && (
										<div className="absolute -top-3 left-1/2 -translate-x-1/2">
											<span className="inline-flex items-center px-4 py-1 rounded-full text-[10px] font-medium bg-[#533afd] text-white">
												<Check className="w-3 h-3 mr-1" />
												{locale === "zh" ? "当前计划" : "Current Plan"}
											</span>
										</div>
									)}
									{isYearly && savings && savings.percent > 0 && !isCurrent && (
										<div className="absolute -top-3 left-6">
											<span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#f5e9d4] text-[#9b6829]">
												{locale === "zh" ? `节省${savings.percent}%` : `Save ${savings.percent}%`}
											</span>
										</div>
									)}

									{/* Plan header */}
									<div className="flex items-center gap-3 mb-4 mt-2">
										<div
											className={cn(
												"p-2.5 rounded-lg",
												isFeatured
													? "bg-white/10 text-white"
													: "bg-[#f6f9fc] dark:bg-gray-700 text-[#533afd]",
											)}
										>
											{getPlanIcon(plan.name)}
										</div>
										<div>
											<h3
												className="text-lg font-light text-[#0d253d] dark:text-white"
												style={{ letterSpacing: "-0.22px" }}
											>
												{locale === "zh"
													? plan.nameZh || plan.name
													: plan.displayNameEn || plan.name}
											</h3>
											<p
												className={cn(
													"text-xs font-light",
													isFeatured ? "text-white/60" : "text-[#64748d]",
												)}
											>
												{locale === "zh" ? plan.descriptionZh : plan.description}
											</p>
										</div>
									</div>

									{/* Price */}
									<div className="mb-5">
										<div className="flex items-baseline gap-1.5">
											<span
												className={cn(
													"text-3xl font-light tabular-nums",
													isFeatured ? "text-white" : "text-[#0d253d] dark:text-white",
												)}
												style={{ letterSpacing: "-0.64px", fontFeatureSettings: "'tnum'" }}
											>
												{getPlanPrice(plan)}
											</span>
											<span
												className={cn(
													"text-sm font-light",
													isFeatured ? "text-white/50" : "text-[#64748d]",
												)}
											>
												/ {getDurationText()}
											</span>
										</div>
										{!isFreePlan(plan) && (
											<p
												className={cn(
													"text-xs font-light mt-1",
													isFeatured ? "text-white/40" : "text-[#64748d]",
												)}
											>
												{isYearly ? "365" : "30"}{" "}
												{locale === "zh" ? "天会员权限" : "days membership"}
											</p>
										)}
										{isYearly && savings && savings.percent > 0 && (
											<p
												className={cn(
													"text-xs font-light mt-1",
													isFeatured ? "text-white/60" : "text-[#533afd]",
												)}
											>
												{locale === "zh" ? "相比月付节省" : "Save"} ${savings.amount.toFixed(2)}
											</p>
										)}
									</div>

									{/* Points section */}
									{plan.monthlyPoints !== undefined && (
										<div
											className={cn(
												"mb-5 p-3 rounded-lg border",
												isFeatured
													? "bg-white/5 border-white/10"
													: "bg-[#f6f9fc] dark:bg-gray-700/50 border-[#e3e8ee] dark:border-gray-600",
											)}
										>
											<div className="flex items-center gap-2 mb-2">
												<Zap
													className={cn("w-4 h-4", isFeatured ? "text-white/70" : "text-[#533afd]")}
												/>
												<span
													className={cn(
														"text-xs font-medium",
														isFeatured ? "text-white/80" : "text-[#0d253d] dark:text-white",
													)}
												>
													{locale === "zh" ? "积分说明" : "Points"}
												</span>
											</div>
											<div className="space-y-1.5 text-xs">
												<div className="flex justify-between items-center">
													<span className={isFeatured ? "text-white/50" : "text-[#64748d]"}>
														{locale === "zh" ? "每日积分" : "Daily Points"}
													</span>
													<span
														className={cn(
															"font-medium tabular-nums",
															isFeatured ? "text-white" : "text-[#0d253d] dark:text-white",
														)}
														style={{ fontFeatureSettings: "'tnum'" }}
													>
														{BASE_DAILY_POINTS.toLocaleString()}
														{(plan.dailyBonus ?? 0) > 0 && (
															<span className={isFeatured ? "text-white/60" : "text-[#533afd]"}>
																{" "}
																+ {(plan.dailyBonus ?? 0).toLocaleString()}
															</span>
														)}
													</span>
												</div>
												<div className="flex justify-between items-center">
													<span className={isFeatured ? "text-white/50" : "text-[#64748d]"}>
														{locale === "zh" ? "每月额外" : "Monthly Bonus"}
													</span>
													<span
														className={cn(
															"font-medium tabular-nums",
															isFeatured ? "text-white" : "text-[#0d253d] dark:text-white",
														)}
														style={{ fontFeatureSettings: "'tnum'" }}
													>
														{plan.hasUnlimitedPoints
															? locale === "zh"
																? "无限"
																: "Unlimited"
															: `${(plan.monthlyPoints ?? 0).toLocaleString()}`}
													</span>
												</div>
												<p className={isFeatured ? "text-white/30" : "text-[#64748d]"}>
													{locale === "zh"
														? "日积分用完才扣月积分，每天重置"
														: "Daily points used first, monthly bonus auto-refills monthly"}
												</p>
											</div>
										</div>
									)}

									{/* Features */}
									<ul className="space-y-2.5 mb-6">
										{((locale === "zh" ? plan.featuresZh : plan.features) || []).map(
											(feature: string) => (
												<li key={`${plan.id}-${feature}`} className="flex items-start gap-2.5">
													<Check
														className={cn(
															"w-4 h-4 mt-0.5 flex-shrink-0",
															isFeatured ? "text-white/50" : "text-[#533afd]",
														)}
													/>
													<span
														className={cn(
															"text-sm font-light",
															isFeatured ? "text-white/80" : "text-[#273951] dark:text-gray-300",
														)}
													>
														{feature}
													</span>
												</li>
											),
										)}
									</ul>

									{/* CTA */}
									{isFreePlan(plan) ? (
										<button
											type="button"
											disabled
											className="w-full h-11 rounded-full text-sm font-medium bg-[#f6f9fc] dark:bg-gray-700 text-[#64748d] cursor-default"
										>
											{locale === "zh" ? "免费使用" : "Free to use"}
										</button>
									) : isCurrent && !isExpired ? (
										<button
											type="button"
											disabled
											className="w-full h-11 rounded-full text-sm font-medium bg-[#533afd]/10 text-[#533afd] cursor-default"
										>
											{locale === "zh"
												? `当前计划 (还有${remainingDays}天)`
												: `Current plan (${remainingDays} days left)`}
										</button>
									) : showCreem && plan.creemMonthlyProductId ? (
										(() => {
											const productId = isYearly
												? (plan.creemYearlyProductId ?? plan.creemMonthlyProductId)
												: plan.creemMonthlyProductId;
											const price = getPlanPrice(plan);
											const duration = isYearly
												? locale === "zh"
													? "年"
													: "/yr"
												: locale === "zh"
													? "月"
													: "/mo";
											const planName =
												locale === "zh"
													? plan.nameZh || plan.name
													: plan.displayNameEn || plan.name;
											const isUpgrade =
												hasActiveMembership &&
												currentPlan &&
												(currentPlan.sortOrder ?? 0) < (plan.sortOrder ?? 0);

											// 场景1: 有活跃订阅且是升级 → 用 upgrade API 按比例计费
											if (
												isUpgrade &&
												hasActiveMembership &&
												currentMembership?.creemSubscriptionId
											) {
												return (
													<CreemCheckoutButton
														upgradeToPlanId={plan.id}
														durationType={isYearly ? "yearly" : "monthly"}
														locale={locale}
													>
														{locale === "zh"
															? `升级至 ${planName} · ${price}/${duration}`
															: `Upgrade to ${planName} · ${price}/${duration}`}
													</CreemCheckoutButton>
												);
											}

											// 场景2: 过期续费 / 无订阅 / 有订阅但无creemSubscriptionId → 新 checkout
											return (
												<CreemCheckoutButton
													productId={productId}
													durationType={isYearly ? "yearly" : "monthly"}
													locale={locale}
													referenceId={user?.id}
													customerEmail={user?.email || undefined}
													metadata={{
														planId: plan.id,
														durationType: isYearly ? "yearly" : "monthly",
													}}
												>
													{isCurrent && isExpired
														? locale === "zh"
															? `续费 · ${price}/${duration}`
															: `Renew · ${price}/${duration}`
														: locale === "zh"
															? `订阅 · ${price}/${duration}`
															: `Subscribe · ${price}/${duration}`}
												</CreemCheckoutButton>
											);
										})()
									) : (
										<button
											type="button"
											disabled
											className="w-full h-11 rounded-full text-sm font-medium bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
										>
											{locale === "zh" ? "暂不可用" : "Not available"}
										</button>
									)}

									{/* Footer note */}
									{!isFreePlan(plan) && (
										<p
											className={cn(
												"text-center text-xs font-light mt-3",
												isFeatured ? "text-white/30" : "text-[#64748d]",
											)}
										>
											{locale === "zh" ? "安全支付，支持 Creem" : "Secure payment with Creem"}
										</p>
									)}
								</div>
							);
						})}
					</div>
				)}

				{/* Trust badges */}
				<div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs text-[#64748d] font-light">
					<div className="flex items-center gap-1.5">
						<Check className="w-3.5 h-3.5 text-[#533afd]" />
						{locale === "zh" ? "安全支付" : "Secure Payment"}
					</div>
					<div className="flex items-center gap-1.5">
						<Check className="w-3.5 h-3.5 text-[#533afd]" />
						{locale === "zh" ? "随时取消" : "Cancel Anytime"}
					</div>
					<div className="flex items-center gap-1.5">
						<Check className="w-3.5 h-3.5 text-[#533afd]" />
						{locale === "zh" ? "即时访问" : "Instant Access"}
					</div>
				</div>
			</div>
		</section>
	);
}

function PricingLoadingSkeleton() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{[1, 2, 3].map((i) => (
				<div
					key={i}
					className="bg-white dark:bg-gray-800 rounded-xl border border-[#e3e8ee] dark:border-gray-700 p-6 sm:p-8"
				>
					<div className="flex items-center gap-3 mb-4">
						<Skeleton className="h-10 w-10 rounded-lg" />
						<div>
							<Skeleton className="h-5 w-24 mb-1.5" />
							<Skeleton className="h-3 w-36" />
						</div>
					</div>
					<Skeleton className="h-8 w-20 mb-5" />
					<div className="space-y-2.5 mb-6">
						{[1, 2, 3, 4, 5].map((j) => (
							<Skeleton key={j} className="h-4 w-full" />
						))}
					</div>
					<Skeleton className="h-10 w-full rounded-full" />
				</div>
			))}
		</div>
	);
}
