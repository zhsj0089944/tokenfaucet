import { desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { invitationCodes, invitationRecords, systemConfigs, users } from "@/drizzle/schemas";
import { auth } from "@/lib/auth/better-auth/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

// ===============================
// 邀请奖励配置辅助函数
// ===============================
async function getInvitationConfig() {
	const configs = await db
		.select()
		.from(systemConfigs)
		.where(eq(systemConfigs.category, "invitation"));

	const configMap = new Map(configs.map((c) => [c.key, c.value]));
	return {
		dailyReward: Number(configMap.get("invitation.dailyReward")) || 500,
		maxDays: Number(configMap.get("invitation.maxDays")) || 5,
	};
}

/**
 * GET /api/invitation/list
 * 获取当前用户的邀请记录和邀请码
 */
export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		if (!session?.user) {
			return NextResponse.json({ error: "请先登录" }, { status: 401 });
		}

		const userId = session.user.id;
		const config = await getInvitationConfig();

		// 获取用户的所有邀请码
		const codes = await db
			.select()
			.from(invitationCodes)
			.where(eq(invitationCodes.inviterId, userId))
			.orderBy(desc(invitationCodes.createdAt));

		// 获取用户的邀请记录（作为邀请人）
		const asInviter = await db
			.select({
				id: invitationRecords.id,
				inviteeId: invitationRecords.inviteeId,
				code: invitationRecords.code,
				status: invitationRecords.status,
				rewardDaysClaimed: invitationRecords.rewardDaysClaimed,
				lastRewardAt: invitationRecords.lastRewardAt,
				firstRewardAt: invitationRecords.firstRewardAt,
				createdAt: invitationRecords.createdAt,
			})
			.from(invitationRecords)
			.where(eq(invitationRecords.inviterId, userId))
			.orderBy(desc(invitationRecords.createdAt));

		// 获取被邀请人信息
		const inviteeIds = asInviter.map((r) => r.inviteeId);
		const inviteeInfos = await Promise.all(
			inviteeIds.map(async (id) => {
				const user = await db
					.select({
						id: users.id,
						name: users.name,
						email: users.email,
						createdAt: users.createdAt,
					})
					.from(users)
					.where(eq(users.id, id))
					.limit(1);
				return user[0] || null;
			}),
		);

		// 组合数据
		const invitationList = asInviter.map((record, index) => ({
			...record,
			invitee: inviteeInfos[index],
			rewardProgress: `${record.rewardDaysClaimed}/${config.maxDays}天`,
			earnedPoints: record.rewardDaysClaimed * config.dailyReward,
		}));

		// 获取用户作为被邀请人的记录
		const asInvitee = await db
			.select()
			.from(invitationRecords)
			.where(eq(invitationRecords.inviteeId, userId))
			.limit(1);

		return NextResponse.json({
			success: true,
			codes: codes.map((code) => ({
				code: code.code,
				status: code.status,
				usedCount: code.usedCount,
				maxUses: code.maxUses,
				createdAt: code.createdAt,
			})),
			invitations: invitationList,
			summary: {
				totalInvited: asInviter.length,
				activeInvitations: asInviter.filter((r) => r.status === "active").length,
				completedInvitations: asInviter.filter((r) => r.status === "completed").length,
				totalEarned:
					asInviter.reduce((sum, r) => sum + r.rewardDaysClaimed, 0) * config.dailyReward,
				referredBy: asInvitee[0]?.inviterId || null,
			},
		});
	} catch (error) {
		const errObj = error instanceof Error ? error : new Error(String(error));
		logger.error("获取邀请记录失败", errObj);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "获取邀请记录失败" },
			{ status: 500 },
		);
	}
}
