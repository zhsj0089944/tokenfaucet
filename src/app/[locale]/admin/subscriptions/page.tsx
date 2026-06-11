"use client";

import { format } from "date-fns";
import { AlertCircle, Search, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/server/client";

interface AdminSubscription {
	id: string;
	userEmail: string | null;
	userFullName: string | null;
	planName: string | null;
	planNameZh: string | null;
	durationType: string | null;
	status: string;
	purchaseAmount: string;
	currency: string | null;
	autoRenew: boolean | null;
	endDate: string | Date | null;
}

export default function SubscriptionsPage() {
	const t = useTranslations("admin.subscriptions");
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState<string>();
	const [search, setSearch] = useState("");
	const limit = 20;

	const { data, refetch } = trpc.adminSubscriptions.getAllSubscriptions.useQuery({
		page,
		limit,
		status: status as "active" | "cancelled" | "expired" | undefined,
		search: search || undefined,
	});

	const { data: stats } = trpc.adminSubscriptions.getSubscriptionStats.useQuery();

	const cancelMutation = trpc.adminSubscriptions.cancelSubscription.useMutation({
		onSuccess: () => {
			toast.success(t("cancelSuccess"));
			refetch();
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const extendMutation = trpc.adminSubscriptions.extendSubscription.useMutation({
		onSuccess: () => {
			toast.success(t("extendSuccess"));
			refetch();
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const statusIcon = (status: string) => {
		switch (status) {
			case "active":
				return <ShieldCheck className="h-4 w-4 text-green-500" />;
			case "cancelled":
				return <ShieldAlert className="h-4 w-4 text-red-500" />;
			case "expired":
				return <AlertCircle className="h-4 w-4 text-yellow-500" />;
			default:
				return <Shield className="h-4 w-4 text-muted-foreground" />;
		}
	};

	const statusLabel = (status: string) => {
		switch (status) {
			case "active":
				return t("active");
			case "cancelled":
				return t("cancelled");
			case "expired":
				return t("expired");
			default:
				return status;
		}
	};

	const statusVariant = (status: string) => {
		switch (status) {
			case "active":
				return "default";
			case "cancelled":
				return "destructive";
			case "expired":
				return "secondary";
			default:
				return "outline";
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
				<p className="text-muted-foreground mt-1">{t("subtitle")}</p>
			</div>

			{/* 统计卡片 */}
			{stats && (
				<div className="grid gap-4 md:grid-cols-4">
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-xs text-muted-foreground">{t("active")}</p>
									<p className="text-2xl font-bold text-green-600">{stats.active}</p>
								</div>
								<ShieldCheck className="h-8 w-8 text-green-500/20" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-xs text-muted-foreground">{t("autoRenew")}</p>
									<p className="text-2xl font-bold text-blue-600">{stats.autoRenew}</p>
								</div>
								<Shield className="h-8 w-8 text-blue-500/20" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-xs text-muted-foreground">{t("cancelled")}</p>
									<p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
								</div>
								<ShieldAlert className="h-8 w-8 text-red-500/20" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-xs text-muted-foreground">{t("expired")}</p>
									<p className="text-2xl font-bold text-yellow-600">{stats.expired}</p>
								</div>
								<AlertCircle className="h-8 w-8 text-yellow-500/20" />
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			<Tabs defaultValue="all">
				<div className="flex items-center justify-between">
					<TabsList>
						<TabsTrigger value="all" onClick={() => setStatus(undefined)}>
							{t("all")}
						</TabsTrigger>
						<TabsTrigger value="active" onClick={() => setStatus("active")}>
							{t("active")}
						</TabsTrigger>
						<TabsTrigger value="cancelled" onClick={() => setStatus("cancelled")}>
							{t("cancelled")}
						</TabsTrigger>
						<TabsTrigger value="expired" onClick={() => setStatus("expired")}>
							{t("expired")}
						</TabsTrigger>
					</TabsList>
					<div className="flex items-center gap-2">
						<div className="relative">
							<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder={t("searchPlaceholder")}
								className="pl-8 w-64"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
					</div>
				</div>

				<TabsContent value="all" className="mt-4">
					<Card>
						<CardHeader>
							<CardTitle>{t("subscriptionList")}</CardTitle>
							<CardDescription>{t("subtitle")}</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("user")}</TableHead>
										<TableHead>{t("plan")}</TableHead>
										<TableHead>{t("status")}</TableHead>
										<TableHead>{t("amount")}</TableHead>
										<TableHead>{t("autoRenew")}</TableHead>
										<TableHead>{t("endDate")}</TableHead>
										<TableHead>{t("actions")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data?.subscriptions.map((sub: AdminSubscription) => (
										<TableRow key={sub.id}>
											<TableCell>
												<div>
													<p className="font-medium">{sub.userFullName || sub.userEmail}</p>
													<p className="text-xs text-muted-foreground">{sub.userEmail}</p>
												</div>
											</TableCell>
											<TableCell>
												<p className="text-sm">{sub.planNameZh || sub.planName}</p>
												<p className="text-xs text-muted-foreground">{sub.durationType}</p>
											</TableCell>
											<TableCell>
												<Badge variant={statusVariant(sub.status)}>
													<span className="flex items-center gap-1">
														{statusIcon(sub.status)}
														{statusLabel(sub.status)}
													</span>
												</Badge>
											</TableCell>
											<TableCell>
												<p className="text-sm font-medium">
													${Number(sub.purchaseAmount).toFixed(2)}
												</p>
												<p className="text-xs text-muted-foreground">{sub.currency}</p>
											</TableCell>
											<TableCell>
												{sub.autoRenew ? (
													<Badge variant="outline" className="text-green-600">
														开启
													</Badge>
												) : (
													<Badge variant="outline">关闭</Badge>
												)}
											</TableCell>
											<TableCell>
												<p className="text-sm">
													{sub.endDate ? format(new Date(sub.endDate), "yyyy-MM-dd") : "—"}
												</p>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													{sub.status === "active" && (
														<>
															<Button
																variant="outline"
																size="sm"
																onClick={() => extendMutation.mutate({ id: sub.id, days: 30 })}
																disabled={extendMutation.isPending}
															>
																延长30天
															</Button>
															<Button
																variant="destructive"
																size="sm"
																onClick={() => {
																	if (confirm("确定取消该订阅？")) {
																		cancelMutation.mutate({ id: sub.id });
																	}
																}}
																disabled={cancelMutation.isPending}
															>
																取消
															</Button>
														</>
													)}
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>

							{/* 分页 */}
							{data && data.pagination.totalPages > 1 && (
								<div className="flex items-center justify-between mt-4">
									<p className="text-sm text-muted-foreground">
										共 {data.pagination.total} 条，第 {data.pagination.page} /{" "}
										{data.pagination.totalPages} 页
									</p>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setPage((p) => Math.max(1, p - 1))}
											disabled={page === 1}
										>
											上一页
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setPage((p) => p + 1)}
											disabled={page >= data.pagination.totalPages}
										>
											下一页
										</Button>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
