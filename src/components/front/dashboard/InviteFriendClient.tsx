"use client";

import { CheckCircle, Copy, Crown, Gift, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/auth";
import { logger } from "@/lib/logger";

interface InvitationCode {
	code: string;
	status: string;
	usedCount: number;
	maxUses: number;
	createdAt: string;
}

interface InvitationRecord {
	id: string;
	inviteeId: string;
	code: string;
	status: string;
	earnedPoints: number;
}

interface InvitationSummary {
	totalInvited?: number;
	totalEarned?: number;
	activeInvitations?: number;
}

interface InvitationData {
	codes: InvitationCode[];
	invitations: InvitationRecord[];
	summary: InvitationSummary;
}

export function InviteFriendClient() {
	const t = useTranslations("dashboard");
	const { isAuthenticated } = useAuth();
	const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [copiedCode, setCopiedCode] = useState<string | null>(null);
	const VOICE_UNLOCK_COUNT = 3;
	const COPY_FEEDBACK_DURATION = 1500;

	const fetchInvitationData = useCallback(async () => {
		if (!isAuthenticated) return;

		try {
			const response = await fetch("/api/invitation/list");
			if (response.ok) {
				const data = await response.json();
				setInvitationData(data);
			}
		} catch (error) {
			logger.error(
				"Failed to fetch invitation data",
				error instanceof Error ? error : new Error(String(error)),
			);
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated]);

	useEffect(() => {
		fetchInvitationData();
	}, [fetchInvitationData]);

	if (!isAuthenticated) return null;

	if (isLoading) {
		return <InviteFriendSkeleton />;
	}

	const codes = invitationData?.codes || [];
	const invitations = invitationData?.invitations || [];
	const summary = invitationData?.summary || {};

	// 计算统计数据
	const totalInvited = summary.totalInvited || invitations.length;
	const totalEarned =
		summary.totalEarned ||
		invitations.reduce((sum: number, inv: InvitationRecord) => sum + (inv.earnedPoints || 0), 0);
	const _activeInvitations = summary.activeInvitations || 0;
	const voiceUnlocked = totalInvited >= VOICE_UNLOCK_COUNT;

	// 显示第一个邀请码（如果有的话）
	const firstCode = codes[0]?.code;

	const handleCopyCode = async (code?: string) => {
		const codeToCopy = code || firstCode;
		if (!codeToCopy) return;

		try {
			await navigator.clipboard.writeText(codeToCopy);
			setCopiedCode(codeToCopy);
			setTimeout(() => setCopiedCode(null), COPY_FEEDBACK_DURATION);
		} catch {
			toast.error(t("copyFailed") || "Failed to copy");
		}
	};

	return (
		<Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Gift className="h-5 w-5 text-purple-500" />
					{t("inviteFriends")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="text-center">
					<p className="text-sm text-muted-foreground mb-2">{t("inviteDescription")}</p>
					<div className="flex items-center justify-center gap-4 text-sm">
						<div className="flex items-center gap-1">
							<Users className="h-4 w-4 text-purple-500" />
							<span>
								{t("invited")} {totalInvited} {t("people", { count: totalInvited })}
							</span>
						</div>
						<div className="flex items-center gap-1">
							<Gift className="h-4 w-4 text-pink-500" />
							<span>
								{t("earned")} {totalEarned.toLocaleString()} {t("points", { count: totalEarned })}
							</span>
						</div>
					</div>
				</div>

				{/* 音色解锁进度 */}
				<div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-lg border border-amber-200/40 dark:border-amber-700/30">
					<div className="flex items-center gap-1.5 mb-1.5">
						<Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
						<span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
							{t("unlockVoices")}
						</span>
					</div>
					<p className="text-[11px] text-amber-700 dark:text-amber-300 mb-1.5">
						{t("inviteCount", { count: VOICE_UNLOCK_COUNT })}
					</p>
					<div className="space-y-1">
						<div className="flex justify-between text-[11px]">
							<span className="text-amber-700 dark:text-amber-300">
								{t("progress")} {totalInvited}/{VOICE_UNLOCK_COUNT}
							</span>
							{voiceUnlocked ? (
								<span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-0.5">
									<CheckCircle className="w-3 h-3" />
									{t("unlocked")}
								</span>
							) : (
								<span className="text-amber-600 dark:text-amber-400">
									{t("moreNeeded", { count: VOICE_UNLOCK_COUNT - totalInvited })}
								</span>
							)}
						</div>
						<div className="w-full bg-amber-200 dark:bg-amber-800 rounded-full h-1.5">
							<div
								className="bg-gradient-to-r from-amber-500 to-orange-500 h-1.5 rounded-full transition-all duration-500"
								style={{ width: `${Math.min(100, (totalInvited / VOICE_UNLOCK_COUNT) * 100)}%` }}
							/>
						</div>
					</div>
				</div>

				{firstCode ? (
					<div className="space-y-3">
						{/* 显示所有邀请码 */}
						{codes.length > 0 && (
							<div className="space-y-2">
								<p className="text-xs text-muted-foreground">
									{t("inviteCount", { count: codes.length })}
								</p>
								{codes.map((code: InvitationCode) => (
									<div
										key={code.code}
										className="flex items-center gap-2 p-2 bg-background rounded-lg border"
									>
										<code className="flex-1 text-center text-sm font-mono font-bold">
											{code.code}
										</code>
										<span className="text-xs text-muted-foreground shrink-0">
											{code.usedCount || 0}/{code.maxUses || 3} 使用
										</span>
										<Button
											variant={copiedCode === code.code ? "default" : "ghost"}
											size="sm"
											onClick={() => handleCopyCode(code.code)}
											className={`shrink-0 transition-all duration-200 ${copiedCode === code.code ? "scale-95 bg-green-500 hover:bg-green-600 text-white" : "hover:scale-105"}`}
										>
											{copiedCode === code.code ? (
												<CheckCircle className="h-4 w-4" />
											) : (
												<Copy className="h-4 w-4" />
											)}
										</Button>
									</div>
								))}
							</div>
						)}
						<p className="text-xs text-center text-muted-foreground">{t("shareCode")}</p>
					</div>
				) : (
					<div className="text-center">
						<p className="text-sm text-muted-foreground mb-3">{t("noCode")}</p>
						<Button asChild variant="outline" size="sm">
							<a href="/api/invitation/create">{t("generateCode")}</a>
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function InviteFriendSkeleton() {
	const t = useTranslations("dashboard");
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Gift className="h-5 w-5 text-purple-500" />
					{t("inviteFriends")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="text-center space-y-2">
					<Skeleton className="h-4 w-48 mx-auto" />
					<div className="flex items-center justify-center gap-4">
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-4 w-24" />
					</div>
				</div>
				<Skeleton className="h-12 w-full" />
				<Skeleton className="h-3 w-40 mx-auto" />
			</CardContent>
		</Card>
	);
}
