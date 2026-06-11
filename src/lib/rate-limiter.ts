import { cacheService } from "@/lib/cache";
import { logger } from "@/lib/logger";

// 限流配置接口
interface RateLimitConfig {
	windowMs: number; // 时间窗口（毫秒）
	maxRequests: number; // 最大请求数
	message?: string; // 超限消息
	skipSuccessfulRequests?: boolean; // 是否跳过成功请求
	skipFailedRequests?: boolean; // 是否跳过失败请求
	keyGenerator?: (identifier: string) => string; // 自定义键生成器
}

// 限流结果接口
interface RateLimitResult {
	allowed: boolean; // 是否允许
	totalHits: number; // 总请求数
	timeToReset: number; // 重置时间（毫秒）
	remaining: number; // 剩余请求数
}

// 限流器类
class RateLimiter {
	private config: RateLimitConfig & { failClosed?: boolean };

	constructor(config: RateLimitConfig & { failClosed?: boolean }) {
		this.config = {
			message: "Too many requests",
			skipSuccessfulRequests: false,
			skipFailedRequests: false,
			keyGenerator: (identifier: string) => `tokenfaucet:rate-limit:${identifier}`,
			...config,
		};
	}

	private resolveKey(identifier: string) {
		const generator =
			this.config.keyGenerator ?? ((value: string) => `tokenfaucet:rate-limit:${value}`);
		return generator(identifier);
	}

	// 检查并记录请求（使用原子操作）
	async checkLimit(identifier: string): Promise<RateLimitResult> {
		const key = this.resolveKey(identifier);
		const windowMs = this.config.windowMs;

		try {
			// 使用原子递增操作，确保检查和记录是原子的
			const ttlSeconds = Math.ceil(windowMs / 1000);
			const currentRequests = await cacheService.incr(key, ttlSeconds);

			// 检查是否超限
			const allowed = currentRequests <= this.config.maxRequests;
			const remaining = Math.max(0, this.config.maxRequests - currentRequests);

			// 如果超限，递减回去
			if (!allowed) {
				await cacheService.decr(key);
			}

			// 计算重置时间（简化版本，使用窗口时间）
			const timeToReset = windowMs;

			return {
				allowed,
				totalHits: allowed ? currentRequests : currentRequests - 1,
				timeToReset,
				remaining: allowed ? remaining : 0,
			};
		} catch (error) {
			logger.error(`限流检查失败 ${identifier}:`, error as Error);
			// failClosed 模式：安全敏感端点（登录、密码重置等）Redis 故障时拒绝请求
			// failOpen 模式：普通端点 Redis 故障时允许请求，避免整个站点不可用
			if (this.config.failClosed) {
				return {
					allowed: false,
					totalHits: this.config.maxRequests,
					timeToReset: this.config.windowMs,
					remaining: 0,
				};
			}
			return {
				allowed: true,
				totalHits: 1,
				timeToReset: this.config.windowMs,
				remaining: this.config.maxRequests - 1,
			};
		}
	}

	// 重置限流器
	async reset(identifier: string): Promise<void> {
		const key = this.resolveKey(identifier);
		await cacheService.del(key);
	}

	// 获取限流状态（使用原子操作实现，不依赖已删除的方法）
	async getStatus(identifier: string): Promise<{
		requests: number;
		remaining: number;
		resetTime: number;
	}> {
		const key = this.resolveKey(identifier);
		const now = Date.now();

		// 获取当前计数（从缓存读取，不改变值）
		const currentRequests = await cacheService.get<number>(key);
		const requests = currentRequests && currentRequests > 0 ? currentRequests : 0;
		const remaining = Math.max(0, this.config.maxRequests - requests);
		const resetTime = now + this.config.windowMs;

		return {
			requests,
			remaining,
			resetTime,
		};
	}
}

