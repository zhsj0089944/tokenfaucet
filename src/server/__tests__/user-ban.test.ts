import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import type { Context } from "../server";
import { mockTrpcContext } from "./helpers";

// Mock the protectedProcedure middleware behavior
function mockProtectedProcedure(ctx: Context) {
	if (!(ctx.userId && ctx.user)) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "请先登录" });
	}

	const user = ctx.user as {
		deletedAt?: Date | null;
		isActive?: boolean | null;
		banned?: boolean | null;
		banExpires?: Date | null;
		banReason?: string | null;
	};

	if (user.deletedAt) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "账户已被删除，如有疑问请联系客服",
		});
	}

	if (user.isActive === false) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "账户已被禁用，如有疑问请联系客服",
		});
	}

	if (user.banned) {
		if (user.banExpires && new Date(user.banExpires) < new Date()) {
			// 封禁已过期，允许继续
		} else {
			const banReason = user.banReason || "违反平台规则";
			const banExpiresText = user.banExpires
				? `封禁至 ${new Date(user.banExpires).toLocaleDateString("zh-CN")}`
				: "永久封禁";
			throw new TRPCError({
				code: "FORBIDDEN",
				message: `账户已被封禁：${banReason}（${banExpiresText}）`,
			});
		}
	}

	return true;
}

describe("ProtectedProcedure - User Ban Check", () => {
	it("should allow normal user", () => {
		const ctx = mockTrpcContext();
		expect(() => mockProtectedProcedure(ctx as Context)).not.toThrow();
	});

	it("should reject deleted user", () => {
		const ctx = mockTrpcContext({
			user: {
				id: "test-user-id",
				email: "test@example.com",
				deletedAt: new Date(),
				isActive: true,
				banned: false,
			},
		});
		expect(() => mockProtectedProcedure(ctx as Context)).toThrow(TRPCError);
		try {
			mockProtectedProcedure(ctx as Context);
		} catch (e) {
			expect((e as TRPCError).code).toBe("UNAUTHORIZED");
			expect((e as TRPCError).message).toContain("账户已被删除");
		}
	});

	it("should reject disabled user", () => {
		const ctx = mockTrpcContext({
			user: {
				id: "test-user-id",
				email: "test@example.com",
				isActive: false,
				banned: false,
			},
		});
		expect(() => mockProtectedProcedure(ctx as Context)).toThrow(TRPCError);
		try {
			mockProtectedProcedure(ctx as Context);
		} catch (e) {
			expect((e as TRPCError).code).toBe("FORBIDDEN");
			expect((e as TRPCError).message).toContain("账户已被禁用");
		}
	});

	it("should reject banned user", () => {
		const ctx = mockTrpcContext({
			user: {
				id: "test-user-id",
				email: "test@example.com",
				isActive: true,
				banned: true,
				banReason: "恶意刷积分",
				banExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
			},
		});
		expect(() => mockProtectedProcedure(ctx as Context)).toThrow(TRPCError);
		try {
			mockProtectedProcedure(ctx as Context);
		} catch (e) {
			expect((e as TRPCError).code).toBe("FORBIDDEN");
			expect((e as TRPCError).message).toContain("账户已被封禁");
			expect((e as TRPCError).message).toContain("恶意刷积分");
		}
	});

	it("should allow user with expired ban", () => {
		const ctx = mockTrpcContext({
			user: {
				id: "test-user-id",
				email: "test@example.com",
				isActive: true,
				banned: true,
				banReason: "临时封禁",
				banExpires: new Date(Date.now() - 24 * 60 * 60 * 1000), // 已过期
			},
		});
		expect(() => mockProtectedProcedure(ctx as Context)).not.toThrow();
	});
});
