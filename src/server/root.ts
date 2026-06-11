import { adminAnalyticsRouter } from "./routers/admin-analytics";
import { adminDashboardRouter } from "./routers/admin-dashboard";
import { adminSubscriptionsRouter } from "./routers/admin-subscriptions";
import { adminTtsRouter } from "./routers/admin-tts";
import { adminUsersRouter } from "./routers/admin-users";
import { auditLogsRouter } from "./routers/audit-logs";
import { authRouter } from "./routers/auth";
import { paymentsRouter } from "./routers/payments";
import { pointsRouter } from "./routers/points";
import { systemRouter } from "./routers/system";
import { ttsRouter } from "./routers/tts";
import { ttsVoicesRouter } from "./routers/tts-voices";
import { usersRouter } from "./routers/users";
import { createTRPCRouter } from "./server";

export const appRouter = createTRPCRouter({
	auth: authRouter,
	users: usersRouter,
	payments: paymentsRouter,
	points: pointsRouter,
	system: systemRouter,
	auditLogs: auditLogsRouter,
	tts: ttsRouter,
	ttsVoices: ttsVoicesRouter,
	adminAnalytics: adminAnalyticsRouter,
	adminSubscriptions: adminSubscriptionsRouter,
	adminTts: adminTtsRouter,
	adminUsers: adminUsersRouter,
	adminDashboard: adminDashboardRouter,
});

// 导出类型定义，用于客户端类型推断
export type AppRouter = typeof appRouter;