// 预定义的限流配置
export const RateLimitConfigs = {
	// 严格限制（如登录）
	strict: {
		windowMs: 15 * 60 * 1000, // 15分钟
		maxRequests: 5,
		message: "请求过于频繁，请稍后再试",
	},

	// 一般API限制
	api: {
		windowMs: 60 * 1000, // 1分钟
		maxRequests: 100,
		message: "API请求频率过高",
	},

	// 宽松限制（如获取数据）
	loose: {
		windowMs: 60 * 1000, // 1分钟
		maxRequests: 1000,
		message: "请求频率过高",
	},

	// 免费用户限制
	freeUser: {
		windowMs: 60 * 60 * 1000, // 1小时
		maxRequests: 100,
		message: "免费用户请求限制，请升级到付费计划",
	},

	// 付费用户限制
	paidUser: {
		windowMs: 60 * 60 * 1000, // 1小时
		maxRequests: 1000,
		message: "请求频率过高，请稍后再试",
	},

	// 上传限制
	upload: {
		windowMs: 60 * 60 * 1000, // 1小时
		maxRequests: 50,
		message: "上传频率过高，请稍后再试",
	},

	// ========== 认证相关限流 ==========

	// 发送验证码（按IP）
	sendCode: {
		windowMs: 60 * 1000, // 1分钟
		maxRequests: 10,
		message: "发送验证码过于频繁，请稍后再试",
	},

	// 登录（按IP）
	login: {
		windowMs: 60 * 1000, // 1分钟
		maxRequests: 20,
		message: "登录请求过于频繁，请稍后再试",
	},

	// 注册（按IP）
	register: {
		windowMs: 60 * 1000, // 1分钟
		maxRequests: 10,
		message: "注册请求过于频繁，请稍后再试",
	},

	// 密码重置（按IP）
	passwordReset: {
		windowMs: 60 * 1000, // 1分钟
		maxRequests: 10,
		message: "密码重置请求过于频繁，请稍后再试",
	},

	// 全局认证限流（按IP，覆盖所有认证入口）
	globalAuth: {
		windowMs: 60 * 1000, // 1分钟
		maxRequests: 30, // 所有认证相关请求加起来不超过30次/分钟
		message: "认证请求过于频繁，请稍后再试",
	},
} as const;

// 创建限流器实例
export const createRateLimiter = (config: RateLimitConfig & { failClosed?: boolean }) =>
	new RateLimiter(config);

// 预定义的限流器
export const rateLimiters = {
	strict: createRateLimiter(RateLimitConfigs.strict),
	api: createRateLimiter(RateLimitConfigs.api),
	loose: createRateLimiter(RateLimitConfigs.loose),
	freeUser: createRateLimiter(RateLimitConfigs.freeUser),
	paidUser: createRateLimiter(RateLimitConfigs.paidUser),
	upload: createRateLimiter(RateLimitConfigs.upload),
	// 认证相关（failClosed: Redis 故障时拒绝请求，防止暴力破解）
	sendCode: createRateLimiter({ ...RateLimitConfigs.sendCode, failClosed: true }),
	login: createRateLimiter({ ...RateLimitConfigs.login, failClosed: true }),
	register: createRateLimiter({ ...RateLimitConfigs.register, failClosed: true }),
	passwordReset: createRateLimiter({ ...RateLimitConfigs.passwordReset, failClosed: true }),
	globalAuth: createRateLimiter({ ...RateLimitConfigs.globalAuth, failClosed: true }),
};

// 限流中间件类型
export type RateLimitMiddleware = (
	identifier: string,
	config?: Partial<RateLimitConfig>,
) => Promise<RateLimitResult>;

// 通用限流中间件
export const rateLimit: RateLimitMiddleware = async (identifier: string, config = {}) => {
	const limiter = createRateLimiter({
		...RateLimitConfigs.api,
		...config,
	});

	return limiter.checkLimit(identifier);
};

// IP限流
export const rateLimitByIP = (ip: string, config?: Partial<RateLimitConfig>) =>
	rateLimit(`ip:${ip}`, config);

