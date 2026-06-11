import axios, {
	type AxiosError,
	type AxiosInstance,
	type AxiosRequestConfig,
	type AxiosResponse,
	type InternalAxiosRequestConfig,
} from "axios";
import { logger } from "@/lib/logger";

// 响应数据类型
export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

// 扩展axios配置类型
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
	skipAuth?: boolean;
	skipErrorHandler?: boolean;
}

// 请求配置类型
export interface HttpClientConfig extends AxiosRequestConfig {
	skipAuth?: boolean;
	skipErrorHandler?: boolean;
}

// 创建axios实例
const createHttpClient = (): AxiosInstance => {
	const client = axios.create({
		baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
		timeout: 30000,
		headers: {
			"Content-Type": "application/json",
		},
	});

	// 请求拦截器
	client.interceptors.request.use(
		async (config: ExtendedAxiosRequestConfig) => {
			// Better Auth 使用 HTTP-only cookies，无需在此添加 Authorization 头
			// 此 http-client 主要用于服务端之间的 API 调用

			// 添加请求ID用于追踪
			config.headers = config.headers || {};
			config.headers["X-Request-ID"] =
				`req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

			return config;
		},
		(error) => {
			return Promise.reject(error);
		},
	);

	// 响应拦截器
	client.interceptors.response.use(
		(response: AxiosResponse<ApiResponse>) => {
			// 统一处理成功响应
			return response;
		},
		(error: AxiosError<ApiResponse>) => {
			// 统一错误处理
			const config = error.config as ExtendedAxiosRequestConfig;
			if (!config?.skipErrorHandler) {
				handleHttpError(error);
			}
			return Promise.reject(error);
		},
	);

	return client;
};

// 错误处理函数
const handleHttpError = (error: AxiosError<ApiResponse>) => {
	const { response, request, message } = error;

	if (response) {
		// 服务器响应了错误状态码
		const { status, data } = response;
		const requestId = response.config?.headers?.["X-Request-ID"] as string;

		logger.error("HTTP request failed", new Error(data?.error || data?.message || "请求失败"), {
			category: "http",
			status,
			statusText: response.statusText,
			method: response.config?.method?.toUpperCase(),
			url: response.config?.url,
			requestId,
			responseData: data,
		});

		// 特殊状态码处理
		switch (status) {
			case 401:
				logger.warn("Authentication required", {
					category: "auth",
					url: response.config?.url,
					requestId,
					action: "redirect_to_login",
				});
				break;
			case 403:
				logger.warn("Access forbidden", {
					category: "auth",
					url: response.config?.url,
					requestId,
					action: "show_permission_error",
				});
				break;
			case 404:
				logger.warn("Resource not found", {
					category: "http",
					url: response.config?.url,
					requestId,
					action: "show_not_found",
				});
				break;
			case 429:
				logger.warn("Rate limit exceeded", {
					category: "http",
					url: response.config?.url,
					requestId,
					retryAfter: response.headers["retry-after"],
					action: "retry_later",
				});
				break;
			case 500:
				logger.error("Internal server error", new Error("Internal server error"), {
					category: "http",
					url: response.config?.url,
					requestId,
					action: "show_error_message",
				});
				break;
			default:
				logger.warn("HTTP error", {
					category: "http",
					status,
					url: response.config?.url,
					requestId,
				});
		}
	} else if (request) {
		// 请求已发出但没有收到响应
		logger.error("Network error", new Error("请求超时或网络不可用"), {
			category: "network",
			url: request.responseURL || "unknown",
			timeout: request.timeout,
			action: "retry_request",
		});
	} else {
		// 请求配置错误
		logger.error("Request configuration error", new Error(message), {
			category: "http",
			action: "fix_configuration",
		});
	}
};

// 创建HTTP客户端实例
export const httpClient = createHttpClient();

// 便捷方法
export const http = {
	get: <T = unknown>(url: string, config?: HttpClientConfig) =>
		httpClient.get<ApiResponse<T>>(url, config),

	post: <T = unknown>(url: string, data?: unknown, config?: HttpClientConfig) =>
		httpClient.post<ApiResponse<T>>(url, data, config),

	put: <T = unknown>(url: string, data?: unknown, config?: HttpClientConfig) =>
		httpClient.put<ApiResponse<T>>(url, data, config),

	patch: <T = unknown>(url: string, data?: unknown, config?: HttpClientConfig) =>
		httpClient.patch<ApiResponse<T>>(url, data, config),

	delete: <T = unknown>(url: string, config?: HttpClientConfig) =>
		httpClient.delete<ApiResponse<T>>(url, config),
};

// 文件上传专用方法
export const uploadFile = async (
	url: string,
	file: File | FormData,
	config?: HttpClientConfig & {
		onProgress?: (progress: number) => void;
	},
) => {
	const formData = file instanceof FormData ? file : new FormData();
	if (file instanceof File) {
		formData.append("file", file);
	}

	return httpClient.post<ApiResponse<unknown>>(url, formData, {
		...config,
		headers: {
			"Content-Type": "multipart/form-data",
			...config?.headers,
		},
		onUploadProgress: (progressEvent) => {
			if (progressEvent.total && config?.onProgress) {
				const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
				config.onProgress(progress);
			}
		},
	});
};

// 外部API请求（跳过认证和错误处理）
export const externalHttp = {
	get: <T = unknown>(url: string, config?: AxiosRequestConfig) => axios.get<T>(url, config),

	post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
		axios.post<T>(url, data, config),

	put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
		axios.put<T>(url, data, config),

	delete: <T = unknown>(url: string, config?: AxiosRequestConfig) => axios.delete<T>(url, config),
};

// 导出类型
export type { AxiosError, AxiosRequestConfig, AxiosResponse };
