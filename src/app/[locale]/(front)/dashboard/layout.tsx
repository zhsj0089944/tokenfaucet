import type { ReactNode } from "react";
import { AuthProviders } from "@/components/common/auth-providers";

/**
 * Dashboard 路由组布局 — 需要登录态
 * BaseProviders 由根 layout 提供，AuthProviders 在此追加
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
	return <AuthProviders>{children}</AuthProviders>;
}
