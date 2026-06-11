"use client";

import { Crown, Shield } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MEMBERSHIP_STATUS } from "@/constants/payment";
import { useAuth } from "@/hooks/auth";
import { useUserMembership } from "@/hooks/use-membership";
import { localizePath } from "@/lib/utils";

export function MembershipCenter() {
	const t = useTranslations("membership");
	const auth = useAuth();
	const locale = useLocale();
	const {
		membershipStatus,
		currentPlan,
		isLoading,
		hasActiveMembership,
		remainingDays,
		nextExpiryDate,
	} = useUserMembership();

	if (!auth.isAuthenticated) {
		return (
			<div className="container mx-auto py-12">
				<Card className="mx-auto max-w-xl text-center">
					<CardHeader>
						<CardTitle className="flex flex-col items-center gap-2 text-lg">
							<Shield className="h-6 w-6 text-muted-foreground" />
							{t("loginRequired")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 text-sm text-muted-foreground">
						<p>{t("loginDescription")}</p>
						<Button asChild>
							<Link href={localizePath(locale, "/auth/login")}>{t("loginButton")}</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="container mx-auto py-12">
				<Card className="mx-auto max-w-2xl">
					<CardHeader>
						<Skeleton className="h-6 w-32" />
					</CardHeader>
					<CardContent className="space-y-4">
						<Skeleton className="h-4 w-40" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-10 w-48" />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!hasActiveMembership) {
		return (
			<div className="container mx-auto py-12">
				<Card className="mx-auto max-w-2xl">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Shield className="h-5 w-5 text-muted-foreground" />
							{t("freePlan")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 text-sm text-muted-foreground">
						<p>{t("upgradePrompt")}</p>
						<Button asChild className="w-full sm:w-auto">
							<Link href={localizePath(locale, "/pricing")}>
								<Crown className="mr-2 h-4 w-4" />
								{t("viewPlans")}
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	const membership = membershipStatus?.membership;
	const statusConfig = membership?.status
		? MEMBERSHIP_STATUS[membership.status as keyof typeof MEMBERSHIP_STATUS]
		: undefined;
	const planName =
		locale === "en"
			? currentPlan?.name
			: currentPlan?.nameZh || currentPlan?.name || t("membershipPlan");
	const billingCycle = membership?.durationType === "yearly" ? t("yearly") : t("monthly");
	const nextRenewal = nextExpiryDate
		? new Date(nextExpiryDate).toLocaleDateString(locale, {
				year: "numeric",
				month: "long",
				day: "numeric",
			})
		: "—";

	return (
		<div className="container mx-auto py-12">
			<Card className="mx-auto max-w-2xl">
				<CardHeader className="flex flex-col gap-2">
					<CardTitle className="flex items-center gap-2 text-lg">
						<Crown className="h-5 w-5 text-amber-500" />
						{planName}
					</CardTitle>
					<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
						{statusConfig ? (
							<Badge className={statusConfig.color}>
								{locale === "en" ? statusConfig.label : statusConfig.labelZh}
							</Badge>
						) : null}
						<span>
							{t("billingCycle")}：{billingCycle}
						</span>
						<span>
							{t("remainingDays")}：{remainingDays}
						</span>
					</div>
				</CardHeader>
				<CardContent className="space-y-4 text-sm text-muted-foreground">
					<div className="flex flex-col gap-2">
						<p>
							{t("nextRenewal")}：<strong>{nextRenewal}</strong>
						</p>
						{membership?.purchaseAmount ? (
							<p>
								{t("lastPaymentAmount")}：
								<strong>
									{membership.purchaseAmount} {membership.currency}
								</strong>
							</p>
						) : null}
					</div>

					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
						<Button asChild variant="outline">
							<Link href={localizePath(locale, "/pricing")}>{t("upgradeOrRenew")}</Link>
						</Button>
						<Button asChild variant="ghost">
							<Link href={localizePath(locale, "/payment/history")}>{t("viewBill")}</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
