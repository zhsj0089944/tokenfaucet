"use client";

import { Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/auth";

export function UserAvatarCard() {
	const t = useTranslations("dashboard");
	const { user, isLoading, isAuthenticated } = useAuth();
	const pathname = usePathname();
	const locale = pathname.split("/")[1] || "zh";

	if (isLoading) {
		return <UserAvatarSkeleton />;
	}

	if (!(isAuthenticated && user)) {
		return null;
	}

	const displayName = user.fullName || user.name || user.email?.split("@")[0] || t("userProfile");
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
			<CardContent className="p-4">
				<div className="flex items-center gap-3">
					<Avatar className="h-12 w-12">
						<AvatarImage src={user.image || undefined} alt={displayName} />
						<AvatarFallback>{initials}</AvatarFallback>
					</Avatar>

					<div className="flex-1 min-w-0">
						<h3 className="font-semibold truncate">{displayName}</h3>
						<p className="text-xs text-muted-foreground truncate">{user.email}</p>
					</div>

					<Button asChild variant="ghost" size="icon" className="shrink-0">
						<Link href={`/${locale}/settings`}>
							<Settings className="h-4 w-4" />
						</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

function UserAvatarSkeleton() {
	return (
		<Card>
			<CardContent className="p-4">
				<div className="flex items-center gap-3">
					<Skeleton className="h-12 w-12 rounded-full" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-3 w-32" />
					</div>
					<Skeleton className="h-9 w-9" />
				</div>
			</CardContent>
		</Card>
	);
}
