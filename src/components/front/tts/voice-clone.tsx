"use client";

import { Crown, Loader2, Mic, Pencil, Send, Trash2, Upload } from "lucide-react";
import type { useTranslations } from "next-intl";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SavedVoice = {
	id: string;
	name: string;
	voiceType: string;
	cloneAudioData?: string | null;
	createdAt?: string | null;
};

type Props = {
	cloneFile: File | null;
	setCloneFile: (file: File | null) => void;
	cloneBase64: string;
	setCloneBase64: (base64: string) => void;
	cloneConsent: boolean;
	setCloneConsent: (value: boolean) => void;
	savedVoices: SavedVoice[];
	onDeleteVoice: (id: string) => void;
	onUpdateVoiceName: (id: string, name: string) => void;
	editingVoiceId: string | null;
	setEditingVoiceId: (id: string | null) => void;
	editingVoiceName: string;
	setEditingVoiceName: (name: string) => void;
	fileInputRef: React.RefObject<HTMLInputElement | null>;
	onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	t: ReturnType<typeof useTranslations>;
	onGenerate: () => void;
	onCancelGenerate: () => void;
	isGenerating: boolean;
	text: string;
	getMaxChars: () => number;
	hasActiveMembership: boolean;
};

export function VoiceClone({
	cloneFile,
	setCloneFile,
	cloneBase64,
	setCloneBase64,
	cloneConsent,
	setCloneConsent,
	savedVoices,
	onDeleteVoice,
	onUpdateVoiceName,
	editingVoiceId,
	setEditingVoiceId,
	editingVoiceName,
	setEditingVoiceName,
	fileInputRef,
	onFileChange,
	t,
	onGenerate,
	onCancelGenerate,
	isGenerating,
	text,
	getMaxChars,
	hasActiveMembership,
}: Props) {
	const cloneVoices = savedVoices.filter((v) => v.voiceType === "clone" && v.cloneAudioData);
	const cloneCount = cloneVoices.length;
	const cloneConsentId = useId();

	return (
		<div className="grid grid-cols-4 gap-2">
			{/* 左侧1份：上传音频样本 */}
			<div className="col-span-1 space-y-1.5">
				<Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
					<div className="flex items-center justify-center w-5 h-5 rounded-lg bg-gradient-to-br from-rose-400/20 to-pink-400/20 text-rose-600 dark:text-rose-400">
						<Mic className="h-3.5 w-3.5" />
					</div>
					{t("clone.label")}
				</Label>

				<button
					type="button"
					className="relative border-2 border-dashed border-slate-300/60 dark:border-slate-600/40 rounded-xl p-2 text-center cursor-pointer hover:border-rose-400/60 dark:hover:border-rose-500/60 hover:bg-rose-50/30 dark:hover:bg-rose-900/20 transition-colors transition-shadow duration-300 bg-gradient-to-br from-white/80 to-rose-50/30 dark:from-gray-900/80 dark:to-rose-900/20 overflow-hidden group"
					onClick={() => fileInputRef.current?.click()}
				>
					{/* 装饰性渐变角标 */}
					<div className="absolute top-0 left-0 w-8 h-8 rounded-full bg-gradient-to-br from-rose-200/40 to-transparent" />
					<div className="absolute top-0 right-0 w-8 h-8 rounded-full bg-gradient-to-br from-pink-200/40 to-transparent" />
					<div className="absolute bottom-0 left-0 w-8 h-8 rounded-full bg-gradient-to-br from-rose-200/40 to-transparent" />
					<div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gradient-to-br from-pink-200/40 to-transparent" />

					<div
						className={`flex items-center justify-center w-8 h-8 rounded-lg mx-auto mb-1.5 transition-colors transition-shadow duration-300 ${cloneFile ? "bg-gradient-to-br from-rose-400 to-pink-500 shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30" : "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 group-hover:from-rose-100 group-hover:to-pink-100"}`}
					>
						{cloneFile ? (
							<Mic className="h-4 w-4 text-white" />
						) : (
							<Upload
								className={`h-4 w-4 ${cloneFile ? "text-white" : "text-slate-500 dark:text-slate-400"}`}
							/>
						)}
					</div>
					<p className="text-[10px] text-slate-600/80 dark:text-slate-300/80 leading-relaxed">
						{cloneFile ? (
							<span className="text-rose-600 dark:text-rose-400 font-medium">{cloneFile.name}</span>
						) : (
							<span>{t("clone.placeholder")}</span>
						)}
					</p>
				</button>
				<input
					ref={fileInputRef}
					type="file"
					accept="audio/mpeg,audio/wav,audio/mp3"
					onChange={onFileChange}
					className="hidden"
				/>

				{/* 复刻配额提示 */}
				<div className="flex items-center justify-between text-[10px] p-1.5 rounded-lg bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100/50 dark:border-amber-800/30">
					<span className="text-slate-600/80 dark:text-slate-300/80 flex items-center gap-1">
						<Mic className="h-2.5 w-2.5" />
						<span>{t("clone.savedCount", { count: cloneCount, max: 3 })}</span>
						{!hasActiveMembership && <Crown className="h-2.5 w-2.5 text-amber-500" />}
					</span>
					<span className="text-slate-400/60 dark:text-slate-500/60">
						{t("clone.saveDuration")}
					</span>
				</div>
			</div>

			{/* 中间2份：声明和保证 */}
			<div className="col-span-2 space-y-1.5">
				<p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
					<div className="w-1 h-1 rounded-full bg-gradient-to-r from-violet-400 to-purple-500" />
					{t("clone.declaration")}
				</p>
				<div className="flex flex-col gap-2 p-2 bg-gradient-to-br from-white/80 to-violet-50/30 dark:from-gray-900/80 dark:to-violet-900/20 backdrop-blur-sm border border-violet-100/50 dark:border-violet-800/30 rounded-xl shadow-md hover:shadow-lg transition-colors transition-shadow duration-300">
					<div className="flex items-start gap-2 p-1.5 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
						<input
							type="checkbox"
							id={cloneConsentId}
							checked={cloneConsent}
							onChange={(e) => setCloneConsent(e.target.checked)}
							className="mt-0.5 rounded border-violet-300 dark:border-violet-600 text-violet-600 dark:text-violet-400 focus:ring-violet-500 shrink-0 w-3.5 h-3.5"
						/>
						<Label
							htmlFor={cloneConsentId}
							className="text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed cursor-pointer"
						>
							{t("clone.consent")}
						</Label>
					</div>
					<Button
						onClick={isGenerating ? onCancelGenerate : onGenerate}
						disabled={
							!isGenerating &&
							(!text.trim() || text.length > getMaxChars() || !cloneBase64 || !cloneConsent)
						}
						variant={isGenerating ? "destructive" : "default"}
						className="w-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 hover:from-violet-600 hover:via-purple-600 hover:to-fuchsia-600 text-white shadow-lg hover:shadow-xl transition-colors transition-shadow duration-300 rounded-lg text-xs"
						size="sm"
					>
						{isGenerating ? (
							<>
								<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
								{t("cancel") || "取消"}
							</>
						) : (
							<>
								<Send className="mr-1.5 h-3.5 w-3.5" />
								{t("generate")}
							</>
						)}
					</Button>
				</div>
			</div>

			{/* 右侧1份：快速复用已有音色 */}
			<div className="col-span-1 space-y-1.5">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-1">
						<div className="flex items-center justify-center w-3.5 h-3.5 rounded-md bg-gradient-to-br from-cyan-400/20 to-blue-400/20 text-cyan-600 dark:text-cyan-400">
							<Mic className="h-2 w-2" />
						</div>
						<p className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
							{t("clone.quickReuse")}
							{!hasActiveMembership && <Crown className="h-2.5 w-2.5 text-amber-500 ml-1 inline" />}
						</p>
					</div>
				</div>
				<div className="relative p-2 rounded-xl bg-gradient-to-br from-white/80 to-slate-50/50 dark:from-gray-900/80 dark:to-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-md overflow-hidden">
					{/* 装饰性角标 */}
					<div className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-violet-300 to-purple-400 dark:from-violet-500 dark:to-purple-600 opacity-70" />
					<div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-violet-300 to-purple-400 dark:from-violet-500 dark:to-purple-600 opacity-70" />
					<div className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-violet-300 to-purple-400 dark:from-violet-500 dark:to-purple-600 opacity-70" />
					<div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-violet-300 to-purple-400 dark:from-violet-500 dark:to-purple-600 opacity-70" />

					<div className="space-y-1">
						{!hasActiveMembership ? (
							<div className="flex items-center justify-center h-7 text-[10px] text-amber-500/80 border border-dashed border-amber-300/40 dark:border-amber-600/40 rounded-lg bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/20">
								<Crown className="h-2.5 w-2.5 mr-1" />
								{t("clone.subscribeToSave")}
							</div>
						) : (
							[0, 1, 2].map((index) => {
								const cloneVoice = cloneVoices[index];
								return cloneVoice ? (
									<div
										key={cloneVoice.id}
										className="flex items-center gap-1 px-1.5 py-1.5 rounded-lg bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 border border-slate-100/50 dark:border-slate-700/50 hover:from-violet-50 hover:to-purple-50 dark:hover:from-violet-900/30 dark:hover:to-purple-900/30 hover:border-violet-200 dark:hover:border-violet-700 transition-colors transition-shadow duration-200 group shadow-sm hover:shadow-md"
									>
										{editingVoiceId === cloneVoice.id ? (
											<Input
												value={editingVoiceName}
												onChange={(e) => setEditingVoiceName(e.target.value)}
												onKeyDown={(e) => {
													if (e.key === "Enter") onUpdateVoiceName(cloneVoice.id, editingVoiceName);
													if (e.key === "Escape") setEditingVoiceId(null);
												}}
												onBlur={() => onUpdateVoiceName(cloneVoice.id, editingVoiceName)}
												className="h-5 text-[10px] bg-transparent border-violet-200 dark:border-violet-700 focus:border-violet-400 dark:focus:border-violet-500 rounded-lg"
												autoFocus
											/>
										) : (
											<button
												type="button"
												onClick={() => {
													if (cloneVoice.cloneAudioData) {
														setCloneBase64(cloneVoice.cloneAudioData);
														setCloneFile(new File([], cloneVoice.name));
													}
												}}
												className="flex-1 flex items-center gap-1 min-w-0"
											>
												<div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50 flex items-center justify-center shadow-sm">
													<Mic className="h-2.5 w-2.5 text-violet-600 dark:text-violet-400" />
												</div>
												<span className="text-[10px] truncate text-slate-700 dark:text-slate-300 font-medium">
													{cloneVoice.name}
												</span>
											</button>
										)}
										<div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
											{editingVoiceId !== cloneVoice.id && (
												<button
													type="button"
													onClick={() => {
														setEditingVoiceId(cloneVoice.id);
														setEditingVoiceName(cloneVoice.name);
													}}
													className="p-0.5 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded transition-colors"
													title={t("clone.edit")}
												>
													<Pencil className="h-2.5 w-2.5" />
												</button>
											)}
											<button
												type="button"
												onClick={() => onDeleteVoice(cloneVoice.id)}
												className="p-0.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
												title={t("clone.delete")}
											>
												<Trash2 className="h-2.5 w-2.5" />
											</button>
										</div>
									</div>
								) : (
									<div
										key={index}
										className="flex items-center justify-center h-7 text-[10px] text-slate-400/60 border border-dashed border-slate-300/40 dark:border-slate-600/40 rounded-lg bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-800/30 dark:to-slate-700/30"
									>
										{t("clone.empty")}
									</div>
								);
							})
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
