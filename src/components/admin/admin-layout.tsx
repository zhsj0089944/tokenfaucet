"use client";

import {
	Activity,
	BarChart3,
	CreditCard,
	DollarSign,
	Home,
	Key,
	LayoutDashboard,
	Megaphone,
	Mic,
	Settings,
	Shield,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn, localizePath } from "@/lib/utils";

interface NavItem {
	title: string;
	href: string;
	icon: React.ElementType;
	badge?: string;
	children?: NavItem[];
}

function NavItemComponent({
	item,
	locale,
	pathname,
}: {
	item: NavItem;
	locale: string;
	pathname: string;
}) {
	const [expanded, setExpanded] = useState(false);
	const hasChildren = item.children && item.children.length > 0;
	const localizedHref = localizePath(locale, item.href);
	const isActive =
		pathname === localizedHref || (item.href !== "/admin" && pathname.startsWith(localizedHref));
	const hasActiveChild = hasChildren
		? item.children?.some(
				(child) =>
					pathname === localizePath(locale, child.href) ||
					pathname.startsWith(localizePath(locale, child.href)),
			)
		: false;

	const Icon = item.icon;

	if (hasChildren) {
		return (
			<div>
				<button
					type="button"
					onClick={() => setExpanded(!expanded)}
					className={cn(
						"flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors",
						hasActiveChild
							? "bg-secondary text-secondary-foreground"
							: "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
					)}
				>
					<Icon className="h-4 w-4 mr-3 shrink-0" />
					<span className="flex-1 text-left">{item.title}</span>
					{item.badge && (
						<Badge variant="secondary" className="ml-auto text-[10px] h-5">
							{item.badge}
						</Badge>
					)}
					<svg
						className={cn("h-4 w-4 ml-1 shrink-0 transition-transform", expanded && "rotate-90")}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
				</button>
				{expanded && (
					<div className="ml-4 mt-1 space-y-1">
						{item.children?.map((child) => {
							const childLocalizedHref = localizePath(locale, child.href);
							const isChildActive =
								pathname === childLocalizedHref || pathname.startsWith(childLocalizedHref);
							const ChildIcon = child.icon;
							return (
								<Link
									key={child.href}
									href={childLocalizedHref}
									className={cn(
										"flex items-center px-3 py-1.5 text-sm rounded-md transition-colors",
										isChildActive
											? "bg-secondary text-secondary-foreground font-medium"
											: "text-muted-foreground hover:text-foreground hover:bg-secondary/30",
									)}
								>
									<ChildIcon className="h-3.5 w-3.5 mr-3 shrink-0" />
									{child.title}
								</Link>
							);
						})}
					</div>
				)}
			</div>
		);
	}

	return (
		<Link
			href={localizedHref}
			className={cn(
				"flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
				isActive
					? "bg-secondary text-secondary-foreground"
					: "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
			)}
		>
			<Icon className="h-4 w-4 mr-3 shrink-0" />
			<span className="flex-1">{item.title}</span>
			{item.badge && (
				<Badge variant="secondary" className="ml-auto text-[10px] h-5">
					{item.badge}
				</Badge>
			)}
		</Link>
	);
}

export function AdminLayoutComponent({
	children,
	locale,
}: {
	children: React.ReactNode;
	locale: string;
}) {
	const t = useTranslations("admin");
	const pathname = usePathname();

	const navItems: NavItem[] = [
		{
			title: t("sidebar.dashboard"),
			href: "/admin",
			icon: LayoutDashboard,
		},
		{
			title: t("sidebar.users"),
			href: "/admin/users",
			icon: Users,
			children: [
				{ title: t("sidebar.userList"), href: "/admin/users", icon: Users },
				{ title: t("sidebar.deletedUsers"), href: "/admin/users/deleted", icon: Activity },
			],
		},
		{
			title: t("sidebar.finance"),
			href: "/admin/finance",
			icon: DollarSign,
			children: [
				{ title: t("sidebar.payments"), href: "/admin/payments", icon: CreditCard },
				{ title: t("sidebar.subscriptions"), href: "/admin/subscriptions", icon: Activity },
				{ title: t("sidebar.revenue"), href: "/admin/revenue", icon: BarChart3 },
				{ title: t("sidebar.plans"), href: "/admin/plans", icon: Shield },
			],
		},
		{
			title: t("sidebar.tts"),
			href: "/admin/tts",
			icon: Mic,
			children: [
				{ title: t("sidebar.ttsStats"), href: "/admin/tts", icon: BarChart3 },
				{ title: t("sidebar.ttsLogs"), href: "/admin/tts/logs", icon: Activity },
				{ title: t("sidebar.ttsVoices"), href: "/admin/tts/voices", icon: Mic },
			],
		},
		{
			title: t("sidebar.marketing"),
			href: "/admin/marketing",
			icon: Megaphone,
			children: [
				{ title: t("sidebar.invitations"), href: "/admin/invitations", icon: Users },
				{ title: t("sidebar.announcements"), href: "/admin/announcements", icon: Megaphone },
			],
		},
		{
			title: t("sidebar.apiKeys"),
			href: "/admin/api-keys",
			icon: Key,
		},
		{
			title: t("sidebar.settings"),
			href: "/admin/settings",
			icon: Settings,
			children: [
				{ title: t("sidebar.config"), href: "/admin/settings", icon: Settings },
				{ title: t("sidebar.permissions"), href: "/admin/permissions", icon: Shield },
				{ title: t("sidebar.maintenance"), href: "/admin/maintenance", icon: Activity },
			],
		},
		{
			title: t("sidebar.auditLogs"),
			href: "/admin/audit-logs",
			icon: Activity,
		},
	];

	return (
		<div className="flex h-screen bg-background">
			<aside className="w-64 border-r bg-card flex flex-col">
				<div className="p-5 border-b">
					<div className="flex items-center gap-2">
						<div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
							<span className="text-primary-foreground font-bold text-sm">TF</span>
						</div>
						<div>
							<h2 className="font-semibold text-sm">TokenFaucet</h2>
							<p className="text-xs text-muted-foreground">{t("sidebar.title")}</p>
						</div>
					</div>
				</div>

				<ScrollArea className="flex-1 py-3">
					<nav className="px-3 space-y-1">
						{navItems.map((item) => (
							<NavItemComponent key={item.href} item={item} locale={locale} pathname={pathname} />
						))}
					</nav>
				</ScrollArea>

				<div className="p-3 border-t space-y-2">
					<Separator />
					<Link href={localizePath(locale, "/")}>
						<Button variant="ghost" size="sm" className="w-full justify-start">
							<Home className="h-4 w-4 mr-2" />
							{t("sidebar.backToHome")}
						</Button>
					</Link>
				</div>
			</aside>

			<main className="flex-1 overflow-y-auto">
				<div className="container mx-auto p-6 max-w-7xl">{children}</div>
			</main>
		</div>
	);
}
