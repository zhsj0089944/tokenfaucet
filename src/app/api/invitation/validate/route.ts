import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import {
	invitationCodes,
	invitationRecords,
	pointTransactions,
	systemConfigs,
	userPoints,
} from "@/drizzle/schemas";
import type { PointTransactionType } from "@/drizzle/schemas/points";
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
		invitationReward: Number(configMap.get("points.invitationReward")) || 2500,
		dailyFreePoints: Number(configMap.get("points.dailyFreePoints")) || 1680,
	};
}

/**
 * 发放积分辅助函数（使用事务确保原子性）
 */
async function grantPoints(userId: string, amount: number, description: string, now: Date) {
	// 从数据库读取配置
	const config = await getInvitationConfig();
	const { dailyFreePoints } = config;

	// 使用事务确保积分更新的原子性
	await db.transaction(async (tx) => {
		// 使用 SELECT ... FOR UPDATE 锁定行，防止并发更新
		const [record] = await tx
			.select()
			.from(userPoints)
			.where(eq(userPoints.userId, userId))
			.for("update");

		if (!record) {
			// 创建新的积分记录
			await tx.insert(userPoints).values({
				userId,
				dailyBalance: dailyFreePoints + amount,
				lastDailyResetAt: now,
				monthlyBalance: 0,
				lastMonthlyResetAt: now,
				totalGranted: dailyFreePoints + amount,
				totalConsumed: 0,
				createdAt: now,
				updatedAt: now,
			});

			// 记录积分变动
			await tx.insert(pointTransactions).values({
				userId,
				type: "invitation_grant" as PointTransactionType,
				amount,
				balanceBefore: 0,
				balanceAfter: amount,
				description,
				createdAt: now,
			});
		} else {
			// 原子增加积分
			await tx
				.update(userPoints)
				.set({
					dailyBalance: record.dailyBalance + amount,
					totalGranted: record.totalGranted + amount,
					updatedAt: now,
				})
				.where(eq(userPoints.userId, userId));

			// 记录积分变动
			await tx.insert(pointTransactions).values({
				userId,
				type: "invitation_grant" as PointTransactionType,
				amount,
				balanceBefore: record.dailyBalance,
				balanceAfter: record.dailyBalance + amount,
				description,
				createdAt: now,
			});
		}
	});
}

/**
 * GET /api/invitation/validate
 * 验证邀请码是否有效
 */
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const code = searchParams.get("code");

		if (!code) {
			return NextResponse.json({ error: "邀请码不能为空" }, { status: 400 });
		}

		// 查询邀请码
		const codeRecord = await db
			.select()
			.from(invitationCodes)
			.where(eq(invitationCodes.code, code.toUpperCase()))
			.limit(1);

		if (codeRecord.length === 0) {
			return NextResponse.json({ valid: false, error: "邀请码不存在" });
		}

		const invitation = codeRecord[0] as NonNullable<(typeof codeRecord)[number]>;

		// 检查状态
		if (invitation.status !== "active") {
			return NextResponse.json({ valid: false, error: "邀请码已失效" });
		}

		// 检查过期时间
		if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
			return NextResponse.json({ valid: false, error: "邀请码已过期" });
		}

		// 检查使用次数
		if (invitation.usedCount >= invitation.maxUses) {
			return NextResponse.json({ valid: false, error: "邀请码已被使用" });
		}

		return NextResponse.json({ valid: true });
	} catch (error) {
		const errObj = error instanceof Error ? error : new Error(String(error));
		logger.error("验证邀请码失败", errObj);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "验证邀请码失败" },
			{ status: 500 },
		);
	}
}

/**
 * POST /api/invitation/validate
 * 绑定邀请关系并发放奖励（注册时调用）
 */
export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		if (!session?.user) {
			return NextResponse.json({ error: "请先登录" }, { status: 401 });
		}

		const userId = session.user.id;
		const body = await request.json();
		const { code } = body;

		if (!code) {
			return NextResponse.json({ error: "邀请码不能为空" }, { status: 400 });
		}

		const upperCode = code.toUpperCase();

		// 检查用户是否已经有邀请关系
		const existingRecord = await db
			.select()
			.from(invitationRecords)
			.where(eq(invitationRecords.inviteeId, userId))
			.limit(1);

		if (existingRecord.length > 0) {
			return NextResponse.json({ success: false, error: "您已经使用过邀请码" });
		}

		// 查询邀请码
		const codeRecord = await db
			.select()
			.from(invitationCodes)
			.where(eq(invitationCodes.code, upperCode))
			.limit(1);

		if (codeRecord.length === 0) {
			return NextResponse.json({ success: false, error: "邀请码不存在" });
		}

		const invitation = codeRecord[0] as NonNullable<(typeof codeRecord)[number]>;

		// 检查状态
		if (invitation.status !== "active") {
			return NextResponse.json({ success: false, error: "邀请码已失效" });
		}

		// 检查使用次数
		if (invitation.usedCount >= invitation.maxUses) {
			return NextResponse.json({ success: false, error: "邀请码已被使用" });
		}

		const now = new Date();

		// 使用事务确保邀请码扣减 + 记录创建 + 积分发放的原子性
		await db.transaction(async (tx) => {
			// 使用 SELECT ... FOR UPDATE 锁定邀请码行，防止并发超用
			const [lockedInvitation] = await tx
				.select()
				.from(invitationCodes)
				.where(eq(invitationCodes.id, invitation.id))
				.for("update");

			if (!lockedInvitation) {
				throw new Error("邀请码记录不存在");
			}

			// 在锁内重新校验使用次数
			if (lockedInvitation.usedCount >= lockedInvitation.maxUses) {
				throw new Error("邀请码已被用完");
			}

			if (lockedInvitation.status !== "active") {
				throw new Error("邀请码已失效");
			}

			// 更新邀请码使用次数
			await tx
				.update(invitationCodes)
				.set({
					usedCount: lockedInvitation.usedCount + 1,
					updatedAt: now,
				})
				.where(eq(invitationCodes.id, invitation.id));

			// 创建邀请记录
			await tx.insert(invitationRecords).values({
				inviterId: lockedInvitation.inviterId,
				inviteeId: userId,
				code: upperCode,
				status: "completed",
				rewardDaysClaimed: 1,
				createdAt: now,
				updatedAt: now,
			});
		});

		// 从数据库读取配置
		const config = await getInvitationConfig();
		const { invitationReward } = config;

		// 给邀请人发放积分（内部已使用事务 + FOR UPDATE）
		await grantPoints(invitation.inviterId, invitationReward, `邀请奖励（被邀请人注册）`, now);

		// 给被邀请人发放积分（内部已使用事务 + FOR UPDATE）
		await grantPoints(userId, invitationReward, `注册奖励（使用邀请码）`, now);

		logger.info("邀请关系绑定成功并发放奖励", {
			inviterId: invitation.inviterId,
			inviteeId: userId,
			code: upperCode,
			reward: invitationReward,
		});

		return NextResponse.json({
			success: true,
			message: `邀请成功，双方各获得 ${invitationReward} 积分`,
		});
	} catch (error) {
		const errObj = error instanceof Error ? error : new Error(String(error));
		logger.error("绑定邀请关系失败", errObj);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "绑定邀请关系失败" },
			{ status: 500 },
		);
	}
}
