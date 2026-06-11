"use client";

import { CreemCheckout } from "@creem_io/nextjs";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/server/client";

interface CreemCheckoutButtonProps {
	/** Creem 产品 ID（新订阅时必填） */
	productId?: string;
	/** 升级目标计划 ID（升级时必填） */
	upgradeToPlanId?: string;
	/** 计费周期 */
	durationType: "monthly" | "yearly";
	locale: string;
	customerEmail?: string;
	referenceId?: string;
	metadata?: Record<string, string>;
	className?: string;
	children?: ReactNode;
}

export function CreemCheckoutButton({
	productId,
	upgradeToPlanId,
	durationType,
	locale,
	customerEmail,
	referenceId,
	metadata,
	className,
	children,
}: CreemCheckoutButtonProps) {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const upgradeMutation = trpc.payments.upgradeSubscription.useMutation();

	const isUpgrade = !!upgradeToPlanId;

	const handleClick = async () => {
		if (!isUpgrade) return; // 非升级模式由 CreemCheckout 处理

		setIsLoading(true);
		try {
			await upgradeMutation.mutateAsync({
				newPlanId: upgradeToPlanId,
				durationType,
			});
			toast.success(locale === "zh" ? "升级成功！" : "Upgrade successful!");
			router.push(`/${locale}/payment/success`);
		} catch (error) {
			const msg = error instanceof Error ? error.message : "Upgrade failed";
			toast.error(locale === "zh" ? `升级失败: ${msg}` : `Upgrade failed: ${msg}`);
			setIsLoading(false);
		}
	};

	const buttonContent = (
		<button
			type="button"
			className={cn(
				"w-full h-11 rounded-full text-sm font-medium transition-all duration-200",
				"flex items-center justify-center gap-2",
				"bg-[#533afd] hover:bg-[#4434d4] text-white",
				"shadow-[0_1px_3px_rgba(83,58,253,0.3)] hover:shadow-[0_4px_12px_rgba(83,58,253,0.4)]",
				"disabled:opacity-60 disabled:cursor-not-allowed",
				className,
			)}
			disabled={isLoading}
			onClick={isUpgrade ? handleClick : undefined}
		>
			{isLoading ? (
				<>
					<Loader2 className="w-4 h-4 animate-spin" />
					{locale === "zh" ? "处理中..." : "Processing..."}
				</>
			) : (
				children || <>{locale === "zh" ? "立即订阅" : "Subscribe Now"}</>
			)}
		</button>
	);

	// 升级模式：直接渲染按钮，点击调用 upgrade API
	if (isUpgrade) {
		return buttonContent;
	}

	// 新订阅模式：用 CreemCheckout 包裹
	if (!productId) {
		return buttonContent;
	}

	return (
		<CreemCheckout
			productId={productId}
			successUrl={`/${locale}/payment/success`}
			customer={customerEmail ? { email: customerEmail } : undefined}
			referenceId={referenceId}
			metadata={metadata}
		>
			{buttonContent}
		</CreemCheckout>
	);
}
