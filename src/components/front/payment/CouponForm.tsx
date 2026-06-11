"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Coupon {
	code: string;
	description?: string;
	discount?: number;
	type?: "percentage" | "fixed";
}

interface CouponFormProps {
	onCouponApplied?: (coupon: Coupon | null) => void;
}

export function CouponForm({ onCouponApplied }: CouponFormProps) {
	const [code, setCode] = useState("");
	const [loading, setLoading] = useState(false);
	const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleApply = async () => {
		if (!code.trim()) return;

		setLoading(true);
		setError(null);

		try {
			// 优惠券功能尚未开放，提示用户
			setError("优惠券功能即将上线，敬请期待");
		} catch {
			setError("优惠券验证失败，请稍后重试");
		} finally {
			setLoading(false);
		}
	};

	const handleRemove = () => {
		setAppliedCoupon(null);
		setCode("");
		onCouponApplied?.(null);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>优惠券</CardTitle>
			</CardHeader>
			<CardContent>
				{appliedCoupon ? (
					<div className="flex items-center justify-between">
						<div>
							<Badge variant="secondary">{appliedCoupon.code}</Badge>
							<p className="text-sm text-muted-foreground mt-1">{appliedCoupon.description}</p>
						</div>
						<Button variant="outline" size="sm" onClick={handleRemove}>
							移除
						</Button>
					</div>
				) : (
					<div className="space-y-2">
						<div className="flex gap-2">
							<Input
								placeholder="输入优惠券代码"
								value={code}
								onChange={(e) => setCode(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleApply()}
							/>
							<Button onClick={handleApply} disabled={loading || !code.trim()}>
								{loading ? "验证中..." : "应用"}
							</Button>
						</div>
						{error && <p className="text-sm text-destructive">{error}</p>}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
