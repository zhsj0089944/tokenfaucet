import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { users } from "@/drizzle/schemas";
import { auth } from "@/lib/auth/better-auth/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

const maintenanceTasks = {
	backup: "/api/cron/backup",
	cleanup: "/api/admin/cleanup",
	membership: "/api/admin/membership-expiration",
	reminder: "/api/admin/membership-expiration-reminder",
} as const;

type MaintenanceTaskId = keyof typeof maintenanceTasks;

const isMaintenanceTaskId = (taskId: unknown): taskId is MaintenanceTaskId =>
	typeof taskId === "string" && taskId in maintenanceTasks;

export async function POST(request: NextRequest) {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const user = await db.query.users.findFirst({
		where: eq(users.id, session.user.id),
		columns: {
			id: true,
			adminLevel: true,
			isActive: true,
			banned: true,
		},
	});

	if (!user || !user.isActive || user.banned || (user.adminLevel ?? 0) < 1) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const cronSecret = process.env.CRON_SECRET;
	if (!cronSecret) {
		logger.error("CRON_SECRET not configured for maintenance task proxy");
		return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
	}

	const body = (await request.json().catch(() => null)) as { taskId?: unknown } | null;
	if (!isMaintenanceTaskId(body?.taskId)) {
		return NextResponse.json({ error: "Invalid maintenance task" }, { status: 400 });
	}

	const taskUrl = new URL(maintenanceTasks[body.taskId], request.url);
	const response = await fetch(taskUrl, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${cronSecret}`,
			"Content-Type": "application/json",
		},
		cache: "no-store",
		signal: AbortSignal.timeout(30_000),
	});

	const data = (await response.json().catch(() => ({}))) as unknown;
	return NextResponse.json(data, { status: response.status });
}
