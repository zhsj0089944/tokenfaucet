"use client";

import { AudioWaveform, Download, Volume2 } from "lucide-react";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ModelMode } from "./tts-app-constants";
import { SITE_PRESET_VOICES } from "./tts-app-constants";
import { LABEL_EN_MAP } from "./voice-params-config";

interface AudioPreviewProps {
	audioUrl: string | null;
	modelMode: ModelMode;
	presetVoice: string;
	audioTags: string[];
	locale: string;
	t: (key: string) => string;
	audioRef: RefObject<HTMLAudioElement | null>;
	onDownload: () => void;
	onError: (error: string) => void;
	onPlayingChange: (isPlaying: boolean) => void;
}

export function AudioPreview({
	audioUrl,
	modelMode,
	presetVoice,
	audioTags,
	locale,
	t,
	audioRef,
	onDownload,
	onError,
	onPlayingChange,
}: AudioPreviewProps) {
	const getVoiceName = () => {
		if (modelMode === "preset") {
			if (!presetVoice) return t("voices.auto");
			const v = SITE_PRESET_VOICES.find((pv) => pv.id === presetVoice);
			return v ? t(v.nameKey) : presetVoice;
		}
		if (modelMode === "design") return t("voices.custom");
		return t("voices.cloned");
	};

	return (
		<Card className="overflow-hidden card-modern">
			<CardContent className="pt-3 sm:pt-4 pb-3 sm:pb-4">
				<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
					<div className="flex items-center gap-2 shrink-0">
						<div
							className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl transition-colors transition-shadow duration-300 ${audioUrl ? "bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-200/50 dark:shadow-green-900/30" : "bg-gradient-to-br from-muted to-muted/80 text-muted-foreground/50"}`}
						>
							<Volume2 className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${audioUrl ? "text-white" : ""}`} />
						</div>
						<h3 className="font-semibold flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
							{t("preview.title")}
							{audioUrl && (
								<span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] sm:text-xs font-medium animate-bounce-in">
									<span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-green-500 mr-1 animate-pulse" />
									{t("preview.generatedBadge")}
								</span>
							)}
						</h3>
					</div>

					{audioUrl ? (
						<div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full min-w-0">
							<div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
								<div className="min-w-0 flex-1">
									<p className="text-[10px] sm:text-xs font-medium">{t("preview.generated")}</p>
									<p className="text-[10px] sm:text-xs text-muted-foreground/70 truncate">
										{getVoiceName()}
									</p>
								</div>
							</div>

							<audio
								ref={audioRef}
								src={audioUrl}
								onEnded={() => onPlayingChange(false)}
								onPause={() => onPlayingChange(false)}
								onPlay={() => onPlayingChange(true)}
								onError={() => onError(t("errors.audioLoadFailed"))}
								className="flex-1 h-8 min-w-0 rounded-lg w-full sm:w-auto"
								controls
							>
								<track kind="captions" />
							</audio>

							<div className="flex gap-1.5 shrink-0 self-end sm:self-auto">
								<Button
									variant="outline"
									size="sm"
									className="text-[10px] sm:text-xs h-7 sm:h-9 px-2 sm:px-3 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors transition-shadow duration-200"
									onClick={onDownload}
								>
									<Download className="mr-1 h-3 w-3" />
									<span className="hidden sm:inline">{t("save.download")}</span>
								</Button>
							</div>
						</div>
					) : (
						<div className="flex items-center gap-2 text-muted-foreground/50 flex-1">
							<div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center">
								<AudioWaveform className="h-5 w-5 opacity-40" />
							</div>
							<p className="text-xs">{t("preview.placeholder")}</p>
						</div>
					)}
				</div>

				<div className="h-px bg-gradient-to-r from-transparent via-violet-300/40 dark:via-violet-700/20 to-transparent mt-2 sm:mt-3" />
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-[10px] sm:text-xs text-muted-foreground/60">
					<span className="flex items-center gap-1">
						<span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-violet-400/50" />
						{modelMode === "preset"
							? t("modes.preset.name")
							: modelMode === "design"
								? t("modes.design.name")
								: t("modes.clone.name")}
					</span>
					{modelMode === "preset" && (
						<span className="flex items-center gap-1">
							<span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple-400/50" />
							{getVoiceName()}
						</span>
					)}
					{audioTags.length > 0 && (
						<span className="truncate flex items-center gap-1 max-w-[120px] sm:max-w-none">
							<span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-amber-400/50" />
							{audioTags
								.slice(0, 2)
								.map((tag) => (locale === "en" ? (LABEL_EN_MAP[tag] ?? tag) : tag))
								.join(locale === "en" ? ", " : "，")}
							{audioTags.length > 2 ? "..." : ""}
						</span>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
