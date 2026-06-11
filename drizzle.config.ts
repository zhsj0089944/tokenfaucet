import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL 环境变量未配置");
}

export default defineConfig({
	out: "./src/drizzle/migrations",
	schema: "./src/drizzle/schemas",
	dialect: "postgresql",
	strict: true,
	verbose: true,
	dbCredentials: {
		url: databaseUrl,
		ssl: process.env.NODE_ENV === "production", // 生产环境启用 SSL，开发环境可禁用
	},
});
