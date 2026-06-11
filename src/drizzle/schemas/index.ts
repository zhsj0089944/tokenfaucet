// ===============================
// 导入所有表定义
// ===============================

import { auditLogs } from "./audit-logs";
import { configHistory } from "./config-history";
import { invitationCodes, invitationRecords } from "./invitations";
import {
	coupons,
	membershipPlans,
	paymentRecords,
	type UserMembership,
	type UserUsageLimit,
	userMemberships,
	userUsageLimits,
} from "./payments";
import { membershipPointConfigs, pointTransactions, userPoints } from "./points";
import * as relations from "./relations";
import { apiKeys, notifications, systemConfigs } from "./system";
import { ttsUsageRecords, userVoices } from "./tts";
import { accounts, loginLogs, sessions, users, verificationTokens } from "./users";
import { webhookEvents } from "./webhook-events";

// ===============================
// 审计日志模块导出
// ===============================
export {
	AuditAction,
	type AuditLog,
	AuditModule,
	AuditResource,
	AuditSeverity,
	auditLogs,
	type NewAuditLog,
} from "./audit-logs";
export type { NewConfigHistory } from "./config-history";
export { ConfigChangeType, configHistory } from "./config-history";

// ===============================
// 邀请模块导出
// ===============================
export {
	type InvitationCode,
	InvitationCodeStatus,
	type InvitationRecord,
	InvitationRecordStatus,
	invitationCodes,
	invitationRecords,
	type NewInvitationCode,
	type NewInvitationRecord,
} from "./invitations";

// ===============================
// 支付模块导出
// ===============================
export {
	type Coupon,
	coupons,
	DiscountType,
	DurationType,
	type MembershipPlan,
	MembershipStatus,
	membershipPlans,
	type NewCoupon,
	type NewMembershipPlan,
	type NewPaymentRecord,
	type NewUserMembership,
	type NewUserUsageLimit,
	type PaymentRecord,
	PaymentSource,
	PaymentStatus,
	paymentRecords,
	type UserMembership,
	type UserUsageLimit,
	userMemberships,
	userUsageLimits,
} from "./payments";

// ===============================
// 积分模块导出
// ===============================
export {
	type MembershipPointConfig,
	membershipPointConfigs,
	type NewMembershipPointConfig,
	type NewPointTransaction,
	type NewUserPoint,
	type PointTransaction,
	PointTransactionType,
	pointTransactions,
	pointTransactionsRelations,
	type UserPoint,
	userPoints,
	userPointsRelations,
} from "./points";

export type {
	ApiKey,
	NewApiKey,
	NewNotification,
	NewSystemConfig,
	Notification,
	SystemConfig,
} from "./system";

// ===============================
// 系统模块导出
// ===============================
export {
	ApiScope,
	apiKeys,
	ConfigCategory,
	ConfigDataType,
	NotificationPriority,
	NotificationType,
	notifications,
	systemConfigs,
} from "./system";

// ===============================
// TTS模块导出
// ===============================
export {
	type NewTtsUsageRecord,
	type NewUserVoice,
	type TtsUsageRecord,
	ttsUsageRecords,
	type UserVoice,
	userVoices,
} from "./tts";

// ===============================
// 用户模块导出
// ===============================
export {
	type Account,
	AdminLevel,
	accounts,
	Currency,
	Language,
	type LoginLog,
	loginLogs,
	type NewAccount,
	type NewLoginLog,
	type NewSession,
	type NewUser,
	type NewVerificationToken,
	type Session,
	sessions,
	Theme,
	type User,
	users,
	type VerificationToken,
	verificationTokens,
} from "./users";

// ===============================
// Webhook 事件模块导出
// ===============================
export {
	type NewWebhookEvent,
	type WebhookEvent,
	webhookEvents,
} from "./webhook-events";

// ===============================
// 所有表的联合导出 (用于Drizzle Kit)
// ===============================
export const schema = {
	// 用户模块 (已整合 Better Auth)
	users,
	sessions,
	accounts,
	verificationTokens,
	loginLogs,

	// 支付模块
	membershipPlans,
	userMemberships,
	paymentRecords,
	userUsageLimits,
	coupons,

	// 系统模块
	apiKeys,
	notifications,
	systemConfigs,
	configHistory,

	// TTS模块
	userVoices,
	ttsUsageRecords,

	// 积分模块
	userPoints,
	pointTransactions,
	membershipPointConfigs,

	// 邀请模块
	invitationCodes,
	invitationRecords,

	// 审计日志模块
	auditLogs,

	// Webhook 事件模块
	webhookEvents,

	// 关系定义
	...relations,
};

// ===============================
// 全局类型定义
// ===============================

// 通用查询结果类型
export type PaginationResult<T> = {
	data: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
};

// API响应类型
export type ApiResponse<T = unknown> = {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
};

// 数据库事务类型
export type DatabaseTransaction = Parameters<
	Parameters<typeof import("@/lib/db").db.transaction>[0]
>[0];

// 查询过滤器类型
export type QueryFilters = {
	page?: number;
	limit?: number;
	search?: string;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
	startDate?: Date;
	endDate?: Date;
};

// 用户权限检查结果
export type PermissionCheck = {
	hasPermission: boolean;
	reason?: string;
	membership?: UserMembership;
	limits?: UserUsageLimit;
};
