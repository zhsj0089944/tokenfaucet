"use client";

import { CheckCircle, XCircle, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/server/client";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function TtsStatsPage() {
	const t = useTranslations("admin.ttsStats");
	const [days, setDays] = useState(30);

	const { data: stats } = trpc.adminTts.getTtsStats.useQuery({ days });

	const providerData =
		stats?.byModel.map((item, index: number) => ({
			name: item.model,
			count: item.count,
			fill: COLORS[index % COLORS.length],
		})) || [];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
				<p className="text-muted-foreground mt-1">{t("subtitle")}</p>
			</div>

			<Tabs defaultValue="30">
				<TabsList>
					<TabsTrigger value="7" onClick={() => setDays(7)}>
						7天
					</TabsTrigger>
					<TabsTrigger value="30" onClick={() => setDays(30)}>
						30天
					</TabsTrigger>
					<TabsTrigger value="90" onClick={() => setDays(90)}>
						90天
					</TabsTrigger>
				</TabsList>
			</Tabs>

			{/* 统计卡片 */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-muted-foreground">总调用量</p>
								<p className="text-2xl font-bold">{stats?.totalCalls.toLocaleString() || 0}</p>
							</div>
							<Zap className="h-8 w-8 text-cyan-500/20" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-muted-foreground">今日调用</p>
								<p className="text-2xl font-bold text-blue-600">{stats?.todayCalls || 0}</p>
							</div>
							<Zap className="h-8 w-8 text-blue-500/20" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-muted-foreground">成功率</p>
								<p className="text-2xl font-bold text-green-600">
									{stats?.successRate.toFixed(1)}%
								</p>
							</div>
							<CheckCircle className="h-8 w-8 text-green-500/20" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-muted-foreground">失败次数</p>
								<p className="text-2xl font-bold text-red-600">{stats?.failedCalls || 0}</p>
							</div>
							<XCircle className="h-8 w-8 text-red-500/20" />
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">调用趋势</CardTitle>
						<CardDescription>每日 TTS 调用量</CardDescription>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<AreaChart data={stats?.dailyTrend || []}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" tick={{ fontSize: 12 }} />
								<YAxis tick={{ fontSize: 12 }} />
								<Tooltip />
								<Area
									type="monotone"
									dataKey="count"
									stroke="#06b6d4"
									fill="#06b6d4"
									fillOpacity={0.2}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm">提供商分布</CardTitle>
						<CardDescription>各模型调用量占比</CardDescription>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<PieChart>
								<Pie
									data={providerData}
									cx="50%"
									cy="50%"
									outerRadius={100}
									dataKey="count"
									label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
								>
									{providerData.map((entry, index: number) => (
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

				<Card>
					<CardHeader>
						<CardTitle className="text-sm">提供商调用量对比</CardTitle>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={stats?.byModel || []}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="model" tick={{ fontSize: 12 }} />
								<YAxis tick={{ fontSize: 12 }} />
								<Tooltip />
								<Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm">其他统计</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between p-3 rounded-lg border">
								<span className="text-sm">平均文本长度</span>
								<span className="font-bold">{stats?.avgTextLength.toLocaleString() || 0} 字</span>
							</div>
							<div className="flex items-center justify-between p-3 rounded-lg border">
								<span className="text-sm">总处理文本</span>
								<span className="font-bold">
									{(stats?.totalTextLength || 0).toLocaleString()} 字
								</span>
							</div>
							<div className="flex items-center justify-between p-3 rounded-lg border">
								<span className="text-sm">成功调用</span>
								<span className="font-bold text-green-600">
									{stats?.successCalls.toLocaleString() || 0}
								</span>
							</div>
							<div className="flex items-center justify-between p-3 rounded-lg border">
								<span className="text-sm">失败调用</span>
								<span className="font-bold text-red-600">
									{stats?.failedCalls.toLocaleString() || 0}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
