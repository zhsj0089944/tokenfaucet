import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { membershipPlans } from "./payments";
import { users } from "./users";

// ===============================
// 用户积分余额表
// ===============================
export const userPoints = pgTable(
	"user_points",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: varchar("user_id", { length: 255 })
			.notNull()
			.unique()
			.references(() => users.id, { onDelete: "cascade" }),

		// 每日积分余额（每天刷新，重置为1680）
		dailyBalance: integer("daily_balance").notNull().default(1680),

		// 最后重置日期（用于判断是否需要重置每日积分）
		lastDailyResetAt: timestamp("last_daily_reset_at").defaultNow(),

		// 每月积分余额（订阅用户专有，每月刷新）
		monthlyBalance: integer("monthly_balance").notNull().default(0),

		// 最后重置月度积分的日期
		lastMonthlyResetAt: timestamp("last_monthly_reset_at").defaultNow(),

		// 累计已发放积分（用于统计）
		totalGranted: integer("total_granted").notNull().default(0),

		// 累计消耗积分
		totalConsumed: integer("total_consumed").notNull().default(0),

		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index("user_points_user_id_idx").on(table.userId),
		dailyBalanceIdx: index("user_points_daily_balance_idx").on(table.dailyBalance),
	}),
);

// ===============================
// 积分变动记录表
// ===============================
export const pointTransactions = pgTable(
	"point_transactions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: varchar("user_id", { length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),

		// 变动类型
		type: varchar("type", { length: 50 }).notNull(),
		// daily_grant: 每日发放
		// subscription_grant: 订阅赠送
		// tts_consume: TTS消耗
		// refund: 退款
		// admin_grant: 管理员赠送
		// admin_deduct: 管理员扣除
		// expire: 过期扣除
		// other: 其他

		// 变动数量（正数为获得，负数为消耗）
		amount: integer("amount").notNull(),

		// 变动前余额
		balanceBefore: integer("balance_before").notNull(),

		// 变动后余额
		balanceAfter: integer("balance_after").notNull(),

		// 关联的业务ID（如 TTS 使用记录 ID）
		businessId: varchar("business_id", { length: 255 }),

		// 变动描述
		description: text("description"),

		// 过期时间（用于积分过期场景）
		expiredAt: timestamp("expired_at"),

		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index("point_transactions_user_id_idx").on(table.userId),
		typeIdx: index("point_transactions_type_idx").on(table.type),
		createdAtIdx: index("point_transactions_created_at_idx").on(table.createdAt),
		businessIdIdx: index("point_transactions_business_id_idx").on(table.businessId),
	}),
);

// ===============================
// 会员计划积分配置表
// ===============================
export const membershipPointConfigs = pgTable(
	"membership_point_configs",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// 关联的会员计划 ID
		planId: uuid("plan_id")
			.notNull()
			.references(() => membershipPlans.id, { onDelete: "cascade" }),

		// 每月赠送积分
		monthlyPoints: integer("monthly_points").notNull().default(0),

		// 每日额外积分（除了基础每日积分之外的）
		dailyBonus: integer("daily_bonus").notNull().default(0),

		// 是否启用
		isActive: boolean("is_active").default(true),

		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		planIdIdx: index("membership_point_configs_plan_id_idx").on(table.planId),
	}),
);

// ===============================
// 类型导出
// ===============================
export type UserPoint = typeof userPoints.$inferSelect;
export type NewUserPoint = typeof userPoints.$inferInsert;

export type PointTransaction = typeof pointTransactions.$inferSelect;
export type NewPointTransaction = typeof pointTransactions.$inferInsert;

export type MembershipPointConfig = typeof membershipPointConfigs.$inferSelect;
export type NewMembershipPointConfig = typeof membershipPointConfigs.$inferInsert;

// ===============================
// 枚举定义
// ===============================

export enum PointTransactionType {
	DAILY_GRANT = "daily_grant", // 每日发放
	SUBSCRIPTION_GRANT = "subscription_grant", // 订阅赠送
	TTS_CONSUME = "tts_consume", // TTS消耗
	REFUND = "refund", // 退款
	ADMIN_GRANT = "admin_grant", // 管理员赠送
	ADMIN_DEDUCT = "admin_deduct", // 管理员扣除
	EXPIRE = "expire", // 过期
	INVITATION_GRANT = "invitation_grant", // 邀请奖励
	OTHER = "other", // 其他
}

// ===============================
// 关系定义
// ===============================

export const userPointsRelations = relations(userPoints, ({ one }) => ({
	user: one(users, {
		fields: [userPoints.userId],
		references: [users.id],
	}),
}));

export const pointTransactionsRelations = relations(pointTransactions, ({ one }) => ({
	user: one(users, {
		fields: [pointTransactions.userId],
		references: [users.id],
	}),
}));
