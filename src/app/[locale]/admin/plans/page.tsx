"use client";

import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/server/client";

interface AdminPlan {
	id: string;
	name: string;
	nameZh: string | null;
	description: string | null;
	priceUSDMonthly: string;
	priceUSDYearly: string | null;
	dailyBonus: number;
	monthlyPoints: number;
	isActive: boolean | null;
}

export default function PlansPage() {
	const t = useTranslations("admin.plans");
	const { data: plans } = trpc.payments.getMembershipPlans.useQuery();
	const planList = (plans ?? []) as AdminPlan[];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
				<p className="text-muted-foreground mt-1">{t("subtitle")}</p>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				{planList.map((plan: AdminPlan) => (
					<Card key={plan.id}>
						<CardHeader>
							<div className="flex items-center gap-2">
								<Shield className="h-5 w-5" />
								<CardTitle>{plan.nameZh || plan.name}</CardTitle>
							</div>
							<CardDescription>{plan.description}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<span className="text-sm">月付价格</span>
									<span className="font-bold">${plan.priceUSDMonthly}</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm">年付价格</span>
									<span className="font-bold">${plan.priceUSDYearly || "未设置"}</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm">每日积分</span>
									<Badge variant="outline">{plan.dailyBonus || 1680}</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm">每月积分</span>
									<Badge variant="outline">
										{plan.monthlyPoints === -1 ? "无限" : plan.monthlyPoints || 0}
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm">状态</span>
									<Badge variant={plan.isActive ? "default" : "secondary"}>
										{plan.isActive ? "上架" : "下架"}
									</Badge>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
