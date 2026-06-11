import { relations } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

// ===============================
// 邀请码表
// ===============================
export const invitationCodes = pgTable(
	"invitation_codes",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// 邀请人用户ID
		inviterId: text("inviter_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),

		// 邀请码（8位唯一码）
		code: varchar("code", { length: 16 }).notNull().unique(),

		// 邀请码状态
		status: varchar("status", { length: 20 }).notNull().default("active"),
		// active: 有效
		// used: 已被使用
		// expired: 已过期

		// 使用次数限制（默认1次）
		maxUses: integer("max_uses").notNull().default(1),

		// 已使用次数
		usedCount: integer("used_count").notNull().default(0),

		// 过期时间（默认永不过期）
		expiresAt: timestamp("expires_at"),

		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		inviterIdIdx: index("invitation_codes_inviter_id_idx").on(table.inviterId),
		codeIdx: index("invitation_codes_code_idx").on(table.code),
		statusIdx: index("invitation_codes_status_idx").on(table.status),
	}),
);

// ===============================
// 邀请关系表
// ===============================
export const invitationRecords = pgTable(
	"invitation_records",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// 邀请人用户ID
		inviterId: text("inviter_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),

		// 被邀请人用户ID
		inviteeId: text("invitee_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),

		// 使用的邀请码
		code: varchar("code", { length: 16 }).notNull(),

		// 奖励状态
		status: varchar("status", { length: 20 }).notNull().default("active"),
		// active: 进行中
		// completed: 已完成（5天奖励发放完毕）
		// cancelled: 已取消

		// 已发放奖励天数（0-5）
		rewardDaysClaimed: integer("reward_days_claimed").notNull().default(0),

		// 最近一次奖励发放时间
		lastRewardAt: timestamp("last_reward_at"),

		// 首次成功发放奖励时间
		firstRewardAt: timestamp("first_reward_at"),

		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		inviterIdIdx: index("invitation_records_inviter_id_idx").on(table.inviterId),
		inviteeIdIdx: index("invitation_records_invitee_id_idx").on(table.inviteeId),
		codeIdx: index("invitation_records_code_idx").on(table.code),
		statusIdx: index("invitation_records_status_idx").on(table.status),
	}),
);

// ===============================
// 类型导出
// ===============================
export type InvitationCode = typeof invitationCodes.$inferSelect;
export type NewInvitationCode = typeof invitationCodes.$inferInsert;

export type InvitationRecord = typeof invitationRecords.$inferSelect;
export type NewInvitationRecord = typeof invitationRecords.$inferInsert;

// ===============================
// 枚举定义
// ===============================

export enum InvitationCodeStatus {
	ACTIVE = "active",
	USED = "used",
	EXPIRED = "expired",
}

export enum InvitationRecordStatus {
	ACTIVE = "active",
	COMPLETED = "completed",
	CANCELLED = "cancelled",
}

// ===============================
// 关系定义
// ===============================

export const invitationCodesRelations = relations(invitationCodes, ({ one }) => ({
	inviter: one(users, {
		fields: [invitationCodes.inviterId],
		references: [users.id],
	}),
}));

export const invitationRecordsRelations = relations(invitationRecords, ({ one }) => ({
	inviter: one(users, {
		fields: [invitationRecords.inviterId],
		references: [users.id],
	}),
	invitee: one(users, {
		fields: [invitationRecords.inviteeId],
		references: [users.id],
	}),
}));
