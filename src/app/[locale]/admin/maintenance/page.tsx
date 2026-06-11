"use client";

import { Activity, Clock, Database, RefreshCw, Settings, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MaintenancePage() {
	const [running, setRunning] = useState<string | null>(null);

	const runTask = async (taskId: string, taskName: string) => {
		setRunning(taskId);
		try {
			const res = await fetch("/api/admin/maintenance/run", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ taskId }),
			});
			const data = await res.json();
			if (res.ok) {
				toast.success(`${taskName} 执行成功`);
			} else {
				toast.error(`${taskName} 执行失败: ${data.error}`);
			}
		} catch {
			toast.error(`${taskName} 执行出错`);
		} finally {
			setRunning(null);
		}
	};

	const tasks = [
		{
			id: "backup",
			name: "数据库备份",
			description: "手动触发数据库备份",
			icon: Database,
			color: "text-blue-500",
			bg: "bg-blue-500/10",
		},
		{
			id: "cleanup",
			name: "数据清理",
			description: "清理旧审计日志、配置历史、过期音色",
			icon: Trash2,
			color: "text-red-500",
			bg: "bg-red-500/10",
		},
		{
			id: "membership",
			name: "会员过期检查",
			description: "检查并更新过期会员状态",
			icon: Clock,
			color: "text-amber-500",
			bg: "bg-amber-500/10",
		},
		{
			id: "reminder",
			name: "到期提醒邮件",
			description: "发送会员到期提醒邮件",
			icon: Activity,
			color: "text-purple-500",
			bg: "bg-purple-500/10",
		},
	];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">维护任务</h1>
				<p className="text-muted-foreground mt-1">手动执行系统维护任务</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{tasks.map((task) => {
					const Icon = task.icon;
					return (
						<Card key={task.id}>
							<CardHeader>
								<div className="flex items-center gap-3">
									<div className={`p-2 rounded-lg ${task.bg}`}>
										<Icon className={`h-5 w-5 ${task.color}`} />
									</div>
									<div>
										<CardTitle className="text-base">{task.name}</CardTitle>
										<CardDescription className="text-xs mt-1">{task.description}</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<Button
									onClick={() => runTask(task.id, task.name)}
									disabled={running !== null}
									className="w-full"
								>
									{running === task.id ? (
										<>
											<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
											执行中...
										</>
									) : (
										<>
											<Settings className="h-4 w-4 mr-2" />
											执行任务
										</>
									)}
								</Button>
							</CardContent>
						</Card>
					);
				})}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>定时任务状态</CardTitle>
					<CardDescription>Vercel Cron 定时任务配置</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{[
							{ name: "每日积分发放", path: "/api/points/daily-grant", schedule: "每天 0:00" },
							{
								name: "邀请奖励发放",
								path: "/api/invitation/grant-rewards",
								schedule: "每天 0:00",
							},
							{ name: "数据库备份", path: "/api/cron/backup", schedule: "每天 2:00" },
							{
								name: "会员过期检查",
								path: "/api/admin/membership-expiration",
								schedule: "每天 1:00",
							},
							{
								name: "到期提醒邮件",
								path: "/api/admin/membership-expiration-reminder",
								schedule: "每天 9:00",
							},
							{ name: "数据清理", path: "/api/admin/cleanup", schedule: "每周日 3:00" },
							{ name: "订阅状态检查", path: "/api/cron/subscription-check", schedule: "每天 8:00" },
						].map((cron) => (
							<div
								key={cron.path}
								className="flex items-center justify-between p-3 rounded-lg border"
							>
								<div>
									<p className="text-sm font-medium">{cron.name}</p>
									<p className="text-xs text-muted-foreground">{cron.path}</p>
								</div>
								<div className="flex items-center gap-2">
									<Badge variant="outline">{cron.schedule}</Badge>
									<Badge variant="default" className="text-green-600">
										运行中
									</Badge>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