// 用户限流
export const rateLimitByUser = (userId: string, config?: Partial<RateLimitConfig>) =>
	rateLimit(`user:${userId}`, config);

// API路径限流
export const rateLimitByPath = (ip: string, path: string, config?: Partial<RateLimitConfig>) =>
	rateLimit(`path:${ip}:${path}`, config);

// 全局API限流
export const rateLimitGlobal = (config?: Partial<RateLimitConfig>) => rateLimit("global", config);

// 根据用户类型限流
export const rateLimitByUserType = async (
	userId: string,
	isPaidUser: boolean,
	config?: Partial<RateLimitConfig>,
): Promise<RateLimitResult> => {
	const baseConfig = isPaidUser ? RateLimitConfigs.paidUser : RateLimitConfigs.freeUser;
	return rateLimitByUser(userId, { ...baseConfig, ...config });
};

// 多级限流（同时检查多个限制）
export const multiLevelRateLimit = async (
	checks: Array<{
		identifier: string;
		config?: Partial<RateLimitConfig>;
		name?: string;
	}>,
): Promise<{
	allowed: boolean;
	failedCheck?: string;
	results: RateLimitResult[];
}> => {
	const results: RateLimitResult[] = [];

	for (const check of checks) {
		const result = await rateLimit(check.identifier, check.config);
		results.push(result);

		if (!result.allowed) {
			return {
				allowed: false,
				failedCheck: check.name || check.identifier,
				results,
			};
		}
	}

	return {
		allowed: true,
		results,
	};
};

// 限流装饰器
export function RateLimit(config: RateLimitConfig) {
	return (_target: unknown, _propertyName: string, descriptor: PropertyDescriptor) => {
		const method = descriptor.value;
		const limiter = createRateLimiter(config);

		descriptor.value = async function (...args: unknown[]) {
			// 尝试从参数中提取标识符
			const firstArg = args[0] as Record<string, unknown> | undefined;
			const identifier = (firstArg?.userId as string) || (firstArg?.ip as string) || "anonymous";

			const result = await limiter.checkLimit(identifier);

			if (!result.allowed) {
				throw new Error(config.message || "Rate limit exceeded");
			}

			return method.apply(this, args);
		};
	};
}

// 滑动窗口限流器（更精确的限流算法）
export class SlidingWindowRateLimiter {
	private windowMs: number;
	private maxRequests: number;
	private subWindowCount: number;

	constructor(windowMs: number, maxRequests: number, subWindowCount = 10) {
		this.windowMs = windowMs;
		this.maxRequests = maxRequests;
		this.subWindowCount = subWindowCount;
	}

	async checkLimit(identifier: string): Promise<RateLimitResult> {
		const now = Date.now();
		const subWindowMs = this.windowMs / this.subWindowCount;
		const currentWindow = Math.floor(now / subWindowMs);

		// 获取所有子窗口的计数
		const promises = [];
		for (let i = 0; i < this.subWindowCount; i++) {
			const windowKey = `tokenfaucet:sliding:${identifier}:${currentWindow - i}`;
			promises.push(cacheService.get<number>(windowKey));
		}

		const counts = await Promise.all(promises);
		const totalRequests = counts.reduce((sum, count) => (sum || 0) + (count || 0), 0) || 0;

		const allowed = totalRequests < this.maxRequests;

		if (allowed) {
			// 使用原子递增记录当前请求，避免 GET-then-SET 竞态
			const currentWindowKey = `tokenfaucet:sliding:${identifier}:${currentWindow}`;
			await cacheService.incr(currentWindowKey, Math.ceil(this.windowMs / 1000));
		}

		return {
			allowed,
			totalHits: (totalRequests || 0) + (allowed ? 1 : 0),
			timeToReset: subWindowMs - (now % subWindowMs),
			remaining: Math.max(0, this.maxRequests - (totalRequests || 0) - (allowed ? 1 : 0)),
		};
	}
}

// 令牌桶限流器
export class TokenBucketRateLimiter {
	private capacity: number;
	private refillPeriod: number; // 补充周期（毫秒）

