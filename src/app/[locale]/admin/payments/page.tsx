"use client";

import { ChevronLeft, ChevronRight, Copy, CreditCard, RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/server/client";

interface AdminPayment {
	id: string;
	userId: string;
	userEmail: string | null;
	userFullName: string | null;
	creemOrderId: string | null;
	creemSubscriptionId: string | null;
	amount: string;
	status: string;
	paymentMethod: string | null;
	planName: string | null;
	durationType: string | null;
	paidAt: string | Date | null;
	createdAt: string | Date | null;
}

const PAGE_SIZE = 20;

export default function AdminPaymentsPage() {
	const t = useTranslations("admin.payments");
	const locale = useLocale();
	const [page, setPage] = useState(1);

	const { data, isLoading, refetch } = trpc.payments.getAllPayments.useQuery({
		page,
		limit: PAGE_SIZE,
	});

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success(t("copied"));
	};

	if (isLoading && !data) {
		return <PaymentsSkeleton />;
	}

	const payments = data?.payments || [];
	const totalPages = data?.pagination?.totalPages || 1;
	const total = data?.pagination?.total || 0;

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "succeeded":
				return (
					<Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
						{t("success")}
					</Badge>
				);
			case "pending":
				return (
					<Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
						{t("pending")}
					</Badge>
				);
			case "failed":
				return (
					<Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
						{t("failed")}
					</Badge>
				);
			case "refunded":
				return (
					<Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
						{t("refunded")}
					</Badge>
				);
			case "cancelled":
				return (
					<Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
						{t("cancelled")}
					</Badge>
				);
			default:
				return <Badge variant="secondary">{status}</Badge>;
		}
	};

	const formatTime = (date: string | Date | null) => {
		if (!date) return "-";
		const d = new Date(date);
		return d.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const shortenId = (id: string | null | undefined) => {
		if (!id) return null;
		if (id.length <= 16) return id;
		return `${id.slice(0, 8)}...${id.slice(-6)}`;
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
				<p className="text-muted-foreground mt-1">{t("subtitle")}</p>
			</div>

			<Card>
				<CardHeader>
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div>
							<CardTitle className="flex items-center gap-2">
								<CreditCard className="h-5 w-5" />
								{t("paymentList")}
							</CardTitle>
							<CardDescription>{t("pagination", { total, page, totalPages })}</CardDescription>
						</div>
						<Button variant="outline" size="sm" onClick={() => refetch()}>
							<RefreshCw className="h-4 w-4 mr-1" />
							{t("refresh")}
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<div className="rounded-lg border overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b bg-muted/50">
										<th className="text-left p-3 font-medium text-muted-foreground">
											{t("orderId")}
										</th>
										<th className="text-left p-3 font-medium text-muted-foreground">{t("user")}</th>
										<th className="text-left p-3 font-medium text-muted-foreground">{t("plan")}</th>
										<th className="text-right p-3 font-medium text-muted-foreground">
											{t("amount")}
										</th>
										<th className="text-center p-3 font-medium text-muted-foreground">
											{t("status")}
										</th>
										<th className="text-left p-3 font-medium text-muted-foreground">
											{t("subscription")}
										</th>
										<th className="text-left p-3 font-medium text-muted-foreground">
											{t("paidAt")}
										</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{payments.length === 0 ? (
										<tr>
											<td colSpan={7} className="p-8 text-center text-muted-foreground">
												{t("noPayments")}
											</td>
										</tr>
									) : (
										payments.map((payment: AdminPayment) => (
											<tr key={payment.id} className="hover:bg-muted/30 transition-colors">
												<td className="p-3">
													<div className="flex items-center gap-1">
														<span className="font-mono text-xs text-muted-foreground">
															{shortenId(payment.creemOrderId) || shortenId(payment.id)}
														</span>
														{(payment.creemOrderId || payment.id) && (
															<Button
																variant="ghost"
																size="sm"
																className="h-5 w-5 p-0"
																onClick={() => copyToClipboard(payment.creemOrderId || payment.id)}
															>
																<Copy className="h-3 w-3" />
															</Button>
														)}
													</div>
												</td>
												<td className="p-3">
													<div className="min-w-0">
														<p
															className="font-medium text-xs truncate max-w-[160px]"
															title={payment.userEmail || payment.userId}
														>
															{payment.userEmail || payment.userId}
														</p>
														{payment.userFullName && (
															<p className="text-[10px] text-muted-foreground truncate max-w-[160px]">
																{payment.userFullName}
															</p>
														)}
													</div>
												</td>
												<td className="p-3">
													<p className="font-medium">{payment.planName}</p>
													<p className="text-xs text-muted-foreground">
														{payment.durationType === "yearly"
															? locale === "zh"
																? "年付"
																: "Yearly"
															: locale === "zh"
																? "月付"
																: "Monthly"}
													</p>
												</td>
												<td className="p-3 text-right font-medium tabular-nums">
													${Number(payment.amount).toFixed(2)}
												</td>
												<td className="p-3 text-center">{getStatusBadge(payment.status)}</td>
												<td className="p-3">
													{payment.creemSubscriptionId ? (
														<div className="flex items-center gap-1">
															<span className="font-mono text-xs text-blue-600 dark:text-blue-400">
																{shortenId(payment.creemSubscriptionId)}
															</span>
															<Button
																variant="ghost"
																size="sm"
																className="h-5 w-5 p-0"
																onClick={() => copyToClipboard(payment.creemSubscriptionId ?? "")}
															>
																<Copy className="h-3 w-3" />
															</Button>
														</div>
													) : (
														<span className="text-xs text-muted-foreground">-</span>
													)}
												</td>
												<td className="p-3 text-muted-foreground whitespace-nowrap">
													{formatTime(payment.paidAt || payment.createdAt)}
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</div>

					{totalPages > 1 && (
						<div className="flex items-center justify-between mt-4 pt-4 border-t">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page <= 1}
							>
								<ChevronLeft className="h-4 w-4 mr-1" />
								{locale === "zh" ? "上一页" : "Previous"}
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
								{locale === "zh" ? "下一页" : "Next"}
								<ChevronRight className="h-4 w-4 ml-1" />
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function PaymentsSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-10 w-48 mb-2" />
			<Skeleton className="h-5 w-64 mb-6" />
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32 mb-2" />
					<Skeleton className="h-4 w-48" />
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
