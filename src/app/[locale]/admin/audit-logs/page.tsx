"use client";

import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { AuditLogsPage } from "@/components/admin/audit-logs/AuditLogsPage";
import { AdminGuardClient } from "@/components/auth";
import { Skeleton } from "@/components/ui/skeleton";

function AuditLogsContent() {
	const t = useTranslations("admin.auditLogs");
	return (
		<div className="container mx-auto py-6 space-y-6">
			<div>
				<h1 className="text-3xl font-bold">{t("title")}</h1>
				<p className="text-muted-foreground">{t("subtitle")}</p>
			</div>

			<Suspense fallback={<AuditLogsSkeleton />}>
				<AuditLogsPage />
			</Suspense>
		</div>
	);
}

function AuditLogsSkeleton() {
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				{["stat-1", "stat-2", "stat-3", "stat-4"].map((id) => (
					<div key={id} className="h-24">
						<Skeleton className="h-full w-full" />
					</div>
				))}
			</div>
			<div className="h-96">
				<Skeleton className="h-full w-full" />
			</div>
		</div>
	);
}

export default function AdminAuditLogsPage() {
	return (
		<AdminGuardClient>
			<AuditLogsContent />
		</AdminGuardClient>
	);
}
