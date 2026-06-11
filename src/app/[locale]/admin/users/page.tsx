"use client";

import {
	Ban,
	ChevronLeft,
	ChevronRight,
	Crown,
	Loader2,
	MoreHorizontal,
	RotateCcw,
	Search,
	UserCheck,
	Users,
	UserX,
	X,
	Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { trpc } from "@/server/client";

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
	const t = useTranslations("admin.users");
	const locale = useLocale();
	const { user: currentUser } = useAuth();
	const dailyId = useId();
	const monthlyId = useId();
	const totalId = useId();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");

	const [extendDialog, setExtendDialog] = useState<{
		open: boolean;
		userId: string;
		userName: string;
	}>({ open: false, userId: "", userName: "" });
	const [adjustDialog, setAdjustDialog] = useState<{
		open: boolean;
		userId: string;
		userName: string;
	}>({ open: false, userId: "", userName: "" });
	const [_banDialog, _setBanDialog] = useState<{ open: boolean; userId: string; userName: string }>(
		{
			open: false,
			userId: "",
			userName: "",
		},
	);
	const [cancelDialog, setCancelDialog] = useState<{
		open: boolean;
		userId: string;
		userName: string;
	}>({ open: false, userId: "", userName: "" });

	const [extendDays, setExtendDays] = useState(30);
	const [pointsAmount, setPointsAmount] = useState(1000);
	const [pointsTarget, setPointsTarget] = useState<"daily" | "monthly" | "total">("daily");
	const [adjustReason, setAdjustReason] = useState("");

	const isSuperAdmin = (currentUser?.adminLevel ?? 0) >= 2;

	const { data, isLoading, refetch } = trpc.adminUsers.getUsers.useQuery({
		page,
		limit: PAGE_SIZE,
		search: search || undefined,
	});

	const { data: userPoints } = trpc.points.getUserPoints.useQuery(
		{ userId: adjustDialog.userId },
		{ enabled: adjustDialog.open },
	);

	const toggleStatus = trpc.adminUsers.toggleUserStatus.useMutation({
		onSuccess: () => {
			toast.success(t("success"));
			refetch();
		},
		onError: (error) => toast.error(error.message),
	});

	const extendMembership = trpc.adminUsers.adminExtendMembership.useMutation({
		onSuccess: () => {
			toast.success(t("extendSuccess"));
			setExtendDialog({ open: false, userId: "", userName: "" });
			setExtendDays(30);
			refetch();
		},
		onError: (error) => toast.error(error.message),
	});

	const adjustPointsMutation = trpc.points.adjustPoints.useMutation({
		onSuccess: () => {
			toast.success(t("adjustSuccess"));
			setAdjustDialog({ open: false, userId: "", userName: "" });
			setPointsAmount(1000);
			setAdjustReason("");
			refetch();
		},
		onError: (error) => toast.error(error.message),
	});

	const cancelMembershipMutation = trpc.adminUsers.adminCancelMembership.useMutation({
		onSuccess: () => {
			toast.success(locale === "zh" ? "会员已取消" : "Membership cancelled");
			setCancelDialog({ open: false, userId: "", userName: "" });
			refetch();
		},
		onError: (error) => toast.error(error.message),
	});

	const handleSearch = () => {
		setSearch(searchInput);
		setPage(1);
	};

	const handleToggleStatus = (userId: string, currentStatus: boolean) => {
		toggleStatus.mutate({ userId, isActive: !currentStatus });
	};

	if (isLoading && !data) {
		return <UsersSkeleton />;
	}

	const users = data?.users || [];
	const totalPages = data?.totalPages || 1;
	const total = data?.total || 0;

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
								<Users className="h-5 w-5" />
								{t("userList")}
							</CardTitle>
							<CardDescription>{t("pagination", { total, page, totalPages })}</CardDescription>
						</div>
						<div className="flex gap-2">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder={t("searchPlaceholder")}
									value={searchInput}
									onChange={(e) => setSearchInput(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && handleSearch()}
									className="pl-9 w-64"
								/>
							</div>
							<Button onClick={handleSearch}>{t("search")}</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="rounded-lg border">
						<div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-muted-foreground border-b bg-muted/50">
							<div className="col-span-4">{t("userInfo")}</div>
							<div className="col-span-2">{t("role")}</div>
							<div className="col-span-2">{t("status")}</div>
							<div className="col-span-2">{t("registered")}</div>
							<div className="col-span-2 text-right">{t("actions")}</div>
						</div>
						<div className="divide-y">
							{users.length === 0 ? (
								<div className="p-8 text-center text-muted-foreground">{t("noUsers")}</div>
							) : (
								users.map(
									(user: {
										id: string;
										isAdmin: boolean | null;
										adminLevel: number | null;
										fullName: string | null;
										email: string;
										isActive: boolean | null;
										createdAt: Date | null;
									}) => (
										<div
											key={user.id}
											className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors"
										>
											<div className="col-span-4 flex items-center gap-3">
												<div
													className={cn(
														"h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium",
														user.isAdmin
															? "bg-purple-500/10 text-purple-500"
															: "bg-primary/10 text-primary",
													)}
												>
													{user.fullName?.charAt(0).toUpperCase() ||
														user.email?.charAt(0).toUpperCase() ||
														"U"}
												</div>
												<div className="min-w-0">
													<p className="text-sm font-medium truncate">
														{user.fullName || t("noName")}
													</p>
													<p className="text-xs text-muted-foreground truncate">{user.email}</p>
												</div>
											</div>
											<div className="col-span-2">
												{user.isAdmin ? (
													<Badge variant="outline" className="gap-1">
														<Crown className="h-3 w-3" />
														{(user.adminLevel ?? 0) >= 2 ? t("superAdmin") : t("admin")}
													</Badge>
												) : (
													<Badge variant="secondary" className="gap-1">
														<Users className="h-3 w-3" />
														{t("regularUser")}
													</Badge>
												)}
											</div>
											<div className="col-span-2">
												<Badge variant={user.isActive ? "default" : "secondary"} className="gap-1">
													{user.isActive ? (
														<UserCheck className="h-3 w-3" />
													) : (
														<UserX className="h-3 w-3" />
													)}
													{user.isActive ? t("active") : t("disabled")}
												</Badge>
											</div>
											<div className="col-span-2 text-sm text-muted-foreground">
												{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
											</div>
											<div className="col-span-2 flex justify-end gap-1">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
															onClick={() => handleToggleStatus(user.id, user.isActive ?? true)}
														>
															{user.isActive ? (
																<>
																	<Ban className="mr-2 h-4 w-4" />
																	{t("banUser")}
																</>
															) : (
																<>
																	<RotateCcw className="mr-2 h-4 w-4" />
																	{t("unbanUser")}
																</>
															)}
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																setExtendDialog({
																	open: true,
																	userId: user.id,
																	userName: user.fullName || user.email || "",
																})
															}
														>
															<Crown className="mr-2 h-4 w-4" />
															{t("extendMembership")}
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																setCancelDialog({
																	open: true,
																	userId: user.id,
																	userName: user.fullName || user.email || "",
																})
															}
														>
															<X className="mr-2 h-4 w-4" />
															{locale === "zh" ? "取消会员" : "Cancel Membership"}
														</DropdownMenuItem>
														{isSuperAdmin && (
															<DropdownMenuItem
																onClick={() =>
																	setAdjustDialog({
																		open: true,
																		userId: user.id,
																		userName: user.fullName || user.email || "",
																	})
																}
															>
																<Zap className="mr-2 h-4 w-4" />
																{t("adjustPoints")}
															</DropdownMenuItem>
														)}
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										</div>
									),
								)
							)}
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
								{t("prevPage")}
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
								{t("nextPage")}
								<ChevronRight className="h-4 w-4 ml-1" />
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Extend Membership Dialog */}
			<Dialog
				open={extendDialog.open}
				onOpenChange={(open) => setExtendDialog({ ...extendDialog, open })}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("extendMembership")}</DialogTitle>
						<DialogDescription>
							{t("extendMembership")} - {extendDialog.userName}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>{t("membershipDays")}</Label>
							<Input
								type="number"
								min={1}
								max={3650}
								value={extendDays}
								onChange={(e) => setExtendDays(Number(e.target.value))}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setExtendDialog({ open: false, userId: "", userName: "" })}
						>
							{t("confirmCancel")}
						</Button>
						<Button
							onClick={() =>
								extendMembership.mutate({ userId: extendDialog.userId, days: extendDays })
							}
							disabled={extendMembership.isPending}
						>
							{extendMembership.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{t("confirmExtend")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Adjust Points Dialog */}
			<Dialog
				open={adjustDialog.open}
				onOpenChange={(open) => setAdjustDialog({ ...adjustDialog, open })}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("adjustPoints")}</DialogTitle>
						<DialogDescription>
							{t("adjustPoints")} - {adjustDialog.userName}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						{userPoints && (
							<div className="p-3 rounded-lg bg-muted/50 text-sm">
								<span className="text-muted-foreground">{t("pointsBalance")}: </span>
								<span className="font-medium">{userPoints.totalBalance}</span>
								<span className="text-muted-foreground ml-2">
									({t("dailyPoints")}: {userPoints.dailyBalance}, {t("monthlyPoints")}:{" "}
									{userPoints.monthlyBalance})
								</span>
							</div>
						)}
						<div className="space-y-2">
							<Label>{t("pointsAmount")}</Label>
							<Input
								type="number"
								value={pointsAmount}
								onChange={(e) => setPointsAmount(Number(e.target.value))}
							/>
						</div>
						<div className="space-y-2">
							<Label>{t("pointsTarget")}</Label>
							<RadioGroup
								value={pointsTarget}
								onValueChange={(v) => setPointsTarget(v as typeof pointsTarget)}
							>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="daily" id={dailyId} />
									<Label htmlFor={dailyId} className="font-normal">
										{t("dailyPoints")}
									</Label>
								</div>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="monthly" id={monthlyId} />
									<Label htmlFor={monthlyId} className="font-normal">
										{t("monthlyPoints")}
									</Label>
								</div>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="total" id={totalId} />
									<Label htmlFor={totalId} className="font-normal">
										{t("totalPoints")}
									</Label>
								</div>
							</RadioGroup>
						</div>
						<div className="space-y-2">
							<Label>{t("adjustReason")}</Label>
							<Input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} />
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setAdjustDialog({ open: false, userId: "", userName: "" })}
						>
							{t("confirmCancel")}
						</Button>
						<Button
							onClick={() =>
								adjustPointsMutation.mutate({
									userId: adjustDialog.userId,
									amount: pointsAmount,
									targetType: pointsTarget,
									reason: adjustReason,
								})
							}
							disabled={adjustPointsMutation.isPending || !adjustReason.trim()}
						>
							{adjustPointsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{t("confirmAdjust")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Cancel Membership Dialog */}
			<Dialog
				open={cancelDialog.open}
				onOpenChange={(open) => setCancelDialog({ ...cancelDialog, open })}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{locale === "zh" ? "取消会员" : "Cancel Membership"}</DialogTitle>
						<DialogDescription>
							{locale === "zh"
								? `确定要取消 ${cancelDialog.userName} 的会员权限吗？`
								: `Are you sure you want to cancel ${cancelDialog.userName}'s membership?`}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setCancelDialog({ open: false, userId: "", userName: "" })}
						>
							{t("confirmCancel")}
						</Button>
						<Button
							variant="destructive"
							onClick={() =>
								cancelMembershipMutation.mutate({
									userId: cancelDialog.userId,
									reason: locale === "zh" ? "管理员手动取消" : "Admin manual cancellation",
								})
							}
							disabled={cancelMembershipMutation.isPending}
						>
							{cancelMembershipMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{locale === "zh" ? "确认取消" : "Confirm Cancel"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function UsersSkeleton() {
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
					<Skeleton className="h-10 w-full mb-4" />
					<div className="space-y-3">
						<Skeleton className="h-14 w-full" />
						<Skeleton className="h-14 w-full" />
						<Skeleton className="h-14 w-full" />
						<Skeleton className="h-14 w-full" />
						<Skeleton className="h-14 w-full" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
