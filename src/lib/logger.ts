/**
 * 统一日志系统
 * 提供结构化日志、审计日志、请求上下文追踪、敏感信息脱敏
 */

// --- 日志级别 ---

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

function getLogLevel(): LogLevel {
	const level = process.env.LOG_LEVEL?.toLowerCase();
	switch (level) {
		case "debug":
			return LogLevel.DEBUG;
		case "info":
			return LogLevel.INFO;
		case "warn":
			return LogLevel.WARN;
		case "error":
			return LogLevel.ERROR;
		default:
			return process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG;
	}
}

const currentLogLevel = getLogLevel();

// --- 字段脱敏 ---

const SENSITIVE_KEYS = new Set([
	"password",
	"token",
	"secret",
	"apiKey",
	"api_key",
	"authorization",
	"cookie",
	"creem_signature",
	"payment_intent",
	"paymentIntentId",
	"email",
	"phone",
	"address",
	"passport",
	"ssn",
	"credit_card",
	"card",
	"cvv",
]);

function sanitizeValue(key: string, value: unknown): unknown {
	if (typeof value === "string" && SENSITIVE_KEYS.has(key.toLowerCase())) {
		return value.length > 8 ? `${value.slice(0, 4)}***${value.slice(-4)}` : "***";
	}
	if (typeof value === "object" && value !== null && !Array.isArray(value)) {
		return sanitizeRecord(value as Record<string, unknown>);
	}
	return value;
}

function sanitizeRecord(record: Record<string, unknown>): Record<string, unknown> {
	const sanitized: Record<string, unknown> = {};
	for (const [key, val] of Object.entries(record)) {
		sanitized[key] = sanitizeValue(key, val);
	}
	return sanitized;
}

function shouldSanitize(): boolean {
	return process.env.NODE_ENV === "production" || process.env.SANITIZE_LOGS !== "false";
}

function safeContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
	if (!context) return undefined;
	if (!shouldSanitize()) return context;
	return sanitizeRecord(context);
}

// --- 结构化日志条目 ---

interface LogEntry {
	timestamp: string;
	level: string;
	message: string;
	context?: Record<string, unknown>;
	error?: { message: string; stack?: string; name: string };
}

function formatEntry(entry: LogEntry): string {
	return JSON.stringify(entry);
}

function createEntry(
	level: string,
	message: string,
	context?: Record<string, unknown>,
	error?: Error,
): LogEntry {
	return {
		timestamp: new Date().toISOString(),
		level,
		message,
		context: safeContext(context),
		error: error ? { message: error.message, stack: error.stack, name: error.name } : undefined,
	};
}

// --- Logger 实例 ---

export interface Logger {
	debug(message: string, context?: Record<string, unknown>): void;
	info(message: string, context?: Record<string, unknown>): void;
	warn(message: string, context?: Record<string, unknown>): void;
	error(message: string, error?: Error, context?: Record<string, unknown>): void;
}

export class StructuredLogger implements Logger {
	private baseContext: Record<string, unknown>;

	constructor(baseContext: Record<string, unknown> = {}) {
		this.baseContext = baseContext;
	}

	debug(message: string, context?: Record<string, unknown>): void {
		if (currentLogLevel <= LogLevel.DEBUG) {
			const entry = createEntry("DEBUG", message, { ...this.baseContext, ...context });
			console.debug(formatEntry(entry));
		}
	}

	info(message: string, context?: Record<string, unknown>): void {
		if (currentLogLevel <= LogLevel.INFO) {
			const entry = createEntry("INFO", message, { ...this.baseContext, ...context });
			console.log(formatEntry(entry));
		}
	}

	warn(message: string, context?: Record<string, unknown>): void {
		if (currentLogLevel <= LogLevel.WARN) {
			const entry = createEntry("WARN", message, { ...this.baseContext, ...context });
			console.warn(formatEntry(entry));
		}
	}

	error(message: string, error?: Error, context?: Record<string, unknown>): void {
		if (currentLogLevel <= LogLevel.ERROR) {
			const entry = createEntry("ERROR", message, { ...this.baseContext, ...context }, error);
			console.error(formatEntry(entry));
		}
	}
}

// --- 审计日志 ---

interface AuditEntry {
	timestamp: string;
	userId?: string;
	action: string;
	resource: string;
	status: "success" | "failure" | "attempt";
	durationMs?: number;
	metadata?: Record<string, unknown>;
}

export class AuditLogger {
	private logger: Logger;

	constructor(logger?: Logger) {
		this.logger = logger ?? defaultLogger;
	}

	log(entry: AuditEntry): void {
		const context: Record<string, unknown> = {
			audit: true,
			userId: entry.userId,
			action: entry.action,
			resource: entry.resource,
			status: entry.status,
			durationMs: entry.durationMs,
			metadata: entry.metadata,
		};
		this.logger.info(`[AUDIT] ${entry.action} on ${entry.resource}`, context);
	}
}

// --- 请求 Logger 工厂 ---

export function createRequestLogger(requestId: string, userId?: string): Logger {
	return new StructuredLogger({
		requestId,
		userId: userId ?? "anonymous",
	});
}

// --- 默认导出 ---

export const defaultLogger: Logger = new StructuredLogger();

export const auditLogger = new AuditLogger(defaultLogger);

export const logger = defaultLogger;
