"use client";

import {
	AlertTriangle,
	ChevronLeft,
	ChevronRight,
	Crown,
	Loader2,
	Search,
	Shield,
	Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { trpc } from "@/server/client";

const PAGE_SIZE = 20;

const roleOptions = [
	{ value: 0, label: "regularUser", icon: Users },
	{ value: 1, label: "admin", icon: Shield },
	{ value: 2, label: "superAdmin", icon: Crown },
];

export default function AdminPermissionsPage() {
	const t = useTranslations("admin.permissions");
	const { user: currentUser } = useAuth();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [roleChangeDialog, setRoleChangeDialog] = useState<{
		open: boolean;
		userId: string;
		userName: string;
		newLevel: number;
		currentLevel: number;
	}>({ open: false, userId: "", userName: "", newLevel: 0, currentLevel: 0 });

	const { data, isLoading, refetch } = trpc.adminUsers.getUsers.useQuery({
		page,
		limit: PAGE_SIZE,
		search: search || undefined,
	});

	const updateRole = trpc.adminUsers.updateUserRole.useMutation({
		onSuccess: () => {
			toast.success(t("success"));
			setRoleChangeDialog({ open: false, userId: "", userName: "", newLevel: 0, currentLevel: 0 });
			refetch();
		},
		onError: (error) => toast.error(error.message),
	});

	const handleSearch = () => {
		setSearch(searchInput);
		setPage(1);
	};

	const handleRoleChange = (
		userId: string,
		userName: string,
		newLevel: number,
		currentLevel: number,
	) => {
		setRoleChangeDialog({ open: true, userId, userName, newLevel, currentLevel });
	};

	const confirmRoleChange = () => {
		updateRole.mutate({ userId: roleChangeDialog.userId, adminLevel: roleChangeDialog.newLevel });
	};

	if (!currentUser?.isAdmin || (currentUser.adminLevel ?? 0) < 2) {
		return (
			<div className="flex items-center justify-center h-[60vh]">
				<Card className="w-full max-w-md">
					<CardContent className="flex flex-col items-center justify-center py-16 gap-4">
						<AlertTriangle className="h-12 w-12 text-orange-500" />
						<div className="text-center">
							<p className="text-lg font-medium">{t("insufficientPermissions")}</p>
							<p className="text-sm text-muted-foreground mt-1">{t("superAdminOnly")}</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isLoading && !data) {
		return <PermissionsSkeleton />;
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
								<Crown className="h-5 w-5" />
								{t("userPermissions")}
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
							<div className="col-span-3">{t("currentRole")}</div>
							<div className="col-span-3">{t("permissionLevel")}</div>
							<div className="col-span-2 text-right">{t("actions")}</div>
						</div>
						<div className="divide-y">
							{users.length === 0 ? (
								<div className="p-8 text-center text-muted-foreground">{t("noUsers")}</div>
							) : (
								users.map(
									(user: {
										id: string;
										adminLevel: number | null;
										isAdmin: boolean | null;
										fullName: string | null;
										email: string;
									}) => {
										const currentLevel = user.adminLevel ?? 0;
										const isSelf = user.id === currentUser?.id;
										return (
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
												<div className="col-span-3">
													<Badge variant={user.isAdmin ? "default" : "secondary"} className="gap-1">
														{currentLevel >= 2 ? (
															<Crown className="h-3 w-3" />
														) : currentLevel === 1 ? (
															<Shield className="h-3 w-3" />
														) : (
															<Users className="h-3 w-3" />
														)}
														{t(
															roleOptions.find((r) => r.value === currentLevel)?.label ??
																"regularUser",
														)}
													</Badge>
												</div>
												<div className="col-span-3">
													<div className="flex items-center gap-2">
														<div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
															<div
																className={cn(
																	"h-full transition-all",
																	currentLevel >= 2
																		? "bg-purple-500 w-full"
																		: currentLevel === 1
																			? "bg-blue-500 w-1/2"
																			: "bg-gray-300 w-0",
																)}
															/>
														</div>
														<span className="text-xs text-muted-foreground w-8">
															Lv.{currentLevel}
														</span>
													</div>
												</div>
												<div className="col-span-2 flex justify-end">
													{isSelf ? (
														<Badge variant="outline" className="text-xs">
															{t("currentUser")}
														</Badge>
													) : (
														<Select
															value={String(currentLevel)}
															onValueChange={(v) =>
																handleRoleChange(
																	user.id,
																	user.fullName || user.email || "",
																	Number(v),
																	currentLevel,
																)
															}
														>
															<SelectTrigger className="w-[140px] h-8">
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																{roleOptions.map((opt) => (
																	<SelectItem key={opt.value} value={String(opt.value)}>
																		<span className="flex items-center gap-2">
																			<opt.icon className="h-3 w-3" />
																			{t(opt.label)}
																		</span>
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													)}
												</div>
											</div>
										);
									},
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

			{/* Role Change Confirmation Dialog */}
			<AlertDialog
				open={roleChangeDialog.open}
				onOpenChange={(open) => setRoleChangeDialog({ ...roleChangeDialog, open })}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("confirmRoleChange")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("roleChangeDesc", {
								name: roleChangeDialog.userName,
								from: t(
									roleOptions.find((r) => r.value === roleChangeDialog.currentLevel)?.label ||
										"regularUser",
								),
								to: t(
									roleOptions.find((r) => r.value === roleChangeDialog.newLevel)?.label ||
										"regularUser",
								),
							})}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={updateRole.isPending}>
							{t("confirmCancel", { defaultValue: "Cancel" })}
						</AlertDialogCancel>
						<AlertDialogAction onClick={confirmRoleChange} disabled={updateRole.isPending}>
							{updateRole.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{t("confirmAdjust", { defaultValue: "Confirm" })}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function PermissionsSkeleton() {
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
