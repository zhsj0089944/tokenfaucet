/**
 * 共享工具函数
 * 统一 tts/utils.ts 和 points.ts 中重复的函数
 */

import { and, desc, eq, gte } from "drizzle-orm";
import { membershipPlans, systemConfigs, userMemberships } from "@/drizzle/schemas";
import type { Context } from "@/server/server";

/**
 * 判断两个日期是否为同一天
 */
export function isSameDay(date1: Date, date2: Date): boolean {
	return (
		date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getDate() === date2.getDate()
	);
}

/**
 * 判断两个日期是否为同一月
 */
export function isSameMonth(date1: Date, date2: Date): boolean {
	return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
}

/**
 * 获取积分配置
 */
export async function getPointsConfig(ctx: Pick<Context, "db">) {
	const configs = await ctx.db
		.select()
		.from(systemConfigs)
		.where(eq(systemConfigs.category, "points"));

	const configMap = new Map(configs.map((c) => [c.key, c.value]));

	return {
		dailyFreePoints: Number(configMap.get("points.dailyFreePoints")) || 1680,
		liteMonthlyPoints: Number(configMap.get("points.liteMonthlyPoints")) || 100000,
		proMonthlyPoints: Number(configMap.get("points.proMonthlyPoints")) || 300000,
		ttsCostChinese: Number(configMap.get("points.ttsCostChinese")) || 4,
		ttsCostEnglish: Number(configMap.get("points.ttsCostEnglish")) || 2.5,
		ttsCostPunctuation: Number(configMap.get("points.ttsCostPunctuation")) || 0.5,
	};
}

/**
 * 获取用户会员信息（只返回有效的会员）
 */
export async function getUserMembershipInfo(ctx: Pick<Context, "db">, userId: string) {
	const membershipQuery = await ctx.db
		.select({
			membership: userMemberships,
			plan: membershipPlans,
		})
		.from(userMemberships)
		.leftJoin(membershipPlans, eq(userMemberships.planId, membershipPlans.id))
		.where(
			and(
				eq(userMemberships.userId, userId),
				eq(userMemberships.status, "active"),
				gte(userMemberships.endDate, new Date()),
			),
		)
		.orderBy(desc(userMemberships.endDate))
		.limit(1);

	return membershipQuery[0] ?? null;
}
