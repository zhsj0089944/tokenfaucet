"use client";

import { format } from "date-fns";
import { CheckCircle, Search, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/server/client";

export default function TtsLogsPage() {
	const t = useTranslations("admin.ttsLogs");
	const [page, setPage] = useState(1);
	const [isSuccess, setIsSuccess] = useState<boolean>();
	const [search, setSearch] = useState("");
	const limit = 50;

	const { data } = trpc.adminTts.getTtsLogs.useQuery({
		page,
		limit,
		isSuccess,
		search: search || undefined,
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
							<CardTitle>{t("title")}</CardTitle>
							<CardDescription>{t("subtitle")}</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<div className="relative">
								<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="搜索用户或音色..."
									className="pl-8 w-64"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
								/>
							</div>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="all">
						<TabsList className="mb-4">
							<TabsTrigger value="all" onClick={() => setIsSuccess(undefined)}>
								全部
							</TabsTrigger>
							<TabsTrigger value="success" onClick={() => setIsSuccess(true)}>
								成功
							</TabsTrigger>
							<TabsTrigger value="failed" onClick={() => setIsSuccess(false)}>
								失败
							</TabsTrigger>
						</TabsList>

						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>用户</TableHead>
									<TableHead>模型</TableHead>
									<TableHead>音色</TableHead>
									<TableHead>文本长度</TableHead>
									<TableHead>状态</TableHead>
									<TableHead>IP 地址</TableHead>
									<TableHead>时间</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data?.logs.map((log) => (
									<TableRow key={log.id}>
										<TableCell>
											<p className="text-sm">{log.userEmail}</p>
										</TableCell>
										<TableCell>
											<Badge variant="outline">{log.model}</Badge>
										</TableCell>
										<TableCell>
											<p className="text-sm">{log.voiceId || "—"}</p>
											<p className="text-xs text-muted-foreground">{log.voiceType}</p>
										</TableCell>
										<TableCell>{log.textLength || 0} 字</TableCell>
										<TableCell>
											{log.isSuccess ? (
												<Badge variant="default" className="text-green-600">
													<CheckCircle className="h-3 w-3 mr-1" />
													成功
												</Badge>
											) : (
												<Badge variant="destructive">
													<XCircle className="h-3 w-3 mr-1" />
													失败
												</Badge>
											)}
										</TableCell>
										<TableCell className="text-xs text-muted-foreground">
											{log.ipAddress || "—"}
										</TableCell>
										<TableCell className="text-xs">
											{log.createdAt ? format(new Date(log.createdAt), "yyyy-MM-dd HH:mm") : "—"}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>

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
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
