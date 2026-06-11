"use client";

import {
	AlertTriangle,
	CheckCircle2,
	Clock,
	Globe,
	Loader2,
	Moon,
	Save,
	Settings as SettingsIcon,
	Sun,
	User,
	XCircle,
	Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SUPPORTED_LANGUAGES } from "@/constants/auth";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { trpc } from "@/server/client";

export default function SettingsPage() {
	const t = useTranslations("settings");
	const locale = useLocale();
	const { theme, setTheme } = useTheme();
	const { user, isLoading: authLoading } = useAuth();
	const router = useRouter();

	const [activeTab, setActiveTab] = useState("profile");
	const [fullName, setFullName] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	const { data: currentUser, isLoading: userLoading } = trpc.auth.getCurrentUser.useQuery(
		undefined,
		{ enabled: !!user },
	);

	const { data: pointsData } = trpc.points.getBalance.useQuery(undefined, {
		enabled: !!user,
	});

	const updateProfile = trpc.auth.updateProfile.useMutation({
		onSuccess: () => {
			toast.success(t("profile.success"));
		},
		onError: () => {
			toast.error(t("profile.error"));
		},
	});

	useEffect(() => {
		if (currentUser?.fullName) {
			setFullName(currentUser.fullName);
		}
	}, [currentUser]);

	const handleSaveProfile = async () => {
		if (!fullName.trim()) return;
		setIsSaving(true);
		await updateProfile.mutateAsync({ fullName: fullName.trim() });
		setIsSaving(false);
	};

	const handleLanguageChange = (lang: string) => {
		if (lang !== locale) {
			router.push(`/${lang}/settings`);
		}
	};

	if (authLoading || userLoading) {
		return <SettingsSkeleton />;
	}

	if (!user) {
		return (
			<div className="container max-w-5xl mx-auto py-12 px-4">
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-16">
						<AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
						<p className="text-lg font-medium text-muted-foreground">{t("loginFirst")}</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	const userData = currentUser || user;
	const initials =
		userData.fullName?.charAt(0).toUpperCase() || userData.email?.charAt(0).toUpperCase() || "U";
	const isVerified = userData.emailVerified;
	const isAdmin = userData.isAdmin;
	const roleLabel = isAdmin
		? userData.adminLevel && userData.adminLevel >= 2
			? "Super Admin"
			: "Admin"
		: "User";

	return (
		<div className="container max-w-5xl mx-auto py-8 px-4">
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
				<p className="text-muted-foreground mt-1">{t("description")}</p>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
				<TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
					<TabsTrigger value="profile" className="gap-2">
						<User className="h-4 w-4" />
						<span className="hidden sm:inline">{t("tabs.profile")}</span>
					</TabsTrigger>
					<TabsTrigger value="preferences" className="gap-2">
						<SettingsIcon className="h-4 w-4" />
						<span className="hidden sm:inline">{t("tabs.preferences")}</span>
					</TabsTrigger>
					<TabsTrigger value="points" className="gap-2">
						<Zap className="h-4 w-4" />
						<span className="hidden sm:inline">{t("tabs.points", { defaultValue: "Points" })}</span>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="profile" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>{t("profile.title")}</CardTitle>
							<CardDescription>{t("profile.subtitle")}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="flex items-center gap-6">
								<Avatar className="h-20 w-20">
									<AvatarFallback className="text-2xl bg-primary/10 text-primary">
										{initials}
									</AvatarFallback>
								</Avatar>
								<div className="space-y-1">
									<h3 className="font-semibold text-lg">{userData.fullName || userData.email}</h3>
									<div className="flex items-center gap-2 flex-wrap">
										<Badge variant={isVerified ? "default" : "secondary"} className="gap-1">
											{isVerified ? (
												<CheckCircle2 className="h-3 w-3" />
											) : (
												<XCircle className="h-3 w-3" />
											)}
											{isVerified ? t("profile.emailVerified") : t("profile.emailNotVerified")}
										</Badge>
										{isAdmin && (
											<Badge variant="destructive" className="gap-1">
												{roleLabel}
											</Badge>
										)}
									</div>
								</div>
							</div>

							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label>{t("profile.username")}</Label>
									<Input
										value={fullName}
										onChange={(e) => setFullName(e.target.value)}
										placeholder={t("profile.enterUsername")}
									/>
								</div>
								<div className="space-y-2">
									<Label>{t("profile.email")}</Label>
									<Input value={userData.email || ""} disabled className="bg-muted" />
								</div>
							</div>

							<div className="grid gap-4 md:grid-cols-3">
								<div className="space-y-2">
									<Label>{t("profile.role")}</Label>
									<div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm">
										{roleLabel}
									</div>
								</div>
								<div className="space-y-2">
									<Label>{t("profile.registered")}</Label>
									<div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm">
										{userData.createdAt
											? new Date(userData.createdAt).toLocaleDateString(locale)
											: t("unknown")}
									</div>
								</div>
								<div className="space-y-2">
									<Label>{t("profile.status")}</Label>
									<div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm gap-2">
										<span
											className={cn(
												"h-2 w-2 rounded-full",
												userData.isActive ? "bg-green-500" : "bg-red-500",
											)}
										/>
										{userData.isActive ? t("profile.active") : t("profile.disabled")}
									</div>
								</div>
							</div>

							<div className="flex justify-end">
								<Button onClick={handleSaveProfile} disabled={isSaving || !fullName.trim()}>
									{isSaving ? (
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									) : (
										<Save className="h-4 w-4 mr-2" />
									)}
									{isSaving ? t("profile.saving") : t("profile.save")}
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="preferences" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>{t("preferences.title")}</CardTitle>
							<CardDescription>{t("preferences.subtitle")}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="p-2 rounded-lg bg-primary/10">
											<Sun className="h-5 w-5 text-primary dark:hidden" />
											<Moon className="h-5 w-5 text-primary hidden dark:block" />
										</div>
										<div>
											<p className="font-medium">{t("preferences.theme")}</p>
											<p className="text-sm text-muted-foreground">{t("preferences.subtitle")}</p>
										</div>
									</div>
									<div className="flex gap-1 bg-muted p-1 rounded-lg">
										{(["light", "dark", "system"] as const).map((tValue) => (
											<Button
												key={tValue}
												variant={theme === tValue ? "secondary" : "ghost"}
												size="sm"
												onClick={() => setTheme(tValue)}
												className="gap-1"
											>
												{tValue === "light" && <Sun className="h-4 w-4" />}
												{tValue === "dark" && <Moon className="h-4 w-4" />}
												{tValue === "system" && <Globe className="h-4 w-4" />}
												<span className="hidden sm:inline">{t(`preferences.${tValue}`)}</span>
											</Button>
										))}
									</div>
								</div>

								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="p-2 rounded-lg bg-primary/10">
											<Globe className="h-5 w-5 text-primary" />
										</div>
										<div>
											<p className="font-medium">{t("preferences.language")}</p>
											<p className="text-sm text-muted-foreground">{t("preferences.subtitle")}</p>
										</div>
									</div>
									<div className="flex gap-1 bg-muted p-1 rounded-lg">
										{SUPPORTED_LANGUAGES.map((lang) => (
											<Button
												key={lang.code}
												variant={locale === lang.code ? "secondary" : "ghost"}
												size="sm"
												onClick={() => handleLanguageChange(lang.code)}
											>
												{lang.nativeName}
											</Button>
										))}
									</div>
								</div>

								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="p-2 rounded-lg bg-primary/10">
											<Clock className="h-5 w-5 text-primary" />
										</div>
										<div>
											<p className="font-medium">{t("preferences.timezone")}</p>
											<p className="text-sm text-muted-foreground">{t("preferences.subtitle")}</p>
										</div>
									</div>
									<div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm">
										{Intl.DateTimeFormat().resolvedOptions().timeZone}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="points" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Zap className="h-5 w-5" />
								{t("tabs.points", { defaultValue: "Points" })}
							</CardTitle>
							<CardDescription>{t("profile.subtitle")}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{pointsData ? (
								<>
									<div className="grid gap-4 md:grid-cols-3">
										<div className="p-4 rounded-lg bg-muted/50">
											<p className="text-sm text-muted-foreground">
												{t("profile.dailyPoints", { defaultValue: "Daily Points" })}
											</p>
											<p className="text-2xl font-bold mt-1">{pointsData.dailyBalance}</p>
										</div>
										<div className="p-4 rounded-lg bg-muted/50">
											<p className="text-sm text-muted-foreground">
												{t("profile.monthlyPoints", { defaultValue: "Monthly Points" })}
											</p>
											<p className="text-2xl font-bold mt-1">{pointsData.monthlyBalance}</p>
										</div>
										<div className="p-4 rounded-lg bg-muted/50">
											<p className="text-sm text-muted-foreground">
												{t("profile.totalPoints", { defaultValue: "Total Points" })}
											</p>
											<p className="text-2xl font-bold mt-1 text-primary">
												{pointsData.totalBalance}
											</p>
										</div>
									</div>
									{pointsData.isSubscribed && (
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<CheckCircle2 className="h-4 w-4 text-green-500" />
											{t("profile.subscribedHint", {
												defaultValue: "You have an active subscription",
											})}
										</div>
									)}
								</>
							) : (
								<Skeleton className="h-24 w-full" />
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

function SettingsSkeleton() {
	return (
		<div className="container max-w-5xl mx-auto py-8 px-4">
			<Skeleton className="h-10 w-48 mb-2" />
			<Skeleton className="h-5 w-96 mb-8" />
			<Skeleton className="h-10 w-[400px] mb-6" />
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32 mb-2" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex items-center gap-6">
						<Skeleton className="h-20 w-20 rounded-full" />
						<div className="space-y-2">
							<Skeleton className="h-5 w-40" />
							<Skeleton className="h-4 w-24" />
						</div>
					</div>
					<Skeleton className="h-px w-full" />
					<div className="grid gap-4 md:grid-cols-2">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
