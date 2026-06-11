import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
// 导入所有schema和关系定义
import * as schema from "@/drizzle/schemas";
import { env } from "@/env";
import { logger } from "@/lib/logger";

// 数据库连接池配置
// 开发环境使用较小连接池，生产环境根据内存调整
const isProduction = env.NODE_ENV === "production";
const nodeMemoryGB = process.env.NODE_V8_MEMORY_ALLOCATED
	? Number(process.env.NODE_V8_MEMORY_ALLOCATED) / 1024
	: isProduction
		? 0.5 // 生产环境默认 512MB
		: 0.25; // 开发环境默认 256MB

// 根据内存动态调整连接池大小
// 每 1GB 内存约支持 10-15 个连接
const calculatedMax = Math.max(5, Math.min(20, Math.floor(nodeMemoryGB * 20)));
const DB_POOL_MAX = env.DB_POOL_MAX || calculatedMax;

// SSL 配置：
// - 通过 DATABASE_SSL 环境变量控制："false" 禁用，"true" 启用
// - 未设置时：localhost/127.0.0.1/::1 自动禁用，其他启用
// - 自建 PostgreSQL 通常不需要 SSL；云数据库（Supabase、Neon 等）需要 SSL
const sslConfig = (() => {
	const sslEnv = process.env.DATABASE_SSL?.toLowerCase();
	if (sslEnv === "false" || sslEnv === "0") return false;
	if (sslEnv === "true" || sslEnv === "1") return { rejectUnauthorized: false };
	// 未设置 DATABASE_SSL 时，根据 hostname 自动判断
	try {
		const dbUrl = new URL(env.DATABASE_URL);
		const hostname = dbUrl.hostname;
		if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
			return false;
		}
	} catch {
		// URL 解析失败，默认不启用 SSL
		return false;
	}
	return { rejectUnauthorized: false };
})();

const connection = postgres(env.DATABASE_URL, {
	max: DB_POOL_MAX,
	idle_timeout: 30,
	connect_timeout: 10,
	ssl: sslConfig,
	connection: {
		application_name: "ai-saas",
	},
});

export const db = drizzle(connection, {
	schema,
	logger: env.NODE_ENV === "development",
});

// 导出schema以便在其他地方使用
export { schema };

// 导出常用类型
export type Database = typeof db;
export type DatabaseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

// 健康检查函数
export async function checkDatabaseHealth(): Promise<boolean> {
	try {
		// 使用 Drizzle ORM 的 sql 模板标签执行安全健康检查
		await db.execute(sql`SELECT 1`);
		return true;
	} catch (error) {
		logger.error(
			"Database health check failed",
			error instanceof Error ? error : new Error(String(error)),
		);
		return false;
	}
}

// 关闭数据库连接 (用于优雅关闭)
export async function closeDatabaseConnection(): Promise<void> {
	try {
		await connection.end();
	} catch (error) {
		logger.error(
			"Error closing database connection",
			error instanceof Error ? error : new Error(String(error)),
		);
	}
}
