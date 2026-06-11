"use client";

import { CheckCircle, Copy, Crown, Gift, Loader2, Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logger } from "@/lib/logger";

const INVITATION_MAX_CODES = 5;
const INVITATION_REWARD = 2500;
const VOICE_UNLOCK_COUNT = 3;
const COPY_FEEDBACK_DURATION = 1500;

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
	rewardDaysClaimed: number;
	lastRewardAt: string | null;
	firstRewardAt: string | null;
	createdAt: string;
	invitee: {
		id: string;
		name: string | null;
		email: string | null;
		createdAt: string;
	} | null;
	rewardProgress: string;
	earnedPoints: number;
}

interface InvitationModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	isLoggedIn: boolean;
}

export function InvitationModal({ open, onOpenChange, isLoggedIn }: InvitationModalProps) {
	const locale = useLocale();
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [generating, setGenerating] = useState(false);
	const [copiedCode, setCopiedCode] = useState<string | null>(null);
	const [codes, setCodes] = useState<InvitationCode[]>([]);
	const [invitations, setInvitations] = useState<InvitationRecord[]>([]);
	const [summary, setSummary] = useState<{
		totalInvited: number;
		activeInvitations: number;
		completedInvitations: number;
		totalEarned: number;
		referredBy: string | null;
	} | null>(null);

	const loadData = useCallback(async () => {
		if (!isLoggedIn) {
			setCodes([]);
			setInvitations([]);
			setSummary(null);
			return;
		}
		setLoading(true);
		try {
			const res = await fetch("/api/invitation/list");
			const data = await res.json();
			if (data.success) {
				setCodes(data.codes || []);
				setInvitations(data.invitations || []);
				setSummary(data.summary || null);
			}
		} catch (error) {
			logger.error(
				"Failed to load invitation data",
				error instanceof Error ? error : new Error(String(error)),
			);
		} finally {
			setLoading(false);
		}
	}, [isLoggedIn]);

	useEffect(() => {
		if (open) {
			loadData();
		}
	}, [open, loadData]);

	// 计算待使用的邀请码数量
	const unusedCodesCount = codes.filter((c) => c.usedCount < c.maxUses).length;

	const handleGenerateCode = async () => {
		if (!isLoggedIn) {
			router.push(`/${locale}/auth/login`);
			return;
		}
		if (unusedCodesCount >= INVITATION_MAX_CODES) {
			return;
		}
		setGenerating(true);
		try {
			const res = await fetch("/api/invitation/create", {
				method: "POST",
			});
			const data = await res.json();
			if (data.success) {
				setCodes((prev) => [
					...prev,
					{
						code: data.code,
						status: "active",
						usedCount: 0,
						maxUses: 1,
						createdAt: data.createdAt,
					},
				]);
			}
		} catch (error) {
			logger.error(
				"Failed to generate invitation code",
				error instanceof Error ? error : new Error(String(error)),
			);
		} finally {
			setGenerating(false);
		}
	};

	const copyToClipboard = async (code: string) => {
		const inviteUrl = `${window.location.origin}/${locale}/auth/register?code=${code}`;
		await navigator.clipboard.writeText(inviteUrl);
		setCopiedCode(code);
		setTimeout(() => setCopiedCode(null), COPY_FEEDBACK_DURATION);
	};

	const texts = {
		zh: {
			title: "邀请好友",
			description: "邀请好友注册，立即获得奖励",
			tabCodes: "我的邀请码",
			tabRecords: "邀请记录",
			generateBtn: "生成邀请码",
			used: "已使用",
			available: "待使用",
			expired: "已过期",
			copyLink: "复制链接",
			copied: "已复制",
			noCodes: "暂无邀请码",
			noCodesDesc: "点击上方按钮生成您的第一个邀请码",
			noRecords: "暂无邀请记录",
			noRecordsDesc: "当您成功邀请好友后，将在此显示记录",
			progress: "进行中",
			completed: "已完成",
			rewardInfo: "已获得",
			invitedUser: "受邀用户",
			joinDate: "加入时间",
			maxCodesTip: `最多 ${INVITATION_MAX_CODES} 个待使用邀请码`,
			rewardDetail: `邀请成功，双方各得 ${INVITATION_REWARD} 积分`,
			loginPrompt: "登录后可生成邀请码",
			loginBtn: "立即登录",
			voiceUnlockTitle: "解锁限定音色",
			voiceUnlockDesc: `邀请 ${VOICE_UNLOCK_COUNT} 位好友，解锁英伦淑女 & 英伦绅士音色`,
			voiceUnlockProgress: (count: number) =>
				count >= VOICE_UNLOCK_COUNT ? "已解锁！" : `进度 ${count}/${VOICE_UNLOCK_COUNT}`,
			voiceUnlockDone: "已解锁限定音色",
			voiceInviteMore: (need: number) => `还需邀请 ${need} 人`,
		},
		en: {
			title: "Invite Friends",
			description: "Invite friends, get rewards instantly",
			tabCodes: "My Codes",
			tabRecords: "Records",
			generateBtn: "Generate Code",
			used: "Used",
			available: "Available",
			expired: "Expired",
			copyLink: "Copy Link",
			copied: "Copied",
			noCodes: "No codes yet",
			noCodesDesc: "Click the button above to generate your first invitation code",
			noRecords: "No records yet",
			noRecordsDesc: "Your invitation records will appear here after successfully inviting friends",
			progress: "In Progress",
			completed: "Completed",
			rewardInfo: "Earned",
			invitedUser: "Invited User",
			joinDate: "Joined",
			maxCodesTip: `Max ${INVITATION_MAX_CODES} available codes`,
			rewardDetail: `Invite success, both get ${INVITATION_REWARD} points`,
			loginPrompt: "Login to generate invitation codes",
			loginBtn: "Sign In",
			voiceUnlockTitle: "Unlock Premium Voices",
			voiceUnlockDesc: `Invite ${VOICE_UNLOCK_COUNT} friends to unlock English Lady & English Gentleman`,
			voiceUnlockProgress: (count: number) =>
				count >= VOICE_UNLOCK_COUNT ? "Unlocked!" : `Progress ${count}/${VOICE_UNLOCK_COUNT}`,
			voiceUnlockDone: "Premium voices unlocked",
			voiceInviteMore: (need: number) => `${need} more to unlock`,
		},
	};

	const currentLocale = locale === "en" ? "en" : "zh";
	const text = texts[currentLocale];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-hidden flex flex-col p-0">
				<DialogHeader className="px-6 pt-5 pb-2 shrink-0">
					<div className="flex items-center gap-3 mb-2">
						<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shrink-0">
							<Gift className="h-5 w-5 text-white" />
						</div>
						<DialogTitle className="text-xl font-bold">{text.title}</DialogTitle>
					</div>
					<div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
						<p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
							{text.rewardDetail}
						</p>
					</div>
				</DialogHeader>

				{/* 音色解锁进度 - 所有用户可见 */}
				<div className="mx-6 mb-3 p-2.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200/50 dark:border-amber-700/50 shadow-sm">
					<div className="flex items-center gap-2 mb-1.5">
						<Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
						<span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
							{text.voiceUnlockTitle}
						</span>
					</div>
					<p className="text-xs text-amber-700 dark:text-amber-300 mb-1.5">
						{text.voiceUnlockDesc}
					</p>
					<div className="space-y-1">
						<div className="flex justify-between text-xs">
							<span className="text-amber-700 dark:text-amber-300">
								{isLoggedIn
									? text.voiceUnlockProgress(summary?.totalInvited || 0)
									: text.voiceUnlockProgress(0)}
							</span>
							{isLoggedIn && (summary?.totalInvited || 0) >= VOICE_UNLOCK_COUNT ? (
								<span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-0.5">
									<CheckCircle className="w-3 h-3" />
									{text.voiceUnlockDone}
								</span>
							) : isLoggedIn ? (
								<span className="text-amber-600 dark:text-amber-400">
									{text.voiceInviteMore(VOICE_UNLOCK_COUNT - (summary?.totalInvited || 0))}
								</span>
							) : (
								<span className="text-amber-600 dark:text-amber-400">
									{text.voiceInviteMore(VOICE_UNLOCK_COUNT)}
								</span>
							)}
						</div>
						<div className="w-full bg-amber-200 dark:bg-amber-800 rounded-full h-2">
							<div
								className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500"
								style={{
									width: `${isLoggedIn ? Math.min(100, ((summary?.totalInvited || 0) / VOICE_UNLOCK_COUNT) * 100) : 0}%`,
								}}
							/>
						</div>
					</div>
				</div>

				<Tabs defaultValue="codes" className="flex-1 overflow-hidden flex flex-col px-6 mt-1">
					<TabsList className="grid w-full grid-cols-2 shrink-0">
						<TabsTrigger value="codes">
							<Gift className="w-4 h-4 mr-2" />
							{text.tabCodes}
						</TabsTrigger>
						<TabsTrigger value="records">
							<Users className="w-4 h-4 mr-2" />
							{text.tabRecords}
						</TabsTrigger>
					</TabsList>

					<TabsContent value="codes" className="flex-1 flex flex-col overflow-hidden mt-2">
						{/* 邀请码列表 - 可滚动区域 */}
						<div className="flex-1 overflow-y-auto min-h-0 space-y-2">
							{loading ? (
								<div className="flex items-center justify-center py-12">
									<Loader2 className="h-8 w-8 animate-spin text-primary" />
								</div>
							) : codes.length === 0 && !isLoggedIn ? (
								<div className="text-center py-12">
									<div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
										<Gift className="h-8 w-8 text-muted-foreground" />
									</div>
									<p className="text-muted-foreground">{text.noCodes}</p>
									<p className="text-sm text-muted-foreground mt-1">{text.noCodesDesc}</p>
								</div>
							) : codes.length === 0 ? (
								<div className="text-center py-12">
									<div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
										<Gift className="h-8 w-8 text-muted-foreground" />
									</div>
									<p className="text-muted-foreground">{text.noCodes}</p>
									<p className="text-sm text-muted-foreground mt-1">{text.noCodesDesc}</p>
								</div>
							) : (
								codes.map((code) => (
									<div
										key={code.code}
										className="flex items-center justify-between p-2.5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700"
									>
										<div>
											<div className="flex items-center gap-2">
												<span className="font-mono font-bold text-base tracking-wider">
													{code.code}
												</span>
												{code.usedCount >= code.maxUses ? (
													<span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs font-medium rounded-full flex items-center">
														<CheckCircle className="w-3 h-3 mr-1" />
														{text.used}
													</span>
												) : (
													<span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
														{text.available}
													</span>
												)}
											</div>
											<p className="text-xs text-muted-foreground mt-1">
												{currentLocale === "zh" ? "生成日期" : "Created"}
												{new Date(code.createdAt).toLocaleDateString(
													currentLocale === "zh" ? "zh-CN" : "en-US",
												)}
											</p>
										</div>
										{code.usedCount < code.maxUses && (
											<Button
												variant={copiedCode === code.code ? "default" : "outline"}
												size="sm"
												onClick={() => copyToClipboard(code.code)}
												className={`flex items-center gap-1 transition-all duration-200 ${copiedCode === code.code ? "scale-95 bg-green-500 hover:bg-green-600 text-white border-green-500" : "hover:scale-105"}`}
											>
												{copiedCode === code.code ? (
													<CheckCircle className="w-4 h-4" />
												) : (
													<Copy className="w-4 h-4" />
												)}
												{copiedCode === code.code ? text.copied : text.copyLink}
											</Button>
										)}
									</div>
								))
							)}
						</div>

						{/* 底部固定：生成按钮 */}
						<div className="pt-2 mt-2 border-t shrink-0 pb-4">
							{!isLoggedIn ? (
								<div className="text-center space-y-3">
									<p className="text-muted-foreground">{text.loginPrompt}</p>
									<Button
										onClick={() => router.push(`/${locale}/auth/login`)}
										className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
									>
										{text.loginBtn}
									</Button>
								</div>
							) : (
								<>
									<Button
										onClick={handleGenerateCode}
										disabled={generating || unusedCodesCount >= INVITATION_MAX_CODES}
										className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
									>
										{generating ? (
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										) : (
											<Plus className="w-4 h-4 mr-2" />
										)}
										{text.generateBtn}
									</Button>
									<p className="text-xs text-center text-muted-foreground mt-2">
										{text.maxCodesTip} ({unusedCodesCount}/{INVITATION_MAX_CODES})
									</p>
								</>
							)}
						</div>
					</TabsContent>

					<TabsContent value="records" className="flex-1 overflow-y-auto mt-3 pb-6 min-h-0">
						{loading ? (
							<div className="flex items-center justify-center py-12">
								<Loader2 className="h-8 w-8 animate-spin text-primary" />
							</div>
						) : !isLoggedIn ? (
							<div className="text-center py-12">
								<div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
									<Users className="h-8 w-8 text-muted-foreground" />
								</div>
								<p className="text-muted-foreground">{text.noRecords}</p>
								<p className="text-sm text-muted-foreground mt-1">{text.noRecordsDesc}</p>
							</div>
						) : invitations.length === 0 ? (
							<div className="text-center py-12">
								<div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
									<Users className="h-8 w-8 text-muted-foreground" />
								</div>
								<p className="text-muted-foreground">{text.noRecords}</p>
								<p className="text-sm text-muted-foreground mt-1">{text.noRecordsDesc}</p>
							</div>
						) : (
							<div className="space-y-3">
								{invitations.map((record) => (
									<div
										key={record.id}
										className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700"
									>
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-2">
												<div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
													{record.invitee?.name?.[0] || record.invitee?.email?.[0] || "?"}
												</div>
												<div>
													<p className="font-medium text-sm">
														{record.invitee?.name || record.invitee?.email || "Unknown"}
													</p>
													<p className="text-xs text-muted-foreground">
														{text.joinDate}:{" "}
														{record.invitee
															? new Date(record.invitee.createdAt).toLocaleDateString(
																	currentLocale === "zh" ? "zh-CN" : "en-US",
																)
															: "-"}
													</p>
												</div>
											</div>
											<span
												className={`px-2 py-1 text-xs font-medium rounded-full ${
													record.status === "completed"
														? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
														: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
												}`}
											>
												{record.status === "completed" ? text.completed : text.progress}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-primary">
												{text.rewardInfo}: {record.earnedPoints}
											</span>
										</div>
									</div>
								))}
							</div>
						)}

						{summary && summary.totalInvited > 0 && (
							<div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
								<h4 className="font-medium text-sm mb-3">邀请统计</h4>
								<div className="grid grid-cols-3 gap-4 text-center">
									<div>
										<p className="text-2xl font-bold text-primary">{summary.totalInvited}</p>
										<p className="text-xs text-muted-foreground">总邀请</p>
									</div>
									<div>
										<p className="text-2xl font-bold text-blue-600">{summary.activeInvitations}</p>
										<p className="text-xs text-muted-foreground">进行中</p>
									</div>
									<div>
										<p className="text-2xl font-bold text-green-600">{summary.totalEarned}</p>
										<p className="text-xs text-muted-foreground">已获积分</p>
									</div>
								</div>
							</div>
						)}
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
