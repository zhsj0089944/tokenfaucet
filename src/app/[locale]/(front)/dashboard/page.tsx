"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { AuthGuardClient } from "@/components/auth";
import {
	DashboardStatsClient,
	InviteFriendClient,
	MembershipCardClient,
	UserAvatarCard,
} from "@/components/front/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/auth";
import { logger } from "@/lib/logger";

function DashboardContent() {
	const t = useTranslations("dashboard");
	const { user, isLoading, isStateStale, syncAuthState } = useAuth();

	// 如果检测到状态不同步，尝试同步
	useEffect(() => {
		let mounted = true;

		const handleStateSync = async () => {
			if (isStateStale && !isLoading) {
				logger.debug("Dashboard: detected state out of sync, attempting sync");
				const needsReload = await syncAuthState();

				if (needsReload && mounted) {
					logger.debug("Dashboard: state sync requires page reload");
					// 让用户知道正在同步状态
					return;
				}
			}
		};

		handleStateSync();

		return () => {
			mounted = false;
		};
	}, [isStateStale, isLoading, syncAuthState]);

	// AuthGuard已经处理认证检查，这里只需要处理加载状态
	if (isLoading) {
		return <DashboardSkeleton />;
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<div className="mb-6">
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
						{t("welcome", { name: user?.name || user?.email || "" })}
					</h1>
					<p className="text-gray-600 dark:text-gray-300">{t("description")}</p>
				</div>

				{/* 统计卡片 */}
				<div className="mb-8">
					<DashboardStatsClient />
				</div>

				{/* 主要内容区域 */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* 左侧：邀请好友（占2/3宽度） */}
					<div className="lg:col-span-2">
						<InviteFriendClient />
					</div>

					{/* 右侧：用户信息和会员卡 */}
					<div className="space-y-6">
						<UserAvatarCard />
						<MembershipCardClient />
					</div>
				</div>
			</div>
		</div>
	);
}

function DashboardSkeleton() {
	const statSkeletonKeys = ["stat-users", "stat-points", "stat-audio", "stat-plan"];

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<Skeleton className="h-9 w-48 mb-2" />
				<Skeleton className="h-5 w-96" />
			</div>

			{/* 统计卡片骨架 */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
				{statSkeletonKeys.map((key) => (
					<Skeleton key={key} className="h-24" />
				))}
			</div>

			{/* 主要内容骨架 */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2">
					<Skeleton className="h-96" />
				</div>
				<div className="space-y-6">
					<Skeleton className="h-20" />
					<Skeleton className="h-48" />
					<Skeleton className="h-64" />
				</div>
			</div>
		</div>
	);
}

export default function DashboardPage() {
	return (
		<AuthGuardClient redirectTo="/zh/auth/login">
			<DashboardContent />
		</AuthGuardClient>
	);
}
