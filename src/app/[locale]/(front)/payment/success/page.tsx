"use client";

import { ArrowRight, Calendar, CheckCircle, CreditCard } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Suspense } from "react";
import { AuthGuardClient } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/constants/payment";
import { localizePath } from "@/lib/utils";
import { trpc } from "@/server/client";

function PaymentSuccessContent() {
	const locale = useLocale();
	const t = useTranslations("payment.success");
	const searchParams = useSearchParams();
	const sessionId = searchParams.get("session_id");

	const {
		data: membershipStatus,
		isLoading,
		error,
	} = trpc.payments.getUserMembershipStatus.useQuery(undefined, {
		staleTime: 0,
		gcTime: 0,
		refetchInterval: (query) => {
			if (query.state.data?.hasActiveMembership) return false;
			return 3000;
		},
	});

	if (isLoading) {
		return <PaymentSuccessLoading />;
	}

	if (error || !membershipStatus) {
		return <PaymentSuccessError />;
	}

	const { hasActiveMembership, currentPlan, membership, remainingDays } = membershipStatus;

	return (
		<div className="text-center space-y-8">
			<div className="flex justify-center">
				<div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
					<CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
				</div>
			</div>

			<div className="space-y-4">
				<h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
				<p className="text-lg text-gray-600 dark:text-gray-300">{t("description")}</p>
			</div>

			{hasActiveMembership && currentPlan && membership && (
				<Card className="text-left">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CreditCard className="h-5 w-5" />
							{t("membershipInfo")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<p className="text-sm text-muted-foreground">{t("plan")}</p>
								<p className="font-medium text-lg">
									{locale === "zh"
										? currentPlan.nameZh || currentPlan.name
										: currentPlan.displayNameEn || currentPlan.name}
								</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">{t("billingCycle")}</p>
								<p className="font-medium">
									{membership.durationType === "yearly" ? t("yearly") : t("monthly")}
								</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">{t("amount")}</p>
								<p className="font-medium text-lg">
									{formatPrice(Number(membership.purchaseAmount), membership.currency as "USD")}
								</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">{t("validity")}</p>
								<div className="flex items-center gap-1">
									<Calendar className="h-4 w-4" />
									<p className="font-medium">
										{remainingDays} {t("days")}
									</p>
								</div>
							</div>
						</div>

						{membership.endDate && (
							<div className="pt-4 border-t">
								<p className="text-sm text-muted-foreground">{t("expiresAt")}</p>
								<p className="font-medium">
									{new Date(membership.endDate).toLocaleDateString(
										locale === "zh" ? "zh-CN" : "en-US",
										{
											year: "numeric",
											month: "long",
											day: "numeric",
										},
									)}
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{currentPlan && (
				<Card className="text-left">
					<CardHeader>
						<CardTitle>{t("featuresTitle")}</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							{((locale === "zh" ? currentPlan.featuresZh : currentPlan.features) || []).map(
								(feature: string) => (
									<div key={feature} className="flex items-center gap-2">
										<CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
										<span className="text-sm">{feature}</span>
									</div>
								),
							)}
						</div>
					</CardContent>
				</Card>
			)}

			<div className="flex flex-col sm:flex-row gap-4 justify-center">
				<Button asChild size="lg">
					<Link href={localizePath(locale, "/dashboard")}>
						{t("goToDashboard")}
						<ArrowRight className="ml-2 h-4 w-4" />
					</Link>
				</Button>
				<Button asChild variant="outline" size="lg">
					<Link href={localizePath(locale, "/payment/history")}>{t("viewHistory")}</Link>
				</Button>
			</div>

			<div className="text-center text-sm text-muted-foreground">
				<p>
					{t("supportPrefix")}{" "}
					<Link href={localizePath(locale, "/contact")} className="text-primary hover:underline">
						{t("contactSupport")}
					</Link>
				</p>
			</div>

			{process.env.NODE_ENV === "development" && sessionId && (
				<Card className="text-left">
					<CardHeader>
						<CardTitle className="text-sm">Debug</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-xs text-muted-foreground font-mono">Session ID: {sessionId}</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

function PaymentSuccessLoading() {
	return (
		<div className="text-center space-y-8">
			<div className="flex justify-center">
				<div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center animate-pulse">
					<div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
				</div>
			</div>

			<div className="space-y-4">
				<Skeleton className="h-8 w-48 mx-auto" />
				<Skeleton className="h-6 w-64 mx-auto" />
			</div>

			<Card>
				<CardContent className="p-6">
					<div className="space-y-4">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-4 w-1/2" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function PaymentSuccessError() {
	const locale = useLocale();
	const t = useTranslations("payment.success");
	return (
		<div className="text-center space-y-8">
			<div className="flex justify-center">
				<div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
					<CreditCard className="w-12 h-12 text-red-600 dark:text-red-400" />
				</div>
			</div>

			<div className="space-y-4">
				<h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("processing")}</h1>
				<p className="text-lg text-gray-600 dark:text-gray-300">{t("processingDescription")}</p>
			</div>

			<div className="flex flex-col sm:flex-row gap-4 justify-center">
				<Button asChild size="lg">
					<Link href={localizePath(locale, "/dashboard")}>
						{t("goToDashboard")}
						<ArrowRight className="ml-2 h-4 w-4" />
					</Link>
				</Button>
				<Button asChild variant="outline" size="lg">
					<Link href={localizePath(locale, "/pricing")}>{t("backToPricing")}</Link>
				</Button>
			</div>
		</div>
	);
}

export default function PaymentSuccessPage() {
	const locale = useLocale();
	return (
		<AuthGuardClient redirectTo={`/${locale}/auth/login`}>
			<main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
				<div className="max-w-2xl w-full space-y-8">
					<Suspense fallback={<PaymentSuccessLoading />}>
						<PaymentSuccessContent />
					</Suspense>
				</div>
			</main>
		</AuthGuardClient>
	);
}
