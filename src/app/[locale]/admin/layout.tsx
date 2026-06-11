"use client";

import { useLocale } from "next-intl";
import { AdminLayoutComponent } from "@/components/admin/admin-layout";
import { AdminGuardClient } from "@/components/auth";
import { AuthProviders } from "@/components/common/auth-providers";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	const locale = useLocale();

	return (
		<AuthProviders>
			<AdminGuardClient>
				<AdminLayoutComponent locale={locale}>{children}</AdminLayoutComponent>
			</AdminGuardClient>
		</AuthProviders>
	);
}
