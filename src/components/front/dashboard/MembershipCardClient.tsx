"use client";

import { Calendar, Crown, RefreshCw, Shield, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/auth";
import { useUserMembership } from "@/hooks/use-membership";
import { trpc } from "@/server/client";

export function MembershipCardClient() {
	const t = useTranslations("dashboard");
	const { user, isLoading: authLoading, isAuthenticated } = useAuth();
	const pathname = usePathname();
	const locale = pathname.split("/")[1] || "zh";

	const { membershipStatus, isLoading } = useUserMembership();
	const [isCancelling, setIsCancelling] = useState(false);

	const cancelSubscription = trpc.payments.cancelCreemSubscription.useMutation({
		onSuccess: () => {
			toast.success(locale === "zh" ? "订阅已取消" : "Subscription cancelled");
			setIsCancelling(false);
			window.location.reload();
		},
		onError: (error) => {
			toast.error(error.message || (locale === "zh" ? "取消失败" : "Cancellation failed"));
			setIsCancelling(false);
		},
	});

	if (authLoading || isLoading) {
		return <MembershipCardSkeleton />;
	}

	if (!(isAuthenticated && user)) {
		return null;
	}

	const hasActiveMembership = membershipStatus?.hasActiveMembership;
	const membership = membershipStatus?.membership;
	const currentPlan = membershipStatus?.currentPlan;

	const endDate = membership?.endDate ? new Date(membership.endDate) : null;
	const startDate = membership?.startDate ? new Date(membership.startDate) : null;
	const daysRemaining = endDate
		? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
		: 0;

	const hasSubscription = !!membership?.creemSubscriptionId;
	const autoRenew = membership?.autoRenew;

	const handleCancelSubscription = () => {
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
	};

	return (
		<Card className={hasActiveMembership ? "border-primary/30" : ""}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center justify-between text-base">
					<div className="flex items-center gap-2">
						{hasActiveMembership ? (
							<Crown className="h-5 w-5 text-primary" />
						) : (
							<Shield className="h-5 w-5 text-muted-foreground" />
						)}
						{t("membershipStatus")}
					</div>
					{hasActiveMembership && (
						<Badge variant="default" className="text-xs">
							{locale === "en" ? currentPlan?.name : currentPlan?.nameZh || currentPlan?.name}
						</Badge>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{hasActiveMembership ? (
					<>
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">{t("planType")}</span>
							<span className="font-medium">
								{membership?.durationType === "yearly" ? t("yearly") : t("monthly")}
							</span>
						</div>

						{hasSubscription && (
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground flex items-center gap-1">
									<RefreshCw className="h-3 w-3" />
									{locale === "zh" ? "自动续费" : "Auto Renew"}
								</span>
								<span className={`font-medium ${autoRenew ? "text-green-600" : "text-gray-500"}`}>
									{autoRenew
										? locale === "zh"
											? "已开启"
											: "Enabled"
										: locale === "zh"
											? "已关闭"
											: "Disabled"}
								</span>
							</div>
						)}

						{startDate && (
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">{t("startDate")}</span>
								<span className="font-medium">
									{startDate.toLocaleDateString(locale === "en" ? "en-US" : "zh-CN")}
								</span>
							</div>
						)}

						{endDate && (
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground flex items-center gap-1">
									<Calendar className="h-3 w-3" />
									{t("endDate")}
								</span>
								<span className="font-medium">
									{daysRemaining > 0 ? t("daysRemaining", { count: daysRemaining }) : t("expired")}
								</span>
							</div>
						)}

						<div className="flex gap-2">
							<Button asChild variant="outline" size="sm" className="flex-1">
								<Link href={`/${locale}/pricing`}>{t("renewUpgrade")}</Link>
							</Button>

							{hasSubscription && autoRenew && (
								<Button
									variant="destructive"
									size="sm"
									className="flex-1"
									onClick={handleCancelSubscription}
									disabled={isCancelling}
								>
									<X className="h-3 w-3 mr-1" />
									{isCancelling
										? locale === "zh"
											? "取消中..."
											: "Cancelling..."
										: locale === "zh"
											? "取消订阅"
											: "Cancel"}
								</Button>
							)}
						</div>
					</>
				) : (
					<div className="text-center py-2">
						<p className="text-sm text-muted-foreground mb-3">{t("freeUser")}</p>
						<Button asChild size="sm">
							<Link href={`/${locale}/pricing`}>{t("upgradeMembership")}</Link>
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function MembershipCardSkeleton() {
	const _t = useTranslations("dashboard");
	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-base">
					<Skeleton className="h-5 w-5" />
					<Skeleton className="h-5 w-20" />
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-center justify-between">
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-4 w-12" />
				</div>
				<div className="flex items-center justify-between">
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-4 w-20" />
				</div>
				<Skeleton className="h-9 w-full" />
			</CardContent>
		</Card>
	);
}
