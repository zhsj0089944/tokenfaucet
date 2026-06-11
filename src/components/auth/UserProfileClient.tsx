"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ADMIN_LEVEL_NAMES } from "@/constants/auth";
import { useAuth } from "@/hooks/auth";
import { logger } from "@/lib/logger";

interface UserProfileClientProps {
	showAdminBadge?: boolean;
}

export function UserProfileClient({ showAdminBadge = true }: UserProfileClientProps) {
	const t = useTranslations("settings");
	const pathname = usePathname();
	const locale = pathname.split("/")[1] || "zh";
	const { user, isLoading, isAuthenticated } = useAuth();

	// 在开发环境下调试输出
	if (process.env.NODE_ENV === "development") {
		logger.debug("UserProfileClient auth state", { user, isLoading, isAuthenticated });
	}

	if (isLoading) {
		return <UserProfileSkeleton />;
	}

	if (!(isAuthenticated && user)) {
		return (
			<Card>
				<CardContent className="p-6">
					<p className="text-muted-foreground">
						{!isAuthenticated ? t("loginFirst") : t("userNotFound")}
					</p>
				</CardContent>
			</Card>
		);
	}

	const displayName = user.fullName || user.name || user.email;
	const initials =
		displayName
			?.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase() ||
		user.email?.[0]?.toUpperCase() ||
		"U";

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("userProfile")}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-center space-x-4">
					<Avatar className="h-16 w-16">
						<AvatarImage src={user.image || undefined} alt={displayName} />
						<AvatarFallback className="text-lg">{initials}</AvatarFallback>
					</Avatar>

					<div className="space-y-1">
						<h3 className="text-lg font-semibold">
							{user.fullName || user.name || user.email?.split("@")[0] || t("userProfile")}
						</h3>
						<p className="text-sm text-muted-foreground">{user.email}</p>

						<div className="flex flex-wrap gap-2 mt-2">
							{user.emailVerified && (
								<Badge variant="outline" className="text-green-600 border-green-600">
									{t("emailVerified")}
								</Badge>
							)}

							{showAdminBadge && user.isAdmin && (
								<Badge variant="secondary">
									{ADMIN_LEVEL_NAMES[user.adminLevel as keyof typeof ADMIN_LEVEL_NAMES] ||
										ADMIN_LEVEL_NAMES[0]}
								</Badge>
							)}
						</div>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4 pt-4">
					<div>
						<p className="text-sm font-medium">{t("registered")}</p>
						<p className="text-sm text-muted-foreground">
							{user.createdAt
								? typeof user.createdAt === "string"
									? new Date(user.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN")
									: user.createdAt.toLocaleDateString(locale === "en" ? "en-US" : "zh-CN")
								: t("unknown")}
						</p>
					</div>

					<div>
						<p className="text-sm font-medium">{t("updated")}</p>
						<p className="text-sm text-muted-foreground">
							{user.updatedAt
								? typeof user.updatedAt === "string"
									? new Date(user.updatedAt).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN")
									: user.updatedAt.toLocaleDateString(locale === "en" ? "en-US" : "zh-CN")
								: t("unknown")}
						</p>
					</div>

					<div>
						<p className="text-sm font-medium">{t("active")}</p>
						<Badge variant={user.isActive ? "default" : "destructive"}>
							{user.isActive ? t("active") : t("disabled")}
						</Badge>
					</div>

					<div>
						<p className="text-sm font-medium">{t("languagePreference")}</p>
						<p className="text-sm text-muted-foreground">
							{(user.preferences as { language?: string } | null)?.language === "zh"
								? "中文"
								: "English"}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function UserProfileSkeleton() {
	const _t = useTranslations("settings");
	const skeletonKeys = useMemo(() => Array.from({ length: 4 }, () => crypto.randomUUID()), []);
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-7 w-24" />
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-center space-x-4">
					<Skeleton className="h-16 w-16 rounded-full" />
					<div className="space-y-1">
						<Skeleton className="h-6 w-32" />
						<Skeleton className="h-4 w-48" />
						<Skeleton className="h-5 w-20" />
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4 pt-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={skeletonKeys[i]}>
							<Skeleton className="h-4 w-16 mb-2" />
							<Skeleton className="h-4 w-24" />
						</div>
					))}
				</div>

				<div className="pt-4 border-t">
					<Skeleton className="h-4 w-16 mb-2" />
					<div className="grid grid-cols-2 gap-2">
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-4 w-20" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
