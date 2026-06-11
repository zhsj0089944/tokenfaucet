"use client";

import { format } from "date-fns";
import { Gift, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { User } from "@/drizzle/schemas";
import { trpc } from "@/server/client";

export default function InvitationsPage() {
	const t = useTranslations("admin.invitations");
	const [page, _setPage] = useState(1);
	const limit = 20;

	const { data: invitations } = trpc.adminUsers.getUsers.useQuery({
		page,
		limit,
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
				<p className="text-muted-foreground mt-1">{t("subtitle")}</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-muted-foreground">总用户数</p>
								<p className="text-2xl font-bold">{invitations?.total || 0}</p>
							</div>
							<Users className="h-8 w-8 text-blue-500/20" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-muted-foreground">邀请奖励</p>
								<p className="text-2xl font-bold text-green-600">2,500 积分</p>
								<p className="text-xs text-muted-foreground">每人（邀请人 + 被邀请人）</p>
							</div>
							<Gift className="h-8 w-8 text-green-500/20" />
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>用户列表</CardTitle>
					<CardDescription>查看用户注册信息</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>邮箱</TableHead>
								<TableHead>用户名</TableHead>
								<TableHead>注册时间</TableHead>
								<TableHead>状态</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{invitations?.users.map((user: User) => (
								<TableRow key={user.id}>
									<TableCell>{user.email}</TableCell>
									<TableCell>{user.fullName || "—"}</TableCell>
									<TableCell>
										{user.createdAt ? format(new Date(user.createdAt), "yyyy-MM-dd HH:mm") : "—"}
									</TableCell>
									<TableCell>{user.isActive ? "活跃" : "禁用"}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
