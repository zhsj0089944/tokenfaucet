import { index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

/**
 * Webhook 事件表 - 用于存储已处理的 webhook 事件，确保幂等性
 */
export const webhookEvents = pgTable(
	"webhook_events",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// 事件唯一标识（由事件类型 + 业务ID 组成）
		eventId: varchar("event_id", { length: 500 }).notNull().unique(),

		// 事件类型
		eventType: varchar("event_type", { length: 100 }).notNull(),

		// 事件来源
		source: varchar("source", { length: 50 }).notNull(), // creem

		// 原始事件数据（可选，用于调试）
		payload: text("payload"),

		// 处理状态
		status: varchar("status", { length: 50 }).notNull().default("processed"), // processed, failed

		// 处理结果/错误信息
		result: text("result"),

		// 处理时间
		processedAt: timestamp("processed_at").defaultNow().notNull(),

		// 创建时间
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		eventIdIdx: index("webhook_events_event_id_idx").on(table.eventId),
		sourceIdx: index("webhook_events_source_idx").on(table.source),
		processedAtIdx: index("webhook_events_processed_at_idx").on(table.processedAt),
	}),
);

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;
