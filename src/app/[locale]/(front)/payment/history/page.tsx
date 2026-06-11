"use client";

import {
	ArrowRight,
	Calendar,
	ChevronLeft,
	ChevronRight,
	CreditCard,
	LogIn,
	Package,
	Receipt,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/server/client";

const PAGE_SIZE = 10;

export default function PaymentHistoryPage() {
	const t = useTranslations("payment");
	const locale = useLocale();
	const { user, isLoading: authLoading } = useAuth();
	const router = useRouter();
	const [page, setPage] = useState(1);

	const { data: paymentsData, isLoading: paymentsLoading } =
		trpc.payments.getPaymentHistory.useQuery({ page, limit: PAGE_SIZE }, { enabled: !!user });

	if (authLoading || paymentsLoading) {
		return <PaymentHistorySkeleton />;
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

	const payments = paymentsData?.payments || [];
	const pagination = paymentsData?.pagination;
	const totalPages = pagination?.totalPages || 1;
	const totalCount = pagination?.total || 0;

	const statusConfig: Record<
		string,
		{ variant: "default" | "secondary" | "destructive" | "outline"; label: string }
	> = {
		succeeded: { variant: "default", label: t("statusLabels.completed") },
		pending: { variant: "secondary", label: t("statusLabels.pending") },
		failed: { variant: "destructive", label: t("statusLabels.failed") },
		refunded: { variant: "outline", label: t("statusLabels.refunded") },
		cancelled: { variant: "outline", label: t("statusLabels.cancelled") },
	};

	const getStatusItem = (status: string) => {
		const item = statusConfig[status];
		if (item) return item;
		return { variant: "secondary" as const, label: t("statusLabels.pending") };
	};

	return (
		<div className="container max-w-5xl mx-auto py-8 px-4">
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
				<p className="text-muted-foreground mt-1">{t("description")}</p>
			</div>

			{payments.length === 0 ? (
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-16 gap-4">
						<Receipt className="h-12 w-12 text-muted-foreground" />
						<div className="text-center">
							<p className="text-lg font-medium">{t("empty")}</p>
							<p className="text-sm text-muted-foreground mt-1">{t("emptyDesc")}</p>
						</div>
						<Button onClick={() => router.push(`/${locale}/pricing`)}>
							{t("browsePlans")}
							<ArrowRight className="h-4 w-4 ml-2" />
						</Button>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="flex items-center gap-2">
									<Receipt className="h-5 w-5" />
									{t("record")}
								</CardTitle>
								<CardDescription className="mt-1">
									{t("page", { page, total: totalPages })} · {totalCount} {t("records")}
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{payments.map((payment) => {
								const paymentStatus = payment.status || "pending";
								const statusItem = getStatusItem(paymentStatus);
								const amount =
									typeof payment.amount === "number" ? payment.amount : Number(payment.amount) || 0;
								const displayAmount = `$${amount.toFixed(2)}`;
								return (
									<div
										key={payment.id}
										className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors gap-4"
									>
										<div className="flex items-start gap-4">
											<div className="p-2 rounded-lg bg-primary/10">
												<Package className="h-5 w-5 text-primary" />
											</div>
											<div>
												<p className="font-medium">
													{payment.planName || payment.description || t("plan")}
												</p>
												<div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
													<span className="flex items-center gap-1">
														<Calendar className="h-3 w-3" />
														{new Date(payment.createdAt).toLocaleDateString(locale)}
													</span>
													<span className="flex items-center gap-1">
														<CreditCard className="h-3 w-3" />
														{payment.paymentMethod || "-"}
													</span>
												</div>
											</div>
										</div>
										<div className="flex items-center gap-4 sm:justify-end">
											<div className="text-right">
												<p className="font-semibold">{amount > 0 ? displayAmount : "-"}</p>
												<p className="text-xs text-muted-foreground">
													{payment.durationType || "-"}
												</p>
											</div>
											<Badge variant={statusItem.variant}>{statusItem.label}</Badge>
										</div>
									</div>
								);
							})}
						</div>

						{totalPages > 1 && (
							<div className="flex items-center justify-between mt-6 pt-4 border-t">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setPage((p) => Math.max(1, p - 1))}
									disabled={page <= 1}
								>
									<ChevronLeft className="h-4 w-4 mr-1" />
									{t("previous")}
								</Button>
								<span className="text-sm text-muted-foreground">
									{page} / {totalPages}
								</span>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
									disabled={page >= totalPages}
								>
									{t("next")}
									<ChevronRight className="h-4 w-4 ml-1" />
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}

function PaymentHistorySkeleton() {
	return (
		<div className="container max-w-5xl mx-auto py-8 px-4">
			<Skeleton className="h-10 w-48 mb-2" />
			<Skeleton className="h-5 w-96 mb-8" />
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32 mb-2" />
					<Skeleton className="h-4 w-48" />
				</CardHeader>
				<CardContent className="space-y-3">
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
				</CardContent>
			</Card>
		</div>
	);
}
