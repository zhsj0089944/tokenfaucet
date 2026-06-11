import { and, count, eq, isNotNull, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auditLogs, configHistory, userVoices } from "@/drizzle/schemas";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

// 审计日志保留天数
const AUDIT_LOGS_KEEP_DAYS = 365;
// 配置历史保留天数
const CONFIG_HISTORY_KEEP_DAYS = 30;

interface CleanupResult {
	cutoffDate: string;
	keepDays: number;
	deleted: number;
}

interface CleanupResults {
	auditLogs: CleanupResult;
	configHistory: CleanupResult;
	expiredVoices: { deleted: number };
}

/**
 * 清理旧的审计日志和配置历史
 * 可被定时任务调用，如 Vercel Cron 或服务器 cron job
 *
 * 调用示例：
 * POST /api/admin/cleanup
 * Header: Authorization: Bearer YOUR_CRON_SECRET
 */
export async function POST(request: Request) {
	// 简单的密钥验证
	const authHeader = request.headers.get("authorization");
	const cronSecret = process.env.CRON_SECRET;

	if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const now = new Date();

		// 计算清理时间点
		const auditCutoff = new Date(now);
		auditCutoff.setDate(auditCutoff.getDate() - AUDIT_LOGS_KEEP_DAYS);

		const configCutoff = new Date(now);
		configCutoff.setDate(configCutoff.getDate() - CONFIG_HISTORY_KEEP_DAYS);

		const results: CleanupResults = {
			auditLogs: {
				cutoffDate: auditCutoff.toISOString(),
				keepDays: AUDIT_LOGS_KEEP_DAYS,
				deleted: 0,
			},
			configHistory: {
				cutoffDate: configCutoff.toISOString(),
				keepDays: CONFIG_HISTORY_KEEP_DAYS,
				deleted: 0,
			},
			expiredVoices: {
				deleted: 0,
			},
		};

		// 清理审计日志
		try {
			const [auditCount] = await db
				.select({ count: count() })
				.from(auditLogs)
				.where(lte(auditLogs.createdAt, auditCutoff));

			results.auditLogs.deleted = Number(auditCount?.count) || 0;

			if (results.auditLogs.deleted > 0) {
				await db.delete(auditLogs).where(lte(auditLogs.createdAt, auditCutoff));
			}
		} catch (e) {
			const err = e instanceof Error ? e : new Error(String(e));
			logger.error("Audit logs cleanup error", err);
		}

		// 清理配置历史
		try {
			const [configCount] = await db
				.select({ count: count() })
				.from(configHistory)
				.where(lte(configHistory.createdAt, configCutoff));

			results.configHistory.deleted = Number(configCount?.count) || 0;

			if (results.configHistory.deleted > 0) {
				await db.delete(configHistory).where(lte(configHistory.createdAt, configCutoff));
			}
		} catch (e) {
			const err = e instanceof Error ? e : new Error(String(e));
			logger.error("Config history cleanup error", err);
		}

		// 清理过期的复刻音色（expiresAt 已过期的 clone 类型音色）
		results.expiredVoices = { deleted: 0 };
		try {
			const [expiredCount] = await db
				.select({ count: count() })
				.from(userVoices)
				.where(
					and(
						eq(userVoices.voiceType, "clone"),
						isNotNull(userVoices.expiresAt),
						lte(userVoices.expiresAt, now),
					),
				);

			results.expiredVoices.deleted = Number(expiredCount?.count) || 0;

			if (results.expiredVoices.deleted > 0) {
				await db
					.delete(userVoices)
					.where(
						and(
							eq(userVoices.voiceType, "clone"),
							isNotNull(userVoices.expiresAt),
							lte(userVoices.expiresAt, now),
						),
					);
				logger.info("Cleaned up expired clone voices", { count: results.expiredVoices.deleted });
			}
		} catch (e) {
			const err = e instanceof Error ? e : new Error(String(e));
			logger.error("Expired voices cleanup error", err);
		}

		return NextResponse.json({
			success: true,
			message: "Cleanup completed",
			executedAt: now.toISOString(),
			results,
		});
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		logger.error("Cleanup error", err);
		return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
	}
}

/**
 * 获取清理配置的 GET 接口
 */
export async function GET(request: Request) {
	const authHeader = request.headers.get("authorization");
	const cronSecret = process.env.CRON_SECRET;

	if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	return NextResponse.json({
		config: {
			auditLogsKeepDays: AUDIT_LOGS_KEEP_DAYS,
			configHistoryKeepDays: CONFIG_HISTORY_KEEP_DAYS,
		},
		endpoint: "POST /api/admin/cleanup",
	});
}
