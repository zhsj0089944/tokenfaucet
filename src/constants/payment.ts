/**
 * 支付模块常量配置
 */

import type { Currency, MembershipStatus, PaymentStatus, PlanConfiguration } from "@/types/payment";

// ============== 计费周期配置 ==============

export const BILLING_CYCLES = [
	{ value: "monthly", label: "月付", labelZh: "月付" },
	{ value: "yearly", label: "年付", labelZh: "年付" },
] as const;

export const BILLING_CYCLE_CONFIG = {
	monthly: {
		label: "月付",
		labelZh: "月付",
		discount: 0,
		description: "按月计费",
	},
	yearly: {
		label: "年付",
		labelZh: "年付",
		discount: 0.16, // 16% 折扣 (相当于2个月免费)
		description: "按年计费，节省16%",
	},
} as const;

// ============== 货币配置 ==============

export const CURRENCIES: Array<{
	code: Currency;
	name: string;
	symbol: string;
	nameZh: string;
}> = [{ code: "USD", name: "US Dollar", symbol: "$", nameZh: "美元" }];

export const CURRENCY_CONFIG = {
	USD: {
		symbol: "$",
		name: "US Dollar",
		nameZh: "美元",
		position: "before",
		locale: "en-US",
	},
} as const;

// ============== 支付状态配置 ==============

export const PAYMENT_STATUS: Record<
	PaymentStatus,
	{ label: string; labelZh: string; color: string }
> = {
	pending: {
		label: "Pending",
		labelZh: "待处理",
		color: "bg-yellow-100 text-yellow-800",
	},
	processing: {
		label: "Processing",
		labelZh: "处理中",
		color: "bg-blue-100 text-blue-800",
	},
	completed: {
		label: "Completed",
		labelZh: "已完成",
		color: "bg-green-100 text-green-800",
	},
	failed: {
		label: "Failed",
		labelZh: "失败",
		color: "bg-red-100 text-red-800",
	},
	cancelled: {
		label: "Cancelled",
		labelZh: "已取消",
		color: "bg-gray-100 text-gray-800",
	},
	refunded: {
		label: "Refunded",
		labelZh: "已退款",
		color: "bg-purple-100 text-purple-800",
	},
};

// ============== 会员状态配置 ==============

export const MEMBERSHIP_STATUS: Record<
	MembershipStatus,
	{ label: string; labelZh: string; color: string }
> = {
	active: {
		label: "Active",
		labelZh: "有效",
		color: "bg-green-100 text-green-800",
	},
	expired: {
		label: "Expired",
		labelZh: "已过期",
		color: "bg-red-100 text-red-800",
	},
	cancelled: {
		label: "Cancelled",
		labelZh: "已取消",
		color: "bg-gray-100 text-gray-800",
	},
	paused: {
		label: "Paused",
		labelZh: "已暂停",
		color: "bg-yellow-100 text-yellow-800",
	},
};

// ============== 优惠券类型 ==============

export const COUPON_TYPES = {
	percentage: {
		label: "Percentage",
		labelZh: "百分比",
		symbol: "%",
		description: "Percentage discount",
		descriptionZh: "百分比折扣",
	},
	fixed: {
		label: "Fixed Amount",
		labelZh: "固定金额",
		symbol: "$",
		description: "Fixed amount discount",
		descriptionZh: "固定金额折扣",
	},
} as const;

// ============== 支付方式配置 ==============

export const PAYMENT_METHODS = [
	{
		id: "creem",
		name: "Creem",
		nameZh: "Creem",
		icon: "💳",
		description: "Pay with Creem (Card, Apple Pay, Google Pay)",
		descriptionZh: "使用 Creem 支付（信用卡、Apple Pay、Google Pay）",
		enabled: true,
	},
	{
		id: "alipay",
		name: "Alipay",
		nameZh: "支付宝",
		icon: "🇨🇳",
		description: "Pay with Alipay",
		descriptionZh: "使用支付宝支付",
		enabled: false,
	},
] as const;

// ============== 默认配置 ==============

export const DEFAULT_PAGINATION = {
	page: 1,
	limit: 20,
	maxLimit: 100,
} as const;

export const DEFAULT_USAGE_LIMITS = {
	free: {
		monthlyUseCases: 10,
		monthlyTutorials: 5,
		monthlyApiCalls: 100,
	},
	basic: {
		monthlyUseCases: 50,
		monthlyTutorials: 25,
		monthlyApiCalls: 1000,
	},
	pro: {
		monthlyUseCases: 200,
		monthlyTutorials: 100,
		monthlyApiCalls: 10000,
	},
	enterprise: {
		monthlyUseCases: -1, // 无限
		monthlyTutorials: -1,
		monthlyApiCalls: -1,
	},
} as const;

// ============== 错误消息 ==============

export const PAYMENT_ERRORS = {
	PLAN_NOT_FOUND: "会员计划不存在",
	INSUFFICIENT_PERMISSIONS: "权限不足",
	INVALID_COUPON: "优惠券无效",
	PAYMENT_FAILED: "支付失败",
	SUBSCRIPTION_CREATION_FAILED: "订阅创建失败",
	WEBHOOK_VERIFICATION_FAILED: "Webhook验证失败",
	USAGE_LIMIT_EXCEEDED: "使用次数已达上限",
	MEMBERSHIP_EXPIRED: "会员已过期",
	INVALID_PAYMENT_METHOD: "支付方式无效",
} as const;

// ============== 成功消息 ==============

export const PAYMENT_SUCCESS = {
	PAYMENT_COMPLETED: "支付完成",
	SUBSCRIPTION_CREATED: "订阅创建成功",
	COUPON_APPLIED: "优惠券应用成功",
	USAGE_INCREMENTED: "使用次数更新成功",
	MEMBERSHIP_UPDATED: "会员状态更新成功",
} as const;

// ============== 工具函数 ==============

export function formatPrice(amount: number, currency: Currency): string {
	const config = CURRENCY_CONFIG[currency];
	const formatter = new Intl.NumberFormat(config.locale, {
		style: "currency",
		currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	});
	return formatter.format(amount);
}

export function calculateDiscountedPrice(
	originalPrice: number,
	discountType: "percentage" | "fixed",
	discountValue: number,
): number {
	if (discountType === "percentage") {
		return Math.max(0, originalPrice * (1 - discountValue / 100));
	}
	return Math.max(0, originalPrice - discountValue);
}

export function getPlanPrice(
	plan: PlanConfiguration,
	durationType: "monthly" | "yearly",
	currency: Currency = "USD",
): number {
	if (durationType === "yearly") {
		return plan.yearlyPrice[currency];
	}
	return plan.monthlyPrice[currency];
}
