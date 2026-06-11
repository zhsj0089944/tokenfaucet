import { beforeEach, describe, expect, it, vi } from "vitest";
import { ensurePointsAccount, getPointsConfig } from "../routers/tts/points";
import type { Context } from "../server";

// Mock drizzle-orm
vi.mock("drizzle-orm", async () => {
	const actual = await vi.importActual("drizzle-orm");
	return {
		...actual,
		eq: (a: unknown, b: unknown) => ({ column: a, value: b }),
	};
});

// Mock shared-utils（getUserMembershipInfo 被 ensurePointsAccount 调用）
vi.mock("@/lib/shared-utils", async () => {
	const actual = await vi.importActual("@/lib/shared-utils");
	return {
		...actual,
		getUserMembershipInfo: vi.fn().mockResolvedValue(null),
	};
});

interface MockSystemConfig {
	key: string;
	value: string;
}

interface MockUserPointsRecord {
	id: string;
	userId: string;
	dailyBalance: number;
	monthlyBalance: number;
	totalConsumed: number;
	lastDailyResetAt: Date;
	lastMonthlyResetAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

describe("TTS Points", () => {
	const mockDb = {
		select: vi.fn(),
		insert: vi.fn(),
		transaction: vi.fn(),
	};

	const mockCtx = {
		db: mockDb,
		logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getPointsConfig", () => {
		it("should return default config when no settings found", async () => {
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			});

			const config = await getPointsConfig(mockCtx as unknown as Pick<Context, "db">);

			expect(config.freeDailyPoints).toBe(1680);
			expect(config.ttsCostChinese).toBe(4);
			expect(config.ttsCostEnglish).toBe(2.5);
			expect(config.ttsCostPunctuation).toBe(0.5);
		});

		it("should merge settings from database", async () => {
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([
						{ key: "points.dailyFreePoints", value: "2000" },
						{ key: "points.ttsCostChinese", value: "5" },
					]),
				}),
			});

			const config = await getPointsConfig(mockCtx as unknown as Pick<Context, "db">);

			expect(config.freeDailyPoints).toBe(2000);
			expect(config.ttsCostChinese).toBe(5);
			expect(config.ttsCostEnglish).toBe(2.5); // default
		});
	});

	describe("ensurePointsAccount", () => {
		// 辅助：创建 systemConfigs 查询链（getPointsConfig 用）
		function makeSystemConfigsChain(configs: MockSystemConfig[] = []) {
			return {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(configs),
				}),
			};
		}

		// 辅助：创建 userPoints 查询链（ensurePointsAccount 用）
		function makeUserPointsChain(records: MockUserPointsRecord[]) {
			return {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue(records),
					}),
				}),
			};
		}

		it("should return existing account", async () => {
			const mockRecord: MockUserPointsRecord = {
				id: "123",
				userId: "user-1",
				dailyBalance: 500,
				monthlyBalance: 2000,
				totalConsumed: 100,
				lastDailyResetAt: new Date(),
				lastMonthlyResetAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			// 第一次 select → systemConfigs (getPointsConfig), 第二次 → userPoints
			mockDb.select
				.mockReturnValueOnce(makeSystemConfigsChain())
				.mockReturnValueOnce(makeUserPointsChain([mockRecord]));

			const result = await ensurePointsAccount(
				mockCtx as unknown as Pick<Context, "db" | "logger">,
				"user-1",
			);

			expect(result.dailyBalance).toBe(500);
			expect(result.monthlyBalance).toBe(2000);
		});

		it("should create new account if not exists", async () => {
			// 第一次 select → systemConfigs, 第二次 → userPoints (空)
			mockDb.select
				.mockReturnValueOnce(makeSystemConfigsChain())
				.mockReturnValueOnce(makeUserPointsChain([]));

			mockDb.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
				const tx = {
					insert: vi.fn().mockReturnValue({
						values: vi.fn().mockResolvedValue(undefined),
					}),
				};
				return await fn(tx);
			});

			const result = await ensurePointsAccount(
				mockCtx as unknown as Pick<Context, "db" | "logger">,
				"user-2",
			);

			expect(result.dailyBalance).toBe(1680); // default freeDailyPoints
			expect(result.monthlyBalance).toBe(0);
		});

		it("should reset daily balance if new day", async () => {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			const mockRecord: MockUserPointsRecord = {
				id: "123",
				userId: "user-1",
				dailyBalance: 0,
				monthlyBalance: 2000,
				totalConsumed: 100,
				lastDailyResetAt: yesterday,
				lastMonthlyResetAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockDb.select
				.mockReturnValueOnce(makeSystemConfigsChain())
				.mockReturnValueOnce(makeUserPointsChain([mockRecord]));

			mockDb.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
				const tx = {
					update: vi.fn().mockReturnValue({
						set: vi.fn().mockReturnValue({
							where: vi.fn().mockResolvedValue(undefined),
						}),
					}),
					insert: vi.fn().mockReturnValue({
						values: vi.fn().mockResolvedValue(undefined),
					}),
				};
				return await fn(tx);
			});

			const result = await ensurePointsAccount(
				mockCtx as unknown as Pick<Context, "db" | "logger">,
				"user-1",
			);

			expect(result.dailyBalance).toBe(1680); // reset to default
		});

		it("should reset monthly balance if new month", async () => {
			const lastMonth = new Date();
			lastMonth.setMonth(lastMonth.getMonth() - 1);

			const mockRecord: MockUserPointsRecord = {
				id: "123",
				userId: "user-1",
				dailyBalance: 500,
				monthlyBalance: 0,
				totalConsumed: 100,
				lastDailyResetAt: new Date(),
				lastMonthlyResetAt: lastMonth,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockDb.select
				.mockReturnValueOnce(makeSystemConfigsChain())
				.mockReturnValueOnce(makeUserPointsChain([mockRecord]));

			mockDb.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
				const tx = {
					update: vi.fn().mockReturnValue({
						set: vi.fn().mockReturnValue({
							where: vi.fn().mockResolvedValue(undefined),
						}),
					}),
					insert: vi.fn().mockReturnValue({
						values: vi.fn().mockResolvedValue(undefined),
					}),
				};
				return await fn(tx);
			});

			const result = await ensurePointsAccount(
				mockCtx as unknown as Pick<Context, "db" | "logger">,
				"user-1",
			);

			expect(result.monthlyBalance).toBe(0); // stays 0 since no subscription
		});
	});
});
