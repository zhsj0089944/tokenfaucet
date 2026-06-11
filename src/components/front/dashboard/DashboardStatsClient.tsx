"use client";

import { Coins, TrendingUp, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/auth";
import { trpc } from "@/server/client";

export function DashboardStatsClient() {
	const t = useTranslations("dashboard");
	const { isAuthenticated } = useAuth();

	const { data: balanceData, isLoading: balanceLoading } = trpc.points.getBalance.useQuery(
		undefined,
		{
			enabled: isAuthenticated,
			staleTime: 30 * 1000,
		},
	);

	const { data: usageData, isLoading: usageLoading } = trpc.points.getUsageStats.useQuery(
		undefined,
		{
			enabled: isAuthenticated,
			staleTime: 30 * 1000,
		},
	);

	if (!isAuthenticated) return null;

	const isLoading = balanceLoading || usageLoading;

	if (isLoading) {
		return <DashboardStatsSkeleton />;
	}

	const stats = [
		{
			label: t("totalBalance"),
			value: (balanceData?.totalBalance ?? 0).toLocaleString(),
			icon: Coins,
			description: t("available"),
			color: "text-primary",
			bgColor: "bg-primary/10",
		},
		{
			label: t("todayUsage"),
			value: (usageData?.todayUsageCount ?? 0).toString(),
			icon: Zap,
			description: t("consumed", { count: usageData?.todayPointsUsed ?? 0 }),
			color: "text-orange-500",
			bgColor: "bg-orange-500/10",
		},

		{
			label: t("dailyPoints"),
			value: (balanceData?.dailyBalance ?? 0).toLocaleString(),
			icon: TrendingUp,
			description: t("daily", { count: balanceData?.dailyPoints ?? 0 }),
			color: "text-green-500",
			bgColor: "bg-green-500/10",
		},
	];

	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
			{stats.map((stat) => (
				<Card key={stat.label} className="hover:shadow-md transition-shadow">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className={`p-2 rounded-lg ${stat.bgColor}`}>
								<stat.icon className={`h-5 w-5 ${stat.color}`} />
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-xs text-muted-foreground truncate">{stat.label}</p>
								<p className={`text-xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
								<p className="text-[10px] text-muted-foreground truncate">{stat.description}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

function DashboardStatsSkeleton() {
	const skeletonKeys = useMemo(() => Array.from({ length: 4 }, () => crypto.randomUUID()), []);
	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
			{Array.from({ length: 4 }).map((_, i) => (
				<Card key={skeletonKeys[i]}>
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<Skeleton className="h-9 w-9 rounded-lg" />
							<div className="flex-1 space-y-2">
								<Skeleton className="h-3 w-16" />
								<Skeleton className="h-6 w-20" />
								<Skeleton className="h-2 w-24" />
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
