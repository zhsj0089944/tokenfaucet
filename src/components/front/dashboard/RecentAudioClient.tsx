"use client";

import { AudioLines, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/auth";
import { trpc } from "@/server/client";

export function RecentAudioClient() {
	const t = useTranslations("dashboard");
	const { isAuthenticated } = useAuth();
	const pathname = usePathname();
	const locale = pathname.split("/")[1] || "zh";

	const { data: records, isLoading } = trpc.tts.getRecentUsage.useQuery(
		{ limit: 5 },
		{
			enabled: isAuthenticated,
			staleTime: 60 * 1000,
		},
	);

	if (!isAuthenticated) return null;

	if (isLoading) {
		return <RecentAudioSkeleton />;
	}

	const hasRecords = records && records.length > 0;

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="flex items-center gap-2">
					<AudioLines className="h-5 w-5 text-primary" />
					{t("recentGenerations")}
				</CardTitle>
				{hasRecords && (
					<Button asChild variant="ghost" size="sm">
						<Link href={`/${locale}/ai/tts`}>
							{t("viewAll")}
							<ExternalLink className="ml-1 h-3 w-3" />
						</Link>
					</Button>
				)}
			</CardHeader>
			<CardContent>
				{!hasRecords ? (
					<div className="text-center py-8">
						<AudioLines className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<p className="text-muted-foreground mb-4">{t("noRecords")}</p>
						<Button asChild variant="outline">
							<Link href={`/${locale}/ai/tts`}>{t("startTTS")}</Link>
						</Button>
					</div>
				) : (
					<div className="space-y-3">
						{records.map((record) => (
							<div
								key={record.id}
								className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
							>
								<div className="flex items-center gap-3">
									<div className="p-2 bg-primary/10 rounded-lg">
										<AudioLines className="h-4 w-4 text-primary" />
									</div>
									<div>
										<div className="flex items-center gap-2">
											<p className="text-sm font-medium">
												{record.textLength ? `${record.textLength} ${t("chars")}` : t("audio")}
											</p>
											<Badge variant="outline" className="text-xs">
												{record.voiceType === "preset"
													? t("preset")
													: record.voiceType === "design"
														? t("design")
														: t("clone")}
											</Badge>
										</div>
										<div className="flex items-center gap-2 text-xs text-muted-foreground">
											<Clock className="h-3 w-3" />
											<span>
												{new Date(record.createdAt).toLocaleDateString(
													locale === "en" ? "en-US" : "zh-CN",
													{
														month: "short",
														day: "numeric",
														hour: "2-digit",
														minute: "2-digit",
													},
												)}
											</span>
											{record.model && <span>{record.model}</span>}
										</div>
									</div>
								</div>
								<Badge variant={record.isSuccess ? "default" : "destructive"}>
									{record.isSuccess ? t("success") : t("failed")}
								</Badge>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function RecentAudioSkeleton() {
	const t = useTranslations("dashboard");
	const skeletonKeys = useMemo(() => Array.from({ length: 3 }, () => crypto.randomUUID()), []);
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<AudioLines className="h-5 w-5 text-primary" />
					{t("recentGenerations")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={skeletonKeys[i]}
							className="flex items-center justify-between p-3 border rounded-lg"
						>
							<div className="flex items-center gap-3">
								<Skeleton className="h-8 w-8 rounded-lg" />
								<div className="space-y-2">
									<Skeleton className="h-4 w-20" />
									<Skeleton className="h-3 w-32" />
								</div>
							</div>
							<Skeleton className="h-5 w-12" />
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
