/**
 * 数据库备份脚本
 * 用法: npx tsx scripts/backup-db.ts
 * 建议通过 cron job 每天执行
 *
 * Vercel Cron 配置 (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/backup",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */

import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import { gzip } from "node:zlib";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const BACKUP_DIR = process.env.BACKUP_DIR || "./backups";
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || "30", 10);
const gzipAsync = promisify(gzip);

type TableColumn = {
	column_name: string;
	data_type: string;
	is_nullable: "YES" | "NO";
	column_default: string | null;
};

if (!DATABASE_URL) {
	console.error("DATABASE_URL 环境变量未设置");
	process.exit(1);
}

async function createBackup(): Promise<string> {
	if (!DATABASE_URL) {
		throw new Error("DATABASE_URL 环境变量未设置");
	}

	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const filename = `backup-${timestamp}.sql.gz`;
	const filepath = join(BACKUP_DIR, filename);

	// 确保备份目录存在
	if (!existsSync(BACKUP_DIR)) {
		mkdirSync(BACKUP_DIR, { recursive: true });
	}

	console.log(`开始备份数据库到: ${filepath}`);

	const sql = postgres(DATABASE_URL, { max: 1 });

	try {
		// 导出数据库结构
		const tables = await sql`
			SELECT tablename
			FROM pg_tables
			WHERE schemaname = 'public'
		`;

		let dump = "-- Database backup\n";
		dump += `-- Generated at: ${new Date().toISOString()}\n\n`;

		for (const { tablename } of tables) {
			console.log(`导出表: ${tablename}`);

			// 表结构
			const schema = await sql.unsafe<TableColumn[]>(
				`
				SELECT column_name, data_type, is_nullable, column_default
				FROM information_schema.columns
				WHERE table_name = $1
				ORDER BY ordinal_position
			`,
				[tablename],
			);

			dump += `\n-- Table: ${tablename}\n`;
			dump += `DROP TABLE IF EXISTS ${tablename} CASCADE;\n`;

			const columns = schema.map((c) => c.column_name).join(", ");
			const createTableSQL = `CREATE TABLE ${tablename} (${schema
				.map((c) => {
					let colDef = `"${c.column_name}" ${c.data_type}`;
					if (c.is_nullable === "NO") colDef += " NOT NULL";
					if (c.column_default) colDef += ` DEFAULT ${c.column_default}`;
					return colDef;
				})
				.join(", ")})`;
			dump += `${createTableSQL};\n`;

			// 数据
			const rows = await sql.unsafe(`SELECT * FROM ${tablename}`);
			for (const row of rows) {
				const values = Object.values(row)
					.map((v) => (v === null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`))
					.join(", ");
				dump += `INSERT INTO ${tablename} (${columns}) VALUES (${values});\n`;
			}
		}

		// 压缩并写入文件
		const compressed = await gzipAsync(Buffer.from(dump, "utf-8"));
		const writeStream = createWriteStream(filepath);
		await new Promise<void>((resolve, reject) => {
			writeStream.write(compressed, (err) => {
				if (err) reject(err);
				else {
					writeStream.end();
					resolve();
				}
			});
		});

		console.log(`备份完成: ${filepath}`);
		return filepath;
	} finally {
		await sql.end();
	}
}

async function cleanupOldBackups(): Promise<void> {
	const { readdirSync, statSync, unlinkSync } = await import("node:fs");

	const files = readdirSync(BACKUP_DIR)
		.filter((f) => f.startsWith("backup-") && f.endsWith(".sql.gz"))
		.map((f) => ({
			name: f,
			filepath: join(BACKUP_DIR, f),
			time: statSync(join(BACKUP_DIR, f)).mtime,
		}))
		.sort((a, b) => b.time.getTime() - a.time.getTime());

	const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;

	for (const file of files) {
		if (file.time.getTime() < cutoff) {
			console.log(`删除过期备份: ${file.name}`);
			unlinkSync(file.filepath);
		}
	}
}

async function main() {
	try {
		const backupFile = await createBackup();
		console.log(`✅ 备份成功: ${backupFile}`);

		// 清理旧备份
		await cleanupOldBackups();
		console.log("✅ 旧备份清理完成");

		process.exit(0);
	} catch (error) {
		console.error("❌ 备份失败:", error);
		process.exit(1);
	}
}

main();
