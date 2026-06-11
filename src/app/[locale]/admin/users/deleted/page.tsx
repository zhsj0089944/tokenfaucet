"use client";

import { format } from "date-fns";
import { Search, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
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
import { trpc } from "@/server/client";

export default function DeletedUsersPage() {
	const t = useTranslations("admin.deletedUsers");
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const limit = 20;

	const { data, refetch } = trpc.adminUsers.getDeletedUsers.useQuery({
		page,
		limit,
		search: search || undefined,
	});

	const restoreMutation = trpc.adminUsers.restoreUser.useMutation({
		onSuccess: () => {
			toast.success(t("restoreSuccess"));
			refetch();
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
				<p className="text-muted-foreground mt-1">{t("subtitle")}</p>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>已删除用户列表</CardTitle>
							<CardDescription>软删除的用户记录</CardDescription>
						</div>
						<div className="relative">
							<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="搜索用户..."
								className="pl-8 w-64"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>邮箱</TableHead>
								<TableHead>用户名</TableHead>
								<TableHead>删除时间</TableHead>
								<TableHead>操作</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data?.users.map(
								(user: {
									id: string;
									email: string;
									fullName: string | null;
									deletedAt: Date | null;
								}) => (
									<TableRow key={user.id}>
										<TableCell>{user.email}</TableCell>
										<TableCell>{user.fullName || "—"}</TableCell>
										<TableCell>
											{user.deletedAt ? format(new Date(user.deletedAt), "yyyy-MM-dd HH:mm") : "—"}
										</TableCell>
										<TableCell>
											<Button
												variant="outline"
												size="sm"
												onClick={() => restoreMutation.mutate({ id: user.id })}
												disabled={restoreMutation.isPending}
											>
												<UserPlus className="h-4 w-4 mr-1" />
												恢复
											</Button>
										</TableCell>
									</TableRow>
								),
							)}
						</TableBody>
					</Table>

					{data && data.totalPages > 1 && (
						<div className="flex items-center justify-between mt-4">
							<p className="text-sm text-muted-foreground">
								共 {data.total} 条，第 {data.page} / {data.totalPages} 页
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
									disabled={page >= data.totalPages}
								>
									下一页
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
