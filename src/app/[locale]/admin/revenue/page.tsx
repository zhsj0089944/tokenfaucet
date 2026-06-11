"use client";

import { CreditCard, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
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

interface PaymentMethodItem {
	method: string | null;
	total: number;
	count: number;
}

interface PaymentMethodChartData {
	name: string;
	value: number;
	fill: string | undefined;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function RevenuePage() {
	const [days, setDays] = useState(30);

	const { data: revenueStats } = trpc.adminAnalytics.getRevenueStats.useQuery({ days });
	const { data: analytics } = trpc.adminAnalytics.getDashboardAnalytics.useQuery({ days });

	const paymentMethodData: PaymentMethodChartData[] =
		revenueStats?.byPaymentMethod.map((item: PaymentMethodItem, index: number) => ({
			name: item.method || "未知",
			value: item.total,
			fill: COLORS[index % COLORS.length],
		})) || [];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">营收分析</h1>
				<p className="text-muted-foreground mt-1">收入趋势、套餐分布、支付方式统计</p>
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
								<p className="text-xs text-muted-foreground">总收入</p>
								<p className="text-2xl font-bold text-green-600">
									${revenueStats?.totalRevenue.toFixed(2) || "0.00"}
								</p>
							</div>
							<DollarSign className="h-8 w-8 text-green-500/20" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-muted-foreground">本月收入</p>
								<p className="text-2xl font-bold text-blue-600">
									${revenueStats?.monthRevenue.toFixed(2) || "0.00"}
								</p>
							</div>
							<TrendingUp className="h-8 w-8 text-blue-500/20" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-muted-foreground">期间收入</p>
								<p className="text-2xl font-bold text-purple-600">
									${revenueStats?.periodRevenue.toFixed(2) || "0.00"}
								</p>
							</div>
							<CreditCard className="h-8 w-8 text-purple-500/20" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-muted-foreground">退款总额</p>
								<p className="text-2xl font-bold text-red-600">
									${revenueStats?.refunds.total.toFixed(2) || "0.00"}
								</p>
								<p className="text-xs text-muted-foreground">
									{revenueStats?.refunds.count || 0} 笔
								</p>
							</div>
							<TrendingDown className="h-8 w-8 text-red-500/20" />
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">收入趋势</CardTitle>
						<CardDescription>每日收入变化</CardDescription>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<AreaChart data={revenueStats?.dailyRevenue || []}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" tick={{ fontSize: 12 }} />
								<YAxis tick={{ fontSize: 12 }} />
								<Tooltip formatter={(value) => [`$${value ?? 0}`, "收入"]} />
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
						<CardTitle className="text-sm">支付方式分布</CardTitle>
						<CardDescription>各支付方式收入占比</CardDescription>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<PieChart>
								<Pie
									data={paymentMethodData}
									cx="50%"
									cy="50%"
									outerRadius={100}
									dataKey="value"
									label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
								>
									{paymentMethodData.map((entry) => (
										<Cell
											key={entry.name}
											fill={COLORS[paymentMethodData.indexOf(entry) % COLORS.length]}
										/>
									))}
								</Pie>
								<Tooltip formatter={(value) => [`$${value ?? 0}`, "收入"]} />
							</PieChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm">套餐收入分布</CardTitle>
						<CardDescription>各套餐收入占比</CardDescription>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={analytics?.revenueByPlan || []}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="planName" tick={{ fontSize: 12 }} />
								<YAxis tick={{ fontSize: 12 }} />
								<Tooltip formatter={(value) => [`$${value ?? 0}`, "收入"]} />
								<Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm">每日订单数</CardTitle>
						<CardDescription>每日支付订单数量</CardDescription>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={revenueStats?.dailyRevenue || []}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" tick={{ fontSize: 12 }} />
								<YAxis tick={{ fontSize: 12 }} />
								<Tooltip />
								<Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
