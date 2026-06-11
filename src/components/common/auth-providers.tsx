"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { PermissionProvider } from "@/components/auth/PermissionProvider";

interface AuthProvidersProps {
	children: ReactNode;
}

/**
 * 认证层 Provider — 仅在需要登录态的路由组中使用
 * AuthProvider → PermissionProvider
 * 注意：TRPCProvider 已提升至 BaseProviders（全局），此处不再重复包裹
 */
export function AuthProviders({ children }: AuthProvidersProps) {
	return (
		<AuthProvider>
			<PermissionProvider>{children}</PermissionProvider>
		</AuthProvider>
	);
}
