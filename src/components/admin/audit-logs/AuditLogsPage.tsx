"use client";

import { FileText, RefreshCw, Search, Shield } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AuditModule, AuditSeverity } from "@/drizzle/schemas/audit-logs";
import { trpc } from "@/server/client";

interface AuditLogsPageProps {
	className?: string;
}

// 严重程度颜色映射
const severityColors: Record<string, string> = {
	LOW: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
	INFO: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
	WARNING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
	HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
	CRITICAL: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

// 操作类型中文映射
const actionLabels: Record<string, string> = {
	"user.create": "创建用户",
	"user.update": "更新用户",
	"user.delete": "删除用户",
	"user.login": "用户登录",
	"user.logout": "用户登出",
	"user.activate": "激活用户",
	"user.deactivate": "禁用用户",
	"permission.grant": "授予权限",
	"permission.revoke": "撤销权限",
	"role.assign": "分配角色",
	"role.remove": "移除角色",
	"admin.promote": "晋升管理员",
	"admin.demote": "降级管理员",
	"system.config.update": "系统配置更新",
	"system.maintenance": "系统维护",
	"data.export": "数据导出",
	"data.import": "数据导入",
	"organization.create": "创建组织",
	"organization.update": "更新组织",
	"organization.delete": "删除组织",
	"organization.member.add": "添加成员",
	"organization.member.remove": "移除成员",
	"payment.create": "创建支付",
	"payment.refund": "退款",
	"subscription.create": "创建订阅",
	"subscription.cancel": "取消订阅",
};

export function AuditLogsPage({ className }: AuditLogsPageProps) {
	const [activeTab, setActiveTab] = useState("logs");

	return (
		<div className={className}>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold">审计日志</h1>
					<p className="text-muted-foreground">查看所有管理操作的审计记录</p>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="logs" className="flex items-center gap-2">
						<FileText className="h-4 w-4" />
						日志列表
					</TabsTrigger>
					<TabsTrigger value="stats" className="flex items-center gap-2">
						<Shield className="h-4 w-4" />
						统计概览
					</TabsTrigger>
				</TabsList>

				<TabsContent value="logs">
					<AuditLogsList />
				</TabsContent>

				<TabsContent value="stats">
					<AuditStatsOverview />
				</TabsContent>
			</Tabs>
		</div>
	);
}

// 审计日志列表组件
function AuditLogsList() {
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [severity, setSeverity] = useState<string>("all");
	const [module, setModule] = useState<string>("all");
	const [success, setSuccess] = useState<string>("all");

	const limit = 20;

	const { data, isLoading, refetch, isFetching } = trpc.auditLogs.getAuditLogs.useQuery({
		page,
		limit,
		search: search || undefined,
		severity: severity !== "all" ? (severity as AuditSeverity) : undefined,
		module: module !== "all" ? (module as AuditModule) : undefined,
		success: success !== "all" ? success === "true" : undefined,
	});

	const handleSearch = (value: string) => {
		setSearch(value);
		setPage(1);
	};

	return (
		<div className="space-y-4">
			{/* 过滤器 */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-wrap items-center gap-4">
						<div className="relative flex-1 min-w-[200px]">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="搜索用户邮箱或操作..."
								value={search}
								onChange={(e) => handleSearch(e.target.value)}
								className="pl-10"
							/>
						</div>

						<Select
							value={severity}
							onValueChange={(v) => {
								setSeverity(v);
								setPage(1);
							}}
						>
							<SelectTrigger className="w-32">
								<SelectValue placeholder="严重程度" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部</SelectItem>
								<SelectItem value="LOW">低</SelectItem>
								<SelectItem value="INFO">信息</SelectItem>
								<SelectItem value="WARNING">警告</SelectItem>
								<SelectItem value="HIGH">高</SelectItem>
								<SelectItem value="CRITICAL">严重</SelectItem>
							</SelectContent>
						</Select>

						<Select
							value={module}
							onValueChange={(v) => {
								setModule(v);
								setPage(1);
							}}
						>
							<SelectTrigger className="w-36">
								<SelectValue placeholder="模块" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部模块</SelectItem>
								<SelectItem value="auth">认证</SelectItem>
								<SelectItem value="user_management">用户管理</SelectItem>
								<SelectItem value="permission">权限</SelectItem>
								<SelectItem value="payment">支付</SelectItem>
								<SelectItem value="system">系统</SelectItem>
								<SelectItem value="organization">组织</SelectItem>
								<SelectItem value="api">API</SelectItem>
								<SelectItem value="webhook">Webhook</SelectItem>
							</SelectContent>
						</Select>

						<Select
							value={success}
							onValueChange={(v) => {
								setSuccess(v);
								setPage(1);
							}}
						>
							<SelectTrigger className="w-28">
								<SelectValue placeholder="结果" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部</SelectItem>
								<SelectItem value="true">成功</SelectItem>
								<SelectItem value="false">失败</SelectItem>
							</SelectContent>
						</Select>

						<Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
							<RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
							刷新
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* 日志列表 */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>审计日志</span>
						<div className="text-sm text-muted-foreground font-normal">
							共 {data?.total || 0} 条记录
						</div>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="py-12 text-center">
							<RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
							<p className="text-muted-foreground">加载中...</p>
						</div>
					) : data?.logs.length === 0 ? (
						<div className="py-12 text-center">
							<FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
							<p className="text-muted-foreground">暂无审计日志</p>
						</div>
					) : (
						<>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>时间</TableHead>
										<TableHead>用户</TableHead>
										<TableHead>操作</TableHead>
										<TableHead>模块</TableHead>
										<TableHead>严重程度</TableHead>
										<TableHead>状态</TableHead>
										<TableHead>详情</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data?.logs.map((log) => (
										<TableRow key={log.id} className="hover:bg-muted/50">
											<TableCell className="whitespace-nowrap text-sm">
												{new Date(log.createdAt).toLocaleString()}
											</TableCell>
											<TableCell>
												<div className="text-sm">
													<div className="font-medium">{log.userEmail || log.userId}</div>
												</div>
											</TableCell>
											<TableCell>
												<span className="text-sm">{actionLabels[log.action] || log.action}</span>
											</TableCell>
											<TableCell>
												<Badge variant="outline" className="text-xs">
													{log.module || "-"}
												</Badge>
											</TableCell>
											<TableCell>
												<Badge
													className={`text-xs ${severityColors[log.severity || "INFO"] || severityColors.INFO}`}
												>
													{log.severity}
												</Badge>
											</TableCell>
											<TableCell>
												{log.success ? (
													<Badge variant="default" className="bg-green-500 text-white text-xs">
														成功
													</Badge>
												) : (
													<Badge variant="destructive" className="text-xs">
														失败
													</Badge>
												)}
											</TableCell>
											<TableCell>
												{log.details ? (
													<Button variant="ghost" size="sm" className="h-8 px-2">
														<span className="text-xs text-muted-foreground">查看</span>
													</Button>
												) : (
													<span className="text-xs text-muted-foreground">-</span>
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>

							{/* 分页 */}
							{data && data.totalPages > 1 && (
								<div className="flex items-center justify-between mt-4">
									<div className="text-sm text-muted-foreground">
										第 {page} 页，共 {data.totalPages} 页
									</div>
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setPage((p) => Math.max(1, p - 1))}
											disabled={page <= 1}
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
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

// 统计概览组件
function AuditStatsOverview() {
	const { data, isLoading, refetch } = trpc.auditLogs.getAuditOverview.useQuery();

	if (isLoading) {
		return (
			<Card>
				<CardContent className="py-12 text-center">
					<RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
					<p className="text-muted-foreground">加载统计数据...</p>
				</CardContent>
			</Card>
		);
	}

	const summary = data?.overview;

	return (
		<div className="space-y-6">
			{/* 概览卡片 */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">总日志数</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{summary?.totalLogs || 0}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">今日日志</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">{summary?.todayLogs || 0}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">本周日志</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-blue-600">{summary?.weekLogs || 0}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">失败操作</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">{summary?.failedActions || 0}</div>
					</CardContent>
				</Card>
			</div>

			{/* 关键操作记录 */}
			<Card>
				<CardHeader>
					<CardTitle>最近关键操作</CardTitle>
				</CardHeader>
				<CardContent>
					{data?.recentCriticalLogs && data.recentCriticalLogs.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>时间</TableHead>
									<TableHead>用户</TableHead>
									<TableHead>操作</TableHead>
									<TableHead>严重程度</TableHead>
									<TableHead>状态</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.recentCriticalLogs.map((log) => (
									<TableRow key={log.id}>
										<TableCell className="whitespace-nowrap text-sm">
											{new Date(log.createdAt).toLocaleString()}
										</TableCell>
										<TableCell className="text-sm">{log.userEmail || log.userId}</TableCell>
										<TableCell className="text-sm">
											{actionLabels[log.action] || log.action}
										</TableCell>
										<TableCell>
											<Badge className={`text-xs ${severityColors[log.severity || "INFO"]}`}>
												{log.severity}
											</Badge>
										</TableCell>
										<TableCell>
											{log.success ? (
												<Badge variant="default" className="bg-green-500 text-white text-xs">
													成功
												</Badge>
											) : (
												<Badge variant="destructive" className="text-xs">
													失败
												</Badge>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<div className="py-8 text-center text-muted-foreground">暂无关键操作记录</div>
					)}
				</CardContent>
			</Card>

			{/* 操作按钮 */}
			<div className="flex justify-end gap-2">
				<Button variant="outline" onClick={() => refetch()}>
					<RefreshCw className="h-4 w-4 mr-2" />
					刷新数据
				</Button>
			</div>
		</div>
	);
}

export default AuditLogsPage;
