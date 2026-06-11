"use client";

import { logger } from "@/lib/logger";
import { authClient } from "./client";

interface SessionData {
	data: {
		user?: {
			id: string;
			name?: string;
			email?: string;
			[key: string]: unknown;
		} | null;
	} | null;
}

/**
 * 全局认证状态管理器
 * 防止重复的 API 调用，提供缓存机制
 */
class AuthStateManager {
	private sessionCache: {
		data: SessionData | null;
		timestamp: number;
		promise: Promise<SessionData | null> | null;
	} = {
		data: null,
		timestamp: 0,
		promise: null,
	};

	private readonly CACHE_DURATION = 30000; // 30秒缓存
	private readonly MIN_REQUEST_INTERVAL = 1000; // 最小请求间隔1秒

	// 请求统计
	private stats = {
		totalRequests: 0,
		cacheHits: 0,
		preventedRequests: 0,
	};

	/**
	 * 获取会话信息，带缓存和防抖
	 */
	async getSession(force = false): Promise<SessionData | null> {
		const now = Date.now();

		// 如果有正在进行的请求，等待其完成
		if (this.sessionCache.promise) {
			return await this.sessionCache.promise;
		}

		// 如果缓存有效且不是强制刷新，返回缓存
		if (
			!force &&
			this.sessionCache.data &&
			now - this.sessionCache.timestamp < this.CACHE_DURATION
		) {
			this.stats.cacheHits++;
			return this.sessionCache.data;
		}

		// 防抖：如果距离上次请求时间太近，返回缓存
		if (!force && now - this.sessionCache.timestamp < this.MIN_REQUEST_INTERVAL) {
			this.stats.preventedRequests++;
			return this.sessionCache.data;
		}

		// 发起新请求
		this.sessionCache.promise = this.fetchSession();

		try {
			const result = await this.sessionCache.promise;
			this.sessionCache.data = result;
			this.sessionCache.timestamp = now;
			return result;
		} catch (error) {
			logger.error(
				"Session fetch failed",
				error instanceof Error ? error : new Error(String(error)),
			);
			throw error;
		} finally {
			this.sessionCache.promise = null;
		}
	}

	private async fetchSession(): Promise<SessionData | null> {
		this.stats.totalRequests++;

		try {
			const session = await authClient.getSession();
			return session as unknown as SessionData;
		} catch (error) {
			logger.error(
				"Session request failed",
				error instanceof Error ? error : new Error(String(error)),
			);
			throw error;
		}
	}

	/**
	 * 清除缓存
	 */
	clearCache() {
		this.sessionCache = {
			data: null,
			timestamp: 0,
			promise: null,
		};
	}

	/**
	 * 检查缓存是否有效
	 */
	isCacheValid(): boolean {
		const now = Date.now();
		return !!this.sessionCache.data && now - this.sessionCache.timestamp < this.CACHE_DURATION;
	}

	/**
	 * 获取缓存的用户信息（不发起请求）
	 */
	getCachedUser() {
		return this.sessionCache.data?.data?.user || null;
	}

	/**
	 * 强制同步认证状态，等待直到状态更新完成
	 */
	async waitForAuthSync(maxAttempts = 5, interval = 200): Promise<boolean> {
		let attempts = 0;

		while (attempts < maxAttempts) {
			// 强制获取最新状态
			const session = await this.getSession(true);

			if (session?.data?.user) {
				return true;
			}

			attempts++;

			if (attempts < maxAttempts) {
				await new Promise((resolve) => setTimeout(resolve, interval));
			}
		}

		return false;
	}

	/**
	 * 获取性能统计
	 */
	getStats() {
		return {
			...this.stats,
			cacheEfficiency:
				this.stats.totalRequests > 0
					? Math.round((this.stats.cacheHits / this.stats.totalRequests) * 100)
					: 0,
		};
	}

	/**
	 * 重置统计
	 */
	resetStats() {
		this.stats = {
			totalRequests: 0,
			cacheHits: 0,
			preventedRequests: 0,
		};
	}
}

// 全局单例
export const authStateManager = new AuthStateManager();

// 用于调试的方法
if (typeof window !== "undefined") {
	(window as unknown as { authStateManager: typeof authStateManager }).authStateManager =
		authStateManager;
}
