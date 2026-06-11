import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { URL } from "node:url";
import { promisify } from "node:util";
import { gzip } from "node:zlib";
import { type NextRequest, NextResponse } from "next/server";
import postgres from "postgres";
import { logger } from "@/lib/logger";

const DATABASE_URL = process.env.DATABASE_URL;
const BACKUP_DIR = process.env.BACKUP_DIR || "/tmp/backups";
const gzipAsync = promisify(gzip);

type TableColumn = {
	column_name: string;
	data_type: string;
	is_nullable: "YES" | "NO";
	column_default: string | null;
};

// SSL 配置：与 db.ts 保持一致，自建 PostgreSQL 不需要 SSL
const backupSslConfig = (() => {
	const sslEnv = process.env.DATABASE_SSL?.toLowerCase();
	if (sslEnv === "false" || sslEnv === "0") return false;
	if (sslEnv === "true" || sslEnv === "1") return { rejectUnauthorized: false };
	try {
		const dbUrl = new URL(DATABASE_URL || "");
		const hostname = dbUrl.hostname;
		if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
			return false;
		}
	} catch {
		return false;
	}
	return { rejectUnauthorized: false };
})();

// 表名合法性校验：仅允许字母、下划线开头，后跟字母、数字、下划线
const isValidTableName = (name: string): boolean => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);

export async function POST(request: NextRequest) {
	if (!DATABASE_URL) {
		logger.error("DATABASE_URL not configured");
		return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
	}

	const authHeader = request.headers.get("authorization");
	const cronSecret = process.env.CRON_SECRET;
	if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const filename = `backup-${timestamp}.sql.gz`;
		const filepath = join(BACKUP_DIR, filename);

		if (!existsSync(BACKUP_DIR)) {
			mkdirSync(BACKUP_DIR, { recursive: true });
		}

		logger.info("Starting database backup", { filepath });

		const sql = postgres(DATABASE_URL, { max: 1, ssl: backupSslConfig });

		try {
			const tables = await sql`
				SELECT tablename
				FROM pg_tables
				WHERE schemaname = 'public'
			`;

			let dump = `-- Database backup\n-- Generated at: ${new Date().toISOString()}\n\n`;

			for (const { tablename } of tables) {
				// 校验表名合法性，防止 SQL 注入
				if (!isValidTableName(tablename)) {
					logger.warn("跳过非法表名", { tablename });
					continue;
				}

				const schema = await sql.unsafe<TableColumn[]>(
					`
					SELECT column_name, data_type, is_nullable, column_default
					FROM information_schema.columns
					WHERE table_name = $1
					ORDER BY ordinal_position
				`,
					[tablename],
				);

				const quoted = `"${tablename}"`;
				dump += `\n-- Table: ${tablename}\n`;
				dump += `DROP TABLE IF EXISTS ${quoted} CASCADE;\n`;

				const columns = schema.map((c) => `"${c.column_name}"`).join(", ");
				const createTableSQL = `CREATE TABLE ${quoted} (${schema
					.map((c) => {
						let colDef = `"${c.column_name}" ${c.data_type}`;
						if (c.is_nullable === "NO") colDef += " NOT NULL";
						if (c.column_default) colDef += ` DEFAULT ${c.column_default}`;
						return colDef;
					})
					.join(", ")})`;
				dump += `${createTableSQL};\n`;

				const rows = await sql.unsafe(`SELECT * FROM ${quoted}`);
				for (const row of rows) {
					const values = Object.values(row)
						.map((v) => (v === null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`))
						.join(", ");
					dump += `INSERT INTO ${quoted} (${columns}) VALUES (${values});\n`;
				}
			}

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

			logger.info("Database backup completed", { filepath, size: dump.length });
		} finally {
			await sql.end();
		}

		return NextResponse.json({ success: true, filepath });
	} catch (error) {
		logger.error(
			"Database backup failed",
			error instanceof Error ? error : new Error(String(error)),
		);
		return NextResponse.json({ error: "Backup failed" }, { status: 500 });
	}
}
