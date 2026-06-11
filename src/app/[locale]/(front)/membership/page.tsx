"use client";

import {
	ArrowRight,
	Briefcase,
	Calendar,
	CheckCircle2,
	Crown,
	Headphones,
	LogIn,
	Sparkles,
	X,
	XCircle,
	Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { trpc } from "@/server/client";

export default function MembershipPage() {
	const t = useTranslations("membership");
	const locale = useLocale();
	const { user, isLoading: authLoading } = useAuth();
	const router = useRouter();
	const [isCancelling, setIsCancelling] = useState(false);

	const {
		data: membershipData,
		isLoading: membershipLoading,
		refetch,
	} = trpc.payments.getUserMembershipStatus.useQuery(undefined, {
		enabled: !!user,
	});

	const { data: pointsData } = trpc.points.getBalance.useQuery(undefined, {
		enabled: !!user,
	});

	const cancelSubscription = trpc.payments.cancelCreemSubscription.useMutation({
		onSuccess: () => {
			toast.success(locale === "zh" ? "订阅已取消" : "Subscription cancelled");
			setIsCancelling(false);
			refetch();
		},
		onError: (error) => {
			toast.error(error.message || (locale === "zh" ? "取消失败" : "Cancellation failed"));
			setIsCancelling(false);
		},
	});

	if (authLoading || membershipLoading) {
		return <MembershipSkeleton />;
	}

	if (!user) {
		return (
			<div className="container max-w-5xl mx-auto py-12 px-4">
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-16 gap-4">
						<LogIn className="h-12 w-12 text-muted-foreground" />
						<div className="text-center">
							<p className="text-lg font-medium">{t("loginRequired")}</p>
							<p className="text-sm text-muted-foreground mt-1">{t("loginDescription")}</p>
						</div>
						<Button onClick={() => router.push(`/${locale}/auth/login`)}>{t("loginButton")}</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	const hasActiveMembership = membershipData?.hasActiveMembership ?? false;
	const currentPlan = membershipData?.currentPlan;
	const membership = membershipData?.membership;
	const remainingDays = membershipData?.remainingDays ?? 0;

	const isFree = !hasActiveMembership;
	const planName =
		locale === "en"
			? currentPlan?.name || t("freePlan")
			: currentPlan?.nameZh || currentPlan?.name || t("freePlan");
	const isYearly = membership?.durationType === "yearly";
	const startDate = membership?.startDate ? new Date(membership.startDate) : null;
	const endDate = membership?.endDate ? new Date(membership.endDate) : null;

	const totalDays =
		startDate && endDate
			? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
			: 0;
	const progressPercent = totalDays > 0 ? Math.round((remainingDays / totalDays) * 100) : 0;

	const statusConfig = {
		active: { color: "bg-green-500", label: t("effective") },
		expired: { color: "bg-red-500", label: t("expired") },
		cancelled: { color: "bg-yellow-500", label: t("cancelled") },
		inactive: { color: "bg-gray-400", label: t("freePlan") },
	};

	const membershipStatus = membership?.status || "inactive";
	const currentStatus =
		statusConfig[membershipStatus as keyof typeof statusConfig] || statusConfig.inactive;

	const benefits = [
		{
			icon: Zap,
			label: t("dailyPoints"),
			value: isFree ? pointsData?.dailyPoints?.toString() || "1680" : t("included"),
			included: true,
		},
		{
			icon: Sparkles,
			label: t("monthlyPoints"),
			value: isFree ? "0" : pointsData?.monthlyPoints?.toString() || t("included"),
			included: !isFree,
		},
		{
			icon: Headphones,
			label: t("ttsQuota"),
			value: isFree ? t("notIncluded") : t("unlimited"),
			included: !isFree,
		},
		{ icon: Crown, label: t("cloneQuota"), value: isFree ? "0" : "3", included: !isFree },
		{
			icon: Briefcase,
			label: t("commercialUse"),
			value: isFree ? t("notIncluded") : t("included"),
			included: !isFree,
		},
		{
			icon: CheckCircle2,
			label: t("prioritySupport"),
			value: isFree ? t("notIncluded") : t("included"),
			included: !isFree,
		},
	];

	return (
		<div className="container max-w-5xl mx-auto py-8 px-4">
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
				<p className="text-muted-foreground mt-1">{t("description")}</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<div className="lg:col-span-2 space-y-6">
					<Card className={cn(!isFree && "border-primary/20")}>
						<CardHeader className="pb-4">
							<div className="flex items-start justify-between">
								<div>
									<CardTitle className="flex items-center gap-2">
										<Crown
											className={cn("h-5 w-5", isFree ? "text-muted-foreground" : "text-primary")}
										/>
										{t("currentPlan")}
									</CardTitle>
									<CardDescription className="mt-1">{t("planDetails")}</CardDescription>
								</div>
								<Badge variant={isFree ? "secondary" : "default"} className="gap-1">
									<span className={cn("h-2 w-2 rounded-full", currentStatus.color)} />
									{currentStatus.label}
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="flex items-baseline gap-2">
								<span className="text-4xl font-bold">{planName}</span>
								{!isFree && (
									<Badge variant="outline" className="text-xs">
										{isYearly ? t("yearly") : t("monthly")}
									</Badge>
								)}
							</div>

							{!isFree && (
								<>
									<div className="space-y-2">
										<div className="flex justify-between text-sm">
											<span className="text-muted-foreground">{t("remainingDays")}</span>
											<span className="font-medium">
												{remainingDays} {t("daysUnit")}
											</span>
										</div>
										<Progress value={progressPercent} className="h-2" />
										<div className="flex justify-between text-xs text-muted-foreground">
											<span>{startDate?.toLocaleDateString(locale)}</span>
											<span>{endDate?.toLocaleDateString(locale)}</span>
										</div>
									</div>

									<div className="grid gap-3 sm:grid-cols-2">
										<div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
											<Calendar className="h-4 w-4 text-muted-foreground" />
											<div>
												<p className="text-xs text-muted-foreground">{t("nextRenewal")}</p>
												<p className="text-sm font-medium">
													{endDate?.toLocaleDateString(locale) || "-"}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
											<CheckCircle2 className="h-4 w-4 text-muted-foreground" />
											<div>
												<p className="text-xs text-muted-foreground">{t("autoRenew")}</p>
												<p className="text-sm font-medium">
													{membership?.autoRenew ? t("enabled") : t("disabled")}
												</p>
											</div>
										</div>
									</div>
								</>
							)}

							{isFree && (
								<div className="p-4 rounded-lg bg-muted/50">
									<p className="text-sm text-muted-foreground">{t("freePlanDesc")}</p>
									<p className="text-sm text-muted-foreground mt-1">{t("upgradePrompt")}</p>
								</div>
							)}

							<div className="flex gap-3">
								{isFree ? (
									<Button onClick={() => router.push(`/${locale}/pricing`)}>
										{t("viewPlans")}
										<ArrowRight className="h-4 w-4 ml-2" />
									</Button>
								) : (
									<>
										<Button onClick={() => router.push(`/${locale}/pricing`)}>{t("renew")}</Button>
										<Button
											variant="outline"
											onClick={() => router.push(`/${locale}/payment/history`)}
										>
											{t("viewBill")}
										</Button>
										{membership?.creemSubscriptionId && membership?.autoRenew && (
											<Button
												variant="destructive"
												onClick={() => {
													if (
														confirm(
															locale === "zh"
																? "确定要取消订阅吗？到期后将不再自动续费。"
																: "Are you sure? Your subscription will not auto-renew after expiry.",
														)
													) {
														setIsCancelling(true);
														cancelSubscription.mutate({ reason: "User requested cancellation" });
													}
												}}
												disabled={isCancelling}
											>
												<X className="h-4 w-4 mr-1" />
												{isCancelling
													? locale === "zh"
														? "取消中..."
														: "Cancelling..."
													: locale === "zh"
														? "取消订阅"
														: "Cancel Subscription"}
											</Button>
										)}
									</>
								)}
							</div>
						</CardContent>
					</Card>

					{pointsData && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-base">
									<Zap className="h-4 w-4" />
									{t("pointsOverview")}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid gap-3 sm:grid-cols-3">
									<div className="p-3 rounded-lg bg-muted/50">
										<p className="text-xs text-muted-foreground">{t("dailyBalance")}</p>
										<p className="text-lg font-bold">{pointsData.dailyBalance}</p>
									</div>
									<div className="p-3 rounded-lg bg-muted/50">
										<p className="text-xs text-muted-foreground">{t("monthlyBalance")}</p>
										<p className="text-lg font-bold">{pointsData.monthlyBalance}</p>
									</div>
									<div className="p-3 rounded-lg bg-muted/50">
										<p className="text-xs text-muted-foreground">{t("totalConsumed")}</p>
										<p className="text-lg font-bold">{pointsData.totalBalance}</p>
									</div>
								</div>
							</CardContent>
						</Card>
					)}
				</div>

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-base">{t("benefits")}</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{benefits.map((benefit) => (
									<div key={benefit.label} className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<benefit.icon className="h-4 w-4 text-muted-foreground" />
											<span className="text-sm">{benefit.label}</span>
										</div>
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium">{benefit.value}</span>
											{benefit.included ? (
												<CheckCircle2 className="h-4 w-4 text-green-500" />
											) : (
												<XCircle className="h-4 w-4 text-muted-foreground/50" />
											)}
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

function MembershipSkeleton() {
	return (
		<div className="container max-w-5xl mx-auto py-8 px-4">
			<Skeleton className="h-10 w-48 mb-2" />
			<Skeleton className="h-5 w-96 mb-8" />
			<div className="grid gap-6 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-32 mb-2" />
							<Skeleton className="h-4 w-48" />
						</CardHeader>
						<CardContent className="space-y-4">
							<Skeleton className="h-10 w-40" />
							<Skeleton className="h-2 w-full" />
							<div className="grid gap-3 sm:grid-cols-2">
								<Skeleton className="h-16 w-full" />
								<Skeleton className="h-16 w-full" />
							</div>
						</CardContent>
					</Card>
				</div>
				<div>
					<Card>
						<CardHeader>
							<Skeleton className="h-5 w-24" />
						</CardHeader>
						<CardContent className="space-y-3">
							<Skeleton className="h-6 w-full" />
							<Skeleton className="h-6 w-full" />
							<Skeleton className="h-6 w-full" />
							<Skeleton className="h-6 w-full" />
							<Skeleton className="h-6 w-full" />
							<Skeleton className="h-6 w-full" />
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
