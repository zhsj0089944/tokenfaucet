"use client";

import {
	Activity,
	ArrowRight,
	Clock,
	Coins,
	CreditCard,
	Shield,
	TrendingUp,
	UserCheck,
	Users,
	Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { trpc } from "@/server/client";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function AdminDashboardPage() {
	const t = useTranslations("admin.dashboard");
	const locale = useLocale();
	const router = useRouter();

	const { data: stats, isLoading: statsLoading } = trpc.adminUsers.getUserStats.useQuery();
	const { data: dashStats, isLoading: dashLoading } =
		trpc.adminDashboard.getAdminDashboardStats.useQuery(undefined, {
			refetchOnWindowFocus: true,
			refetchInterval: 30000,
		});
	const { data: analytics, isLoading: analyticsLoading } =
		trpc.adminAnalytics.getDashboardAnalytics.useQuery({ days: 30 });

	if (statsLoading || dashLoading || analyticsLoading || !stats || !dashStats || !analytics) {
		return <DashboardSkeleton />;
	}

	const statCards = [
		{
			title: t("totalUsers"),
			value: stats?.total || 0,
			subtitle: `本周 +${dashStats?.newUsers?.week || 0}`,
			icon: Users,
			color: "text-blue-500",
			bg: "bg-blue-500/10",
		},
		{
			title: t("activeUsers"),
			value: stats?.active || 0,
			icon: UserCheck,
			color: "text-green-500",
			bg: "bg-green-500/10",
		},
		{
			title: "活跃订阅",
			value: analytics?.activeSubscriptions || 0,
			icon: Shield,
			color: "text-purple-500",
			bg: "bg-purple-500/10",
		},
		{
			title: "总收入",
			value: `$${Number(dashStats?.revenue?.total || 0).toFixed(0)}`,
			subtitle: `本月 $${Number(dashStats?.revenue?.month || 0).toFixed(0)}`,
			icon: CreditCard,
			color: "text-amber-500",
			bg: "bg-amber-500/10",
		},
		{
			title: "今日 TTS",
			value: analytics?.today.tts || 0,
			subtitle: `累计 ${(dashStats?.tts.total || 0).toLocaleString()}`,
			icon: Zap,
			color: "text-cyan-500",
			bg: "bg-cyan-500/10",
		},
		{
			title: "积分发放",
			value: (dashStats?.points.totalGranted || 0).toLocaleString(),
			subtitle: `消耗 ${(dashStats?.points.totalConsumed || 0).toLocaleString()}`,
			icon: Coins,
			color: "text-orange-500",
			bg: "bg-orange-500/10",
		},
	];

	const quickActions = [
		{
			title: t("userManagement"),
			description: t("userManagementDesc"),
			icon: Users,
			href: `/${locale}/admin/users`,
			color: "text-blue-500",
			bg: "bg-blue-500/10",
		},
		{
			title: "支付记录",
			description: "查看所有订单和订阅",
			icon: CreditCard,
			href: `/${locale}/admin/payments`,
			color: "text-amber-500",
			bg: "bg-amber-500/10",
		},
		{
			title: "订阅管理",
			description: "管理所有用户订阅",
			icon: Shield,
			href: `/${locale}/admin/subscriptions`,
			color: "text-purple-500",
			bg: "bg-purple-500/10",
		},
		{
			title: "营收分析",
			description: "查看收入趋势和统计",
			icon: TrendingUp,
			href: `/${locale}/admin/revenue`,
			color: "text-green-500",
			bg: "bg-green-500/10",
		},
		{
			title: "TTS 统计",
			description: "查看 TTS 使用情况",
			icon: Zap,
			href: `/${locale}/admin/tts`,
			color: "text-cyan-500",
			bg: "bg-cyan-500/10",
		},
		{
			title: "审计日志",
			description: "系统操作记录",
			icon: Activity,
			href: `/${locale}/admin/audit-logs`,
			color: "text-red-500",
			bg: "bg-red-500/10",
		},
	];

	const formatTime = (date: string | Date | null) => {
		if (!date) return "—";
		const d = new Date(date);
		const now = new Date();
		const diff = now.getTime() - d.getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return "刚刚";
		if (mins < 60) return `${mins}分钟前`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}小时前`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `${days}天前`;
		return d.toLocaleDateString("zh-CN");
	};

	const activityTypeIcon = (type: string) => {
		switch (type) {
			case "tts":
				return <Zap className="h-3.5 w-3.5 text-cyan-500" />;
			case "payment":
				return <CreditCard className="h-3.5 w-3.5 text-amber-500" />;
			case "points":
				return <Coins className="h-3.5 w-3.5 text-orange-500" />;
			default:
				return <Activity className="h-3.5 w-3.5 text-muted-foreground" />;
		}
	};

	const activityTypeLabel = (type: string) => {
		switch (type) {
			case "tts":
				return "TTS 生成";
			case "payment":
				return "支付";
			case "points":
				return "积分变动";
			default:
				return type;
		}
	};

	const funnelData = [
		{ name: "访问", value: analytics.funnel.visitors, fill: "#3b82f6" },
		{ name: "注册", value: analytics.funnel.newUsers, fill: "#10b981" },
		{ name: "付费", value: analytics.funnel.payingUsers, fill: "#f59e0b" },
	];

	const planRevenueData = analytics.revenueByPlan.map(
		(item: { planName: string | null; total: number; count: number }, index: number) => ({
			name: item.planName || "Unknown",
			value: item.total,
			fill: COLORS[index % COLORS.length],
		}),
	);

	return (
		<div className="space-y-6 px-4 sm:px-6 lg:px-8">
			<div>
				<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("title")}</h1>
				<p className="text-muted-foreground mt-1 text-sm sm:text-base">{t("subtitle")}</p>
			</div>

			{/* 统计卡片 */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
				{statCards.map((card) => (
					<Card key={card.title}>
						<CardContent className="p-5">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-xs font-medium text-muted-foreground">{card.title}</p>
									<p className="text-2xl font-bold mt-1">{card.value}</p>
									{card.subtitle && (
										<p className="text-[10px] text-muted-foreground/70 mt-0.5">{card.subtitle}</p>
									)}
								</div>
								<div className={cn("p-2.5 rounded-lg", card.bg)}>
									<card.icon className={cn("h-5 w-5", card.color)} />
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* 图表区域 */}
			<Tabs defaultValue="trends" className="space-y-4">
				<TabsList>
					<TabsTrigger value="trends">趋势分析</TabsTrigger>
					<TabsTrigger value="conversion">转化分析</TabsTrigger>
					<TabsTrigger value="top">排行榜</TabsTrigger>
				</TabsList>

				<TabsContent value="trends" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle className="text-sm">用户注册趋势（30天）</CardTitle>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={250}>
									<AreaChart data={analytics.dailyRegistrations}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="date" tick={{ fontSize: 12 }} />
										<YAxis tick={{ fontSize: 12 }} />
										<Tooltip />
										<Area
											type="monotone"
											dataKey="count"
											stroke="#3b82f6"
											fill="#3b82f6"
											fillOpacity={0.2}
										/>
									</AreaChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-sm">收入趋势（30天）</CardTitle>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={250}>
									<AreaChart data={analytics.dailyRevenue}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="date" tick={{ fontSize: 12 }} />
										<YAxis tick={{ fontSize: 12 }} />
										<Tooltip />
										<Area
											type="monotone"
											dataKey="total"
											stroke="#10b981"
											fill="#10b981"
											fillOpacity={0.2}
										/>
									</AreaChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-sm">TTS 调用趋势（30天）</CardTitle>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={250}>
									<BarChart data={analytics.dailyTts}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="date" tick={{ fontSize: 12 }} />
										<YAxis tick={{ fontSize: 12 }} />
										<Tooltip />
										<Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
									</BarChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-sm">套餐收入分布</CardTitle>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={250}>
									<PieChart>
										<Pie
											data={planRevenueData}
											cx="50%"
											cy="50%"
											outerRadius={80}
											dataKey="value"
											label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
										>
											{planRevenueData.map((entry, index: number) => (
												<Cell
													key={`cell-${entry.name || index}`}
													fill={COLORS[index % COLORS.length]}
												/>
											))}
										</Pie>
										<Tooltip />
									</PieChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="conversion">
					<div className="grid gap-4 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle className="text-sm">转化漏斗（30天）</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{funnelData.map((item, index: number) => {
										const prevItem = index > 0 ? funnelData[index - 1] : item;
										const prevValue = prevItem?.value || item.value;
										const rate = prevValue > 0 ? ((item.value / prevValue) * 100).toFixed(1) : "—";
										const width = prevValue > 0 ? Math.max((item.value / prevValue) * 100, 10) : 10;
										return (
											<div key={item.name} className="space-y-2">
												<div className="flex items-center justify-between">
													<span className="text-sm font-medium">{item.name}</span>
													<span className="text-sm">{item.value.toLocaleString()}</span>
												</div>
												<div
													className="h-8 rounded-md"
													style={{ backgroundColor: item.fill, width: `${width}%`, opacity: 0.8 }}
												/>
												{index > 0 && (
													<p className="text-xs text-muted-foreground">转化率: {rate}%</p>
												)}
											</div>
										);
									})}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-sm">关键指标</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex items-center justify-between p-3 rounded-lg border">
										<span className="text-sm">MRR（月经常性收入）</span>
										<span className="font-bold text-green-600">${analytics.mrr.toFixed(2)}</span>
									</div>
									<div className="flex items-center justify-between p-3 rounded-lg border">
										<span className="text-sm">活跃订阅</span>
										<span className="font-bold">{analytics.activeSubscriptions}</span>
									</div>
									<div className="flex items-center justify-between p-3 rounded-lg border">
										<span className="text-sm">付费转化率</span>
										<span className="font-bold">
											{analytics.funnel.newUsers > 0
												? `${((analytics.funnel.payingUsers / analytics.funnel.newUsers) * 100).toFixed(1)}%`
												: "—"}
										</span>
									</div>
									<div className="flex items-center justify-between p-3 rounded-lg border">
										<span className="text-sm">今日新用户</span>
										<span className="font-bold">{analytics.today.newUsers}</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="top">
					<div className="grid gap-4 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle className="text-sm">Top 5 活跃用户（TTS 调用）</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									{analytics.topActiveUsers.map((user, index: number) => (
										<div
											key={user.userId}
											className="flex items-center justify-between p-3 rounded-lg border"
										>
											<div className="flex items-center gap-3">
												<span className="text-sm font-bold text-muted-foreground w-6">
													#{index + 1}
												</span>
												<div>
													<p className="text-sm font-medium">
														{user.userFullName || user.userEmail}
													</p>
													<p className="text-xs text-muted-foreground">{user.userEmail}</p>
												</div>
											</div>
											<Badge variant="secondary">{user.ttsCount} 次</Badge>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-sm">Top 5 付费用户</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									{analytics.topPayingUsers.map((user, index: number) => (
										<div
											key={user.userId}
											className="flex items-center justify-between p-3 rounded-lg border"
										>
											<div className="flex items-center gap-3">
												<span className="text-sm font-bold text-muted-foreground w-6">
													#{index + 1}
												</span>
												<div>
													<p className="text-sm font-medium">
														{user.userFullName || user.userEmail}
													</p>
													<p className="text-xs text-muted-foreground">{user.userEmail}</p>
												</div>
											</div>
											<Badge variant="default">${user.totalSpent.toFixed(2)}</Badge>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* 最近注册用户 */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="flex items-center gap-2">
									<Users className="h-5 w-5" />
									最近注册用户
								</CardTitle>
								<CardDescription>注册时间、IP 地址、积分余额</CardDescription>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => router.push(`/${locale}/admin/users`)}
							>
								{t("viewAll")}
								<ArrowRight className="h-3 w-3 ml-1" />
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{dashStats?.recentUsers?.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-8">暂无用户</p>
							) : (
								dashStats?.recentUsers?.map((user) => (
									<div
										key={user.id}
										className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
									>
										<div className="flex items-center gap-3 min-w-0">
											<div
												className={cn(
													"h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0",
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
													{user.fullName || user.email}
												</p>
												<p className="text-xs text-muted-foreground truncate">{user.email}</p>
											</div>
										</div>
										<div className="flex items-center gap-3 shrink-0">
											<div className="text-right hidden sm:block">
												<p className="text-xs font-medium">
													{user.pointsTotal?.toLocaleString() || 0} 积分
												</p>
												<p className="text-[10px] text-muted-foreground">
													{user.location || user.ipAddress || "未知位置"}
												</p>
											</div>
											<div className="flex items-center gap-1.5">
												<Badge
													variant={user.isActive ? "default" : "secondary"}
													className="text-[10px] h-5"
												>
													{user.isActive ? "活跃" : "禁用"}
												</Badge>
												{user.isAdmin && (
													<Badge variant="outline" className="text-[10px] h-5">
														管理
													</Badge>
												)}
											</div>
											<span className="text-[10px] text-muted-foreground whitespace-nowrap">
												{formatTime(user.createdAt)}
											</span>
										</div>
									</div>
								))
							)}
						</div>
					</CardContent>
				</Card>

				{/* 快捷操作 */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp className="h-5 w-5" />
							{t("quickActions")}
						</CardTitle>
						<CardDescription>{t("quickActionsDesc")}</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{quickActions.map((action) => (
								<button
									key={action.title}
									type="button"
									className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left w-full"
									onClick={() => router.push(action.href)}
								>
									<div className={cn("p-2 rounded-lg shrink-0", action.bg)}>
										<action.icon className={cn("h-4 w-4", action.color)} />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium">{action.title}</p>
										<p className="text-xs text-muted-foreground truncate">{action.description}</p>
									</div>
									<ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
								</button>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 实时动态流 */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Clock className="h-5 w-5" />
						实时动态
					</CardTitle>
					<CardDescription>最近 TTS 生成、支付、积分变动</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						{dashStats?.recentActivity?.length === 0 ? (
							<p className="text-sm text-muted-foreground text-center py-8">暂无动态</p>
						) : (
							dashStats?.recentActivity?.map((item, idx: number) => (
								<div
									key={`${item.type}-${item.createdAt}-${idx}`}
									className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
								>
									<div className="p-1.5 rounded bg-muted/50 shrink-0">
										{activityTypeIcon(item.type)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<Badge variant="outline" className="text-[10px] h-5 px-1.5">
												{activityTypeLabel(item.type)}
											</Badge>
											<span className="text-sm truncate">{item.detail}</span>
										</div>
										<p className="text-[10px] text-muted-foreground mt-0.5">
											{item.userEmail || `用户 ${item.userId?.slice(0, 8)}...`}
										</p>
									</div>
									<span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
										{formatTime(item.createdAt)}
									</span>
								</div>
							))
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function DashboardSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-10 w-48 mb-2" />
			<Skeleton className="h-5 w-64 mb-6" />
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
				{Array.from({ length: 6 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: Skeleton with static list
					<Card key={`stat-skeleton-${i}`}>
						<CardContent className="p-5">
							<div className="flex items-center justify-between">
								<div>
									<Skeleton className="h-3 w-16 mb-2" />
									<Skeleton className="h-7 w-12" />
								</div>
								<Skeleton className="h-10 w-10 rounded-lg" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<Skeleton className="h-5 w-32" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-[250px] w-full" />
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<Skeleton className="h-5 w-32" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-[250px] w-full" />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
