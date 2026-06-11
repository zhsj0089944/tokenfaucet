import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { invitationCodes } from "@/drizzle/schemas";
import { auth } from "@/lib/auth/better-auth/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * 生成随机邀请码
 */
function generateCode(length = 8): string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let result = "";
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

/**
 * POST /api/invitation/create
 * 创建新的邀请码（需登录）
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

		// 生成唯一邀请码
		let code = generateCode();
		let attempts = 0;
		while (attempts < 10) {
			const existing = await db
				.select()
				.from(invitationCodes)
				.where(eq(invitationCodes.code, code))
				.limit(1);

			if (existing.length === 0) {
				break;
			}
			code = generateCode();
			attempts++;
		}

		const now = new Date();

		// 创建邀请码
		const [newCode] = await db
			.insert(invitationCodes)
			.values({
				inviterId: userId,
				code,
				status: "active",
				maxUses: 1,
				usedCount: 0,
				createdAt: now,
				updatedAt: now,
			})
			.returning();

		if (!newCode) {
			return NextResponse.json({ error: "创建邀请码失败" }, { status: 500 });
		}

		logger.info("邀请码创建成功", { userId, code });

		return NextResponse.json({
			success: true,
			code: newCode.code,
			createdAt: newCode.createdAt,
		});
	} catch (error) {
		const errObj = error instanceof Error ? error : new Error(String(error));
		logger.error("创建邀请码失败", errObj);
		return NextResponse.json({ error: "创建邀请码失败" }, { status: 500 });
	}
}

/**
 * GET /api/invitation/create
 * 获取当前用户的邀请码列表
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

		const codes = await db
			.select()
			.from(invitationCodes)
			.where(eq(invitationCodes.inviterId, userId))
			.orderBy(invitationCodes.createdAt);

		return NextResponse.json({
			success: true,
			codes,
		});
	} catch (error) {
		const errObj = error instanceof Error ? error : new Error(String(error));
		logger.error("获取邀请码列表失败", errObj);
		return NextResponse.json({ error: "获取邀请码失败" }, { status: 500 });
	}
}