	constructor(capacity: number, refillRate: number) {
		this.capacity = capacity;
		this.refillPeriod = 1000 / refillRate; // 每个令牌的补充间隔
	}

	async checkLimit(identifier: string, tokensRequested = 1): Promise<RateLimitResult> {
		const key = `tokenfaucet:bucket:${identifier}`;
		const now = Date.now();

		// 安全：使用 Lua 脚本保证令牌桶操作的原子性，消除竞态条件
		try {
			const luaResult = await cacheService.evalLua(
				`local key = KEYS[1]
				 local capacity = tonumber(ARGV[1])
				 local refill_period = tonumber(ARGV[2])
				 local tokens_requested = tonumber(ARGV[3])
				 local now = tonumber(ARGV[4])
				 local ttl = tonumber(ARGV[5])

				 local data = redis.call('GET', key)
				 local tokens, last_refill
				 if data then
					 local parsed = cjson.decode(data)
					 tokens = tonumber(parsed.tokens)
					 last_refill = tonumber(parsed.lastRefill)
				 else
					 tokens = capacity
					 last_refill = now
				 end

				 local time_passed = now - last_refill
				 local tokens_to_add = math.floor(time_passed / refill_period)
				 local current_tokens = math.min(capacity, tokens + tokens_to_add)

				 local allowed = 0
				 local new_tokens = current_tokens
				 if current_tokens >= tokens_requested then
					 allowed = 1
					 new_tokens = current_tokens - tokens_requested
				 end

				 local new_data = cjson.encode({tokens = new_tokens, lastRefill = now})
				 redis.call('SETEX', key, ttl, new_data)

				 return {allowed, new_tokens}`,
				[key],
				[
					this.capacity.toString(),
					this.refillPeriod.toString(),
					tokensRequested.toString(),
					now.toString(),
					"3600",
				],
			);

			const resultArray = luaResult as number[];
			const allowed = resultArray[0] === 1;
			const newTokens = resultArray[1] ?? 0;

			return {
				allowed,
				totalHits: this.capacity - newTokens,
				timeToReset: allowed ? 0 : this.refillPeriod,
				remaining: newTokens,
			};
		} catch (error) {
			logger.error(`令牌桶限流检查失败 ${identifier}:`, error as Error);
			// 安全：出错时默认拒绝请求（fail-closed）
			return {
				allowed: false,
				totalHits: this.capacity,
				timeToReset: this.refillPeriod,
				remaining: 0,
			};
		}
	}
}

// 分布式限流器（支持多实例部署）
export class DistributedRateLimiter {
	private windowMs: number;
	private maxRequests: number;
	private failClosed: boolean;

	constructor(windowMs: number, maxRequests: number, failClosed = false) {
		this.windowMs = windowMs;
		this.maxRequests = maxRequests;
		this.failClosed = failClosed;
	}

	async checkLimit(identifier: string): Promise<RateLimitResult> {
		const key = `tokenfaucet:distributed:${identifier}`;

		try {
			// 使用原子递增操作，避免 GET-MODIFY-SET 竞态
			const ttlSeconds = Math.ceil(this.windowMs / 1000);
			const currentRequests = await cacheService.incr(key, ttlSeconds);

			const allowed = currentRequests <= this.maxRequests;

			if (!allowed) {
				// 超限则递减回去
				await cacheService.decr(key);
			}

			const timeToReset = this.windowMs;

			return {
				allowed,
				totalHits: allowed ? currentRequests : currentRequests - 1,
				timeToReset,
				remaining: Math.max(
					0,
					this.maxRequests - (allowed ? currentRequests : currentRequests - 1),
				),
			};
		} catch (error) {
			logger.error(`分布式限流检查失败 ${identifier}:`, error as Error);
			if (this.failClosed) {
				return {
					allowed: false,
					totalHits: this.maxRequests,
					timeToReset: this.windowMs,
					remaining: 0,
				};
			}
			return {
				allowed: true,
				totalHits: 1,
				timeToReset: this.windowMs,
				remaining: this.maxRequests - 1,
			};
		}
	}
}

