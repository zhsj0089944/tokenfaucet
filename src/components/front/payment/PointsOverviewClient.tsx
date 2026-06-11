"use client";

import { ArrowDownRight, ArrowUpRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/auth";
import { trpc } from "@/server/client";

export function PointsOverviewClient() {
	const { isAuthenticated } = useAuth();

	const { data, isLoading } = trpc.points.getBalance.useQuery(undefined, {
		enabled: isAuthenticated,
		staleTime: 30 * 1000,
	});

	const { data: txData } = trpc.points.getTransactionHistory.useQuery(
		{ limit: 5 },
		{ enabled: isAuthenticated, staleTime: 30 * 1000 },
	);

	if (!isAuthenticated) return null;

	const transactions = txData?.transactions;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Sparkles className="h-5 w-5 text-primary" />
					积分概览
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				{isLoading ? (
					<PointsOverviewSkeleton />
				) : (
					<>
						{/* 积分余额卡片 */}
						<div className="grid grid-cols-3 gap-4">
							<div className="text-center p-3 bg-muted/50 rounded-lg">
								<p className="text-xs text-muted-foreground mb-1">日积分</p>
								<p className="text-xl font-bold text-primary">
									{(data?.dailyBalance ?? 0).toLocaleString()}
								</p>
								<p className="text-[10px] text-muted-foreground">每天 03:00 重置</p>
							</div>
							<div className="text-center p-3 bg-muted/50 rounded-lg">
								<p className="text-xs text-muted-foreground mb-1">月积分</p>
								<p className="text-xl font-bold text-primary">
									{(data?.monthlyBalance ?? 0).toLocaleString()}
								</p>
								<p className="text-[10px] text-muted-foreground">每月 1 日重置</p>
							</div>
							<div className="text-center p-3 bg-primary/10 border border-primary/20 rounded-lg">
								<p className="text-xs text-muted-foreground mb-1">总积分</p>
								<p className="text-xl font-bold text-primary">
									{(data?.totalBalance ?? 0).toLocaleString()}
								</p>
								<p className="text-[10px] text-muted-foreground">可用余额</p>
							</div>
						</div>

						{/* 积分规则说明 */}
						<div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg space-y-1">
							<p>
								<strong>积分规则</strong>
							</p>
							<p>• 汉字 4 积分/字 | 字母 2.5 积分/字 | 标点 0.5 积分/字</p>
							<p>• 日积分每天 1,680，免费用户和订阅用户共享</p>
							<p>• 月积分仅订阅用户享有，月末清零</p>
						</div>

						{/* 近期变动 */}
						{transactions && transactions.length > 0 && (
							<div>
								<p className="text-sm font-medium mb-2">近期变动</p>
								<div className="space-y-2">
									{transactions
										.slice(0, 5)
										.map(
											(tx: {
												id: string;
												amount: number;
												description: string | null;
												type: string;
											}) => (
												<div key={tx.id} className="flex items-center justify-between text-sm">
													<div className="flex items-center gap-2">
														{tx.amount > 0 ? (
															<ArrowUpRight className="h-4 w-4 text-green-500" />
														) : (
															<ArrowDownRight className="h-4 w-4 text-red-500" />
														)}
														<span className="text-muted-foreground text-xs truncate max-w-[200px]">
															{tx.description || tx.type}
														</span>
													</div>
													<span
														className={
															tx.amount > 0
																? "text-green-500 font-medium"
																: "text-red-500 font-medium"
														}
													>
														{tx.amount > 0 ? "+" : ""}
														{tx.amount.toLocaleString()}
													</span>
												</div>
											),
										)}
								</div>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}

function PointsOverviewSkeleton() {
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-3 gap-4">
				{[1, 2, 3].map((i) => (
					<div key={i} className="text-center p-3 bg-muted/50 rounded-lg">
						<Skeleton className="h-4 w-16 mx-auto mb-2" />
						<Skeleton className="h-8 w-20 mx-auto" />
					</div>
				))}
			</div>
			<Skeleton className="h-20 w-full" />
		</div>
	);
}
