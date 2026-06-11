import { vi } from "vitest";
import type { Context } from "../server";

interface MockUser {
	id: string;
	email: string;
	fullName?: string | null;
	adminLevel?: number | null;
	isActive?: boolean | null;
	deletedAt?: Date | null;
	banned?: boolean | null;
	banReason?: string | null;
	banExpires?: Date | null;
}

interface MockLogger {
	info: ReturnType<typeof vi.fn>;
	error: ReturnType<typeof vi.fn>;
	warn: ReturnType<typeof vi.fn>;
}

export function mockTrpcContext(
	overrides: Partial<{ userId: string | null; user: MockUser; logger: MockLogger }> = {},
) {
	return {
		db: {
			query: {
				users: { findFirst: vi.fn() },
				membershipPlans: { findFirst: vi.fn() },
				userMemberships: { findFirst: vi.fn() },
				userUsageLimits: { findFirst: vi.fn() },
				paymentRecords: { findFirst: vi.fn() },
			},
			select: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			leftJoin: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			orderBy: vi.fn().mockReturnThis(),
			limit: vi.fn().mockReturnThis(),
			update: vi.fn().mockReturnThis(),
			set: vi.fn().mockReturnThis(),
			insert: vi.fn().mockReturnThis(),
			values: vi.fn().mockReturnThis(),
		},
		userId: overrides.userId ?? "test-user-id",
		user: overrides.user ?? { id: "test-user-id", email: "test@example.com" },
		logger: overrides.logger ?? {
			info: vi.fn(),
			error: vi.fn(),
			warn: vi.fn(),
			debug: vi.fn(),
		},
		headers: new Headers(),
	} as unknown as Context;
}

export function createMockRequest(body: unknown) {
	return {
		json: vi.fn().mockResolvedValue(body),
		text: vi.fn().mockResolvedValue(JSON.stringify(body)),
		headers: new Headers(),
	} as unknown as Request;
}