// 自适应限流器（根据系统负载调整限制）
export class AdaptiveRateLimiter {
	private baseLimit: number;
	private windowMs: number;
	private adaptiveFactor: number;

	constructor(baseLimit: number, windowMs: number, adaptiveFactor = 0.1) {
		this.baseLimit = baseLimit;
		this.windowMs = windowMs;
		this.adaptiveFactor = adaptiveFactor;
	}

	async checkLimit(
		identifier: string,
		systemLoad = 0.5, // 0-1之间，表示系统负载
	): Promise<RateLimitResult> {
		// 根据系统负载调整限制
		const adjustedLimit = Math.floor(this.baseLimit * (1 - systemLoad * this.adaptiveFactor));

		const limiter = createRateLimiter({
			windowMs: this.windowMs,
			maxRequests: adjustedLimit,
			keyGenerator: (id) => `tokenfaucet:adaptive:${id}`,
		});

		return limiter.checkLimit(identifier);
	}
}

// 限流工具函数
export const RateLimitUtils = {
	// 获取客户端IP
	// 安全提示：x-forwarded-for 头可被客户端伪造，仅在受信任的反向代理
	// （如 Vercel、Cloudflare、Nginx）后面运行时才可信。
	// 确保反向代理正确覆盖而非追加此头部。
	getClientIP: (request: Request): string => {
		const forwarded = request.headers.get("x-forwarded-for");
		const realIP = request.headers.get("x-real-ip");
		const remoteAddr = request.headers.get("remote-addr");

		if (forwarded) {
			// x-forwarded-for 可包含多个 IP（代理链），取第一个（最左边的客户端 IP）
			// 注意：仅在受信任代理后面时，最左边的 IP 才是真实客户端 IP
			const ips = forwarded.split(",").map((ip) => ip.trim());
			return ips[0] || "unknown";
		}
		return realIP || remoteAddr || "unknown";
	},

	// 生成限流响应头
	generateHeaders: (result: RateLimitResult, config: RateLimitConfig) => ({
		"X-RateLimit-Limit": config.maxRequests.toString(),
		"X-RateLimit-Remaining": result.remaining.toString(),
		"X-RateLimit-Reset": new Date(Date.now() + result.timeToReset).toISOString(),
		"Retry-After": Math.ceil(result.timeToReset / 1000).toString(),
	}),

	// 格式化限流错误消息
	formatError: (result: RateLimitResult, config: RateLimitConfig) => ({
		error: config.message || "Too many requests",
		limit: config.maxRequests,
		remaining: result.remaining,
		resetTime: new Date(Date.now() + result.timeToReset).toISOString(),
	}),

	// ========== 认证相关限流辅助函数 ==========

	// 双语错误消息
	getMessage: (zh: string, request?: Request) => {
		if (request) {
			const referer = request.headers.get("referer") || "";
			const refererMatch = referer.match(/\/(zh|en)\//);
			if (refererMatch) {
				return refererMatch[1] === "zh" ? zh : zh; // 英文版本暂用中文占位
			}
			const acceptLang = request.headers.get("accept-language") || "";
			return acceptLang.includes("zh") ? zh : zh;
		}
		return zh;
	},

	// 认证限流检查（支持双语）
	async checkAuthLimit(
		request: Request,
		type: "sendCode" | "login" | "register" | "passwordReset",
	): Promise<RateLimitResult> {
		const ip = RateLimitUtils.getClientIP(request);
		const limiter = rateLimiters[type];
		return limiter.checkLimit(`auth:${type}:ip:${ip}`);
	},

	// 全局认证限流检查（支持双语）
	async checkGlobalAuthLimit(request: Request): Promise<RateLimitResult> {
		const ip = RateLimitUtils.getClientIP(request);
		return rateLimiters.globalAuth.checkLimit(`global:auth:ip:${ip}`);
	},
};
