import { index, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

// ===============================
// 系统配置历史表
// ===============================

export const configHistory = pgTable(
	"config_history",
	{
		id: serial("id").primaryKey(),

		// 配置信息
		configKey: varchar("config_key", { length: 255 }).notNull(),
		category: varchar("category", { length: 50 }).notNull(),

		// 变更内容
		oldValue: text("old_value"),
		newValue: text("new_value").notNull(),
		changeType: varchar("change_type", { length: 20 }).notNull(), // created, updated, deleted

		// 操作信息
		changedBy: varchar("changed_by", { length: 255 }), // 操作人ID
		changedByEmail: varchar("changed_by_email", { length: 255 }), // 操作人邮箱
		changeReason: text("change_reason"), // 变更原因

		// IP 信息
		ipAddress: varchar("ip_address", { length: 45 }),

		// 时间戳
		createdAt: timestamp("created_at").defaultNow().notNull(),

		// 额外的上下文信息
		context: jsonb("context").$type<{
			userAgent?: string;
			browserInfo?: string;
			metadata?: Record<string, unknown>;
		}>(),
	},
	(table) => ({
		// 索引优化查询性能
		configKeyIdx: index("config_history_key_idx").on(table.configKey),
		categoryIdx: index("config_history_category_idx").on(table.category),
		changedByIdx: index("config_history_changed_by_idx").on(table.changedBy),
		createdAtIdx: index("config_history_created_at_idx").on(table.createdAt),
		changeTypeIdx: index("config_history_change_type_idx").on(table.changeType),

		// 复合索引
		keyCreatedAtIdx: index("config_history_key_created_idx").on(table.configKey, table.createdAt),
	}),
);

// ===============================
// 类型定义
// ===============================

export type ConfigHistory = typeof configHistory.$inferSelect;
export type NewConfigHistory = typeof configHistory.$inferInsert;

// ===============================
// 变更类型枚举
// ===============================

export enum ConfigChangeType {
	CREATED = "created",
	UPDATED = "updated",
	DELETED = "deleted",
	RESTORED = "restored",
	RESET = "reset",
}
