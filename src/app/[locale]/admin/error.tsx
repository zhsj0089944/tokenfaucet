"use client";

import { AlertTriangle, ArrowLeft, Home, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logger } from "@/lib/logger";

type ErrorBoundaryProps = {
	error: Error & { digest?: string };
	reset: () => void;
};

export default function AdminErrorPage({ error, reset }: ErrorBoundaryProps) {
	useEffect(() => {
		logger.error("Admin page error", error);
	}, [error]);

	const getErrorMessage = (err: Error) => {
		const message = err.message || "";

		if (message.includes("UNAUTHORIZED") || message.includes("请先登录")) {
			return {
				title: "登录已过期",
				description: "您的登录状态已过期，请重新登录后重试。",
				showLogin: true,
			};
		}

		if (message.includes("FORBIDDEN") || message.includes("管理员权限")) {
			return {
				title: "权限不足",
				description: "您没有管理员权限，无法访问此页面。",
				showLogin: false,
			};
		}

		if (message.includes("禁用") || message.includes("封禁")) {
			return {
				title: "账户异常",
				description: message,
				showLogin: false,
			};
		}

		return {
			title: "页面加载失败",
			description: "管理后台加载时出现错误，请尝试刷新页面或返回首页。",
			showLogin: false,
		};
	};

	const errorInfo = getErrorMessage(error);

	return (
		<div className="flex min-h-[60vh] items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
						<AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
					</div>
					<CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
						{errorInfo.title}
					</CardTitle>
				</CardHeader>
				<CardContent className="text-center space-y-4">
					<p className="text-gray-600 dark:text-gray-300">{errorInfo.description}</p>

					{process.env.NODE_ENV === "development" && (
						<div className="text-left bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm">
							<p className="font-mono text-red-600 dark:text-red-400 text-xs break-all">
								{error.message}
							</p>
						</div>
					)}

					<div className="flex flex-col sm:flex-row gap-3 justify-center">
						<Button onClick={reset} variant="outline">
							<RefreshCw className="w-4 h-4 mr-2" />
							重试
						</Button>

						{errorInfo.showLogin ? (
							<Button
								onClick={() => {
									window.location.href = "/auth/login";
								}}
							>
								<ArrowLeft className="w-4 h-4 mr-2" />
								前往登录
							</Button>
						) : (
							<Button
								onClick={() => {
									window.location.href = "/";
								}}
							>
								<Home className="w-4 h-4 mr-2" />
								返回首页
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
