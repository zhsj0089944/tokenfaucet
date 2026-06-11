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
import { users } from "./users";

// ===============================
// 用户保存的音色表
// ===============================
export const userVoices = pgTable(
	"user_voices",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: varchar("user_id", { length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),

		name: varchar("name", { length: 100 }).notNull(),
		description: text("description"),

		// 音色类型: preset(预置) / design(设计) / clone(复刻)
		voiceType: varchar("voice_type", { length: 20 }).notNull().default("clone"),

		// TTS 提供商: minimax / mimo
		provider: varchar("provider", { length: 20 }).notNull().default("minimax"),

		// 预置音色ID（如果是预置类型）
		presetVoiceId: varchar("preset_voice_id", { length: 50 }),

		// 音色设计描述（如果是设计类型）
		designPrompt: text("design_prompt"),

		// 复刻音频的base64或URL（如果是复刻类型）
		cloneAudioData: text("clone_audio_data"),
		cloneAudioUrl: text("clone_audio_url"),

		// 音色元数据（JSON格式，存储额外信息）
		metadata: text("metadata"),

		isActive: boolean("is_active").default(true),
		isDefault: boolean("is_default").default(false),

		usageCount: integer("usage_count").default(0),
		lastUsedAt: timestamp("last_used_at"),

		// 复刻音色过期时间（保存后3个月）
		expiresAt: timestamp("expires_at"),

		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index("user_voices_user_id_idx").on(table.userId),
		voiceTypeIdx: index("user_voices_type_idx").on(table.voiceType),
		activeIdx: index("user_voices_active_idx").on(table.isActive),
	}),
);

// ===============================
// TTS使用记录表
// ===============================
export const ttsUsageRecords = pgTable(
	"tts_usage_records",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: varchar("user_id", { length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),

		// 使用的音色ID（可以是user_voices.id或预置音色ID）
		voiceId: varchar("voice_id", { length: 100 }),
		voiceType: varchar("voice_type", { length: 20 }).notNull().default("preset"),

		// 输入文本长度
		textLength: integer("text_length").default(0),

		// 使用的模型
		model: varchar("model", { length: 50 }).default("mimo-v2.5-tts"),

		// 音频格式
		audioFormat: varchar("audio_format", { length: 10 }).default("wav"),

		// 音频大小（字节）
		audioSize: integer("audio_size"),

		// 生成耗时（毫秒）
		duration: integer("duration"),

		// 是否成功
		isSuccess: boolean("is_success").default(true),

		// 错误信息
		errorMessage: text("error_message"),

		// 客户端IP
		ipAddress: varchar("ip_address", { length: 45 }),

		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index("tts_usage_user_id_idx").on(table.userId),
		createdAtIdx: index("tts_usage_created_at_idx").on(table.createdAt),
		voiceIdIdx: index("tts_usage_voice_id_idx").on(table.voiceId),
	}),
);

// ===============================
// 类型导出
// ===============================
export type UserVoice = typeof userVoices.$inferSelect;
export type NewUserVoice = typeof userVoices.$inferInsert;

export type TtsUsageRecord = typeof ttsUsageRecords.$inferSelect;
export type NewTtsUsageRecord = typeof ttsUsageRecords.$inferInsert;
