"use client";

import { Key } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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

export default function ApiKeysPage() {
	const t = useTranslations("admin.apiKeys");
	const [page, _setPage] = useState(1);
	const limit = 20;

	const { data: usersData } = trpc.adminUsers.getUsers.useQuery({
		page,
		limit,
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
				<p className="text-muted-foreground mt-1">{t("subtitle")}</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{t("title")}</CardTitle>
					<CardDescription>{t("subtitle")}</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>用户</TableHead>
								<TableHead>密钥前缀</TableHead>
								<TableHead>权限范围</TableHead>
								<TableHead>使用量</TableHead>
								<TableHead>最后使用</TableHead>
								<TableHead>状态</TableHead>
								<TableHead>过期时间</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{usersData?.users.map((user: User) => (
								<TableRow key={user.id}>
									<TableCell>
										<p className="text-sm">{user.email}</p>
										<p className="text-xs text-muted-foreground">{user.fullName}</p>
									</TableCell>
									<TableCell>
										<Badge variant="outline">
											<Key className="h-3 w-3 mr-1" />
											查看数据库
										</Badge>
									</TableCell>
									<TableCell>
										<Badge variant="secondary">ai:chat</Badge>
									</TableCell>
									<TableCell>
										<p className="text-sm">—</p>
									</TableCell>
									<TableCell className="text-xs text-muted-foreground">—</TableCell>
									<TableCell>
										<Badge variant="outline">N/A</Badge>
									</TableCell>
									<TableCell className="text-xs text-muted-foreground">—</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
