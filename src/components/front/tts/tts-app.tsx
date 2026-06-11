"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Mic, Music, Send, Sparkles, Wand2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import superjson from "superjson";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/auth";
import { useUserMembership } from "@/hooks/use-membership";

import { AudioPreview } from "./AudioPreview";
import { ProviderSelector } from "./ProviderSelector";
import type { RichTextEditorRef } from "./rich-text-editor";
import { TextInput } from "./TextInput";
import {
	calculateTextPoints,
	getActiveQuickPreset,
	getDefaultTagIdsForPreset,
	getVoiceIdForProvider,
	getVoiceModifyForPreset,
	INVITE_UNLOCK_COUNT,
	isQuickPresetActive,
	type ModelMode,
	type SavedVoice,
	SUBSCRIPTION_ONLY_VOICES,
	type TtsProvider,
	type UserPointsState,
} from "./tts-app-constants";
import { VoiceClone } from "./voice-clone";
import { VoiceDesign } from "./voice-design";
import {
	buildMinimaxParams,
	buildStylePrompt as buildParamStylePrompt,
	buildTagLabels,
	type VoiceModifySettings,
} from "./voice-params-config";
import { VoiceParamsPanel } from "./voice-params-panel";
import { VoicePreset } from "./voice-preset";

export default function TtsApp() {
	const t = useTranslations("tts");
	const locale = useLocale();
	const { user } = useAuth();
	const queryClient = useQueryClient();

	const [modelMode, setModelMode] = useState<ModelMode>("preset");
	const [text, setText] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [audioContentType, setAudioContentType] = useState<string>("audio/mpeg");
	const [, setIsPlaying] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);

	const [presetVoice, setPresetVoice] = useState("");
	const [stylePrompt, setStylePrompt] = useState("");
	const [audioTags, setAudioTags] = useState<string[]>([]);
	const [selectedParamIds, setSelectedParamIds] = useState<string[]>([]);

	const prevPresetDefaultTagsRef = useRef<string[]>([]);

	const handlePresetVoiceChange = useCallback((voiceId: string) => {
		setPresetVoice(voiceId);
		setSelectedParamIds((prev) => {
			const result = prev.filter((id) => !prevPresetDefaultTagsRef.current.includes(id));
			if (voiceId) {
				const defaultTagIds = getDefaultTagIdsForPreset(voiceId);
				for (const tagId of defaultTagIds) {
					if (!result.includes(tagId)) {
						result.push(tagId);
					}
				}
				prevPresetDefaultTagsRef.current = defaultTagIds;
			} else {
				prevPresetDefaultTagsRef.current = [];
			}
			return result;
		});
	}, []);

	const [voiceDesignPrompt, setVoiceDesignPrompt] = useState("");
	const [tagSynced, setTagSynced] = useState(false);
	const voiceDesignManuallyEdited = useRef(false);
	const suppressAutoSync = useRef(false);

	const [cloneFile, setCloneFile] = useState<File | null>(null);
	const [cloneBase64, setCloneBase64] = useState("");
	const [cloneConsent, setCloneConsent] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const richTextEditorRef = useRef<RichTextEditorRef>(null);

	const [editingVoiceId, setEditingVoiceId] = useState<string | null>(null);
	const [editingVoiceName, setEditingVoiceName] = useState("");

	const [savedVoices, setSavedVoices] = useState<SavedVoice[]>([]);
	const [, setIsLoadingVoices] = useState(false);

	const [languageBoost, setLanguageBoost] = useState<string>("");
	const [inviteCount, setInviteCount] = useState(0);
	const [, setUserPoints] = useState<UserPointsState | null>(null);

	const [activeProvider, setActiveProvider] = useState<string>("mimo");
	const [providers, setProviders] = useState<TtsProvider[]>([]);
	const [, setIsLoadingProviders] = useState(false);

	const { hasActiveMembership } = useUserMembership(user?.id);

	const isVoiceLocked = useCallback(
		(voiceId: string) => {
			if (!SUBSCRIPTION_ONLY_VOICES.includes(voiceId)) return false;
			if (hasActiveMembership) return false;
			return inviteCount < INVITE_UNLOCK_COUNT;
		},
		[hasActiveMembership, inviteCount],
	);

	const loadUserPoints = useCallback(async () => {
		try {
			const res = await fetch("/api/trpc/tts.getPointsBalance");
			if (!res.ok) return;
			const json = await res.json();
			const data = json.result?.data?.json || json.result?.data;
			if (data) {
				setUserPoints({
					dailyBalance: data.dailyBalance,
					monthlyBalance: data.monthlyBalance,
					totalBalance: data.totalBalance,
					dailyPoints: data.dailyPoints,
					monthlyPoints: data.monthlyPoints,
					isSubscribed: data.isSubscribed,
					planName: data.planName,
				});
			}
		} catch {
			/* 静默失败 */
		}
	}, []);

	const loadInviteCount = useCallback(async () => {
		try {
			const res = await fetch("/api/trpc/users.getInviteCount");
			if (!res.ok) return;
			const json = await res.json();
			const data = json.result?.data?.json || json.result?.data;
			if (data?.count !== undefined) {
				setInviteCount(data.count);
			}
		} catch {
			/* 静默失败 */
		}
	}, []);

	const loadProviders = useCallback(async () => {
		try {
			setIsLoadingProviders(true);
			const res = await fetch("/api/trpc/tts.getTtsProviders");
			if (!res.ok) return;
			const json = await res.json();
			const data = json.result?.data?.json || json.result?.data;
			if (data) {
				setProviders(data.providers || []);
				setActiveProvider(data.activeProvider || "mimo");
			}
		} catch {
			/* 静默失败 */
		} finally {
			setIsLoadingProviders(false);
		}
	}, []);

	useEffect(() => {
		loadUserPoints();
		loadProviders();
		loadInviteCount();
	}, [loadInviteCount, loadProviders, loadUserPoints]);

	useEffect(() => {
		if (!hasActiveMembership && activeProvider === "minimax") {
			setActiveProvider("mimo");
		}
	}, [hasActiveMembership, activeProvider]);

	// 切换 provider 时重置所有参数
	useEffect(() => {
		setSelectedParamIds([]);
		setLanguageBoost("");
		setText((prev) => {
			let cleaned = prev;
			for (const item of [
				"(laughs)",
				"(chuckle)",
				"(sighs)",
				"(pant)",
				"(inhale)",
				"(coughs)",
				"(clear-throat)",
				"(humming)",
				"(sneezes)",
				"(lip-smacking)",
			]) {
				cleaned = cleaned.replaceAll(item, "");
			}
			cleaned = cleaned.replace(/<#[\d.]+#>/g, "");
			for (const item of [
				"[crying]",
				"[sighs]",
				"[sniffles]",
				"[trembling]",
				"[Angry]",
				"[sternly]",
				"[commanding]",
				"[wearily]",
				"[whispering]",
				"[clears throat]",
			]) {
				cleaned = cleaned.replaceAll(item, "");
			}
			cleaned = cleaned.replaceAll("[pause]", "");
			cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
			return cleaned;
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const getMaxChars = () => (activeProvider === "minimax" ? 10000 : 10000);

	const MODELS: {
		id: ModelMode;
		name: string;
		icon: React.ReactNode;
		desc: string;
	}[] = [
		{
			id: "preset",
			name: t("modes.preset.name"),
			icon: <Music className="h-4 w-4" />,
			desc: t("modes.preset.desc"),
		},
		{
			id: "design",
			name: t("modes.design.name"),
			icon: <Wand2 className="h-4 w-4" />,
			desc: t("modes.design.desc"),
		},
		{
			id: "clone",
			name: t("modes.clone.name"),
			icon: <Mic className="h-4 w-4" />,
			desc: t("modes.clone.desc"),
		},
	];

	const getCurrentPresetVoice = useCallback(() => {
		return presetVoice || null;
	}, [presetVoice]);

	const loadSavedVoices = useCallback(async () => {
		try {
			setIsLoadingVoices(true);
			const res = await fetch("/api/trpc/ttsVoices.getUserVoices");
			if (!res.ok) return;
			const json = await res.json();
			const voices = json.result?.data?.json;
			if (Array.isArray(voices)) setSavedVoices(voices);
		} catch {
			/* 静默失败 */
		} finally {
			setIsLoadingVoices(false);
		}
	}, []);

	useEffect(() => {
		loadSavedVoices();
	}, [loadSavedVoices]);

	const handleDeleteVoice = async (id: string) => {
		if (!window.confirm(t("clone.confirmDelete") || "确定要删除这个音色吗？")) return;
		try {
			const res = await fetch("/api/trpc/ttsVoices.deleteVoice", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: superjson.stringify({ id }),
			});
			if (!res.ok) {
				const errorData = await res.json().catch(() => ({}));
				throw new Error(errorData?.error?.message || "delete failed");
			}
			await loadSavedVoices();
		} catch {
			setError(t("errors.deleteFailed"));
		}
	};

	const handleUpdateVoiceName = async (id: string, name: string) => {
		if (!name.trim()) {
			setEditingVoiceId(null);
			return;
		}
		try {
			const res = await fetch("/api/trpc/ttsVoices.updateVoice", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: superjson.stringify({ id, name: name.trim() }),
			});
			if (!res.ok) {
				const errorData = await res.json().catch(() => ({}));
				throw new Error(errorData?.error?.message || "update failed");
			}
			await loadSavedVoices();
			setEditingVoiceId(null);
		} catch {
			setError(t("errors.updateFailed") || "更新失败");
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!cloneConsent) {
			setError(t("errors.consentRequired") || "请先勾选声明并保证");
			if (fileInputRef.current) fileInputRef.current.value = "";
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			setError(t("errors.fileTooLarge"));
			return;
		}
		const fileReader = new FileReader();
		fileReader.onload = async () => {
			try {
				const audioCtx = new AudioContext();
				const audioBuffer = await audioCtx.decodeAudioData(fileReader.result as ArrayBuffer);
				audioCtx.close();
				const duration = audioBuffer.duration;
				if (duration < 8 || duration > 16) {
					setError(t("errors.invalidDuration"));
					if (fileInputRef.current) fileInputRef.current.value = "";
					return;
				}
			} catch {
				setError(t("errors.invalidFile"));
				if (fileInputRef.current) fileInputRef.current.value = "";
				return;
			}
			setCloneFile(file);
			setError(null);
			const dataUrlReader = new FileReader();
			dataUrlReader.onload = async () => {
				const base64 = dataUrlReader.result as string;
				setCloneBase64(base64);
				try {
					const autoName = file.name.replace(/\.[^.]+$/, "");
					const saveRes = await fetch("/api/trpc/ttsVoices.saveVoice", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: superjson.stringify({
							name: autoName,
							voiceType: "clone",
							cloneAudioData: base64,
						}),
					});
					if (saveRes.ok) {
						await loadSavedVoices();
					} else if (hasActiveMembership) {
						toast.error(t("clone.saveFailed"));
					}
				} catch {
					/* 自动保存失败静默处理 */
				}
			};
			dataUrlReader.readAsDataURL(file);
		};
		fileReader.onerror = () => {
			setError(t("errors.invalidFile"));
		};
		fileReader.readAsArrayBuffer(file);
	};

	const handleGenerate = useCallback(async () => {
		if (!text.trim()) {
			toast.error(t("errors.textRequired") || "请输入合成文本");
			return;
		}
		if (modelMode === "design" && !voiceDesignPrompt.trim()) {
			toast.error(t("errors.designRequired") || "请输入音色描述");
			return;
		}
		if (modelMode === "clone" && !cloneBase64) {
			toast.error(t("errors.cloneRequired") || "请上传复刻音频");
			return;
		}
		if (modelMode === "clone" && !cloneConsent) {
			toast.error(t("errors.consentRequired") || "请勾选声明");
			return;
		}

		setIsGenerating(true);
		setError(null);
		setAudioUrl(null);

		const abortController = new AbortController();
		abortControllerRef.current = abortController;

		try {
			const body: Record<string, unknown> = {
				modelMode,
				text: text.trim(),
				provider: activeProvider,
			};
			if (activeProvider === "minimax" && languageBoost) {
				body.languageBoost = languageBoost;
			}
			if (modelMode === "preset") {
				const voiceId = getCurrentPresetVoice();
				if (voiceId) body.voice = getVoiceIdForProvider(voiceId, activeProvider);
				if (stylePrompt.trim()) body.stylePrompt = stylePrompt.trim();
				if (audioTags.length > 0) body.audioTags = audioTags;

				// 检查是否有激活的预设 minimaxOverrides
				const activePreset = getActiveQuickPreset(selectedParamIds);
				const hasOverrides = activeProvider === "minimax" && activePreset?.minimaxOverrides;

				if (hasOverrides) {
					// 使用预设的 minimaxOverrides，绕过标签聚合
					const overrides = activePreset.minimaxOverrides;
					if (overrides) {
						if (overrides.emotion) body.emotion = overrides.emotion;
						body.pitch = overrides.pitch ?? 0;
						body.speed = overrides.speed ?? 1.0;
						if (overrides.voiceModify && Object.keys(overrides.voiceModify).length > 0) {
							body.voiceModify = overrides.voiceModify;
						}
					}
				} else {
					// 使用标签聚合参数
					const minimaxParams = buildMinimaxParams(selectedParamIds);
					if (minimaxParams.emotion) body.emotion = minimaxParams.emotion;
					body.pitch = minimaxParams.pitch;
					body.speed = minimaxParams.speed;

					const presetActive = isQuickPresetActive(selectedParamIds);
					const brandVm = !presetActive && voiceId ? getVoiceModifyForPreset(voiceId) : undefined;
					const tagVm = minimaxParams.voiceModify;
					const mergedVm: VoiceModifySettings = {};
					const pitchSum = (brandVm?.pitch ?? 0) + (tagVm?.pitch ?? 0);
					if (pitchSum !== 0) mergedVm.pitch = Math.max(-100, Math.min(100, pitchSum));
					const intensitySum = (brandVm?.intensity ?? 0) + (tagVm?.intensity ?? 0);
					if (intensitySum !== 0) mergedVm.intensity = Math.max(-100, Math.min(100, intensitySum));
					const timbreSum = (brandVm?.timbre ?? 0) + (tagVm?.timbre ?? 0);
					if (timbreSum !== 0) mergedVm.timbre = Math.max(-100, Math.min(100, timbreSum));
					if (brandVm?.sound_effects) mergedVm.sound_effects = brandVm.sound_effects;
					else if (tagVm?.sound_effects) mergedVm.sound_effects = tagVm.sound_effects;
					if (Object.keys(mergedVm).length > 0) {
						body.voiceModify = mergedVm;
					}
				}
			} else if (modelMode === "design") {
				body.voiceDesignPrompt = voiceDesignPrompt.trim();
				if (stylePrompt.trim()) body.stylePrompt = stylePrompt.trim();
				if (audioTags.length > 0) body.audioTags = audioTags;
			} else if (modelMode === "clone") {
				body.cloneVoice = cloneBase64;
				if (stylePrompt.trim()) body.stylePrompt = stylePrompt.trim();
				if (audioTags.length > 0) body.audioTags = audioTags;
			}

			const cleanBody: Record<string, unknown> = {};
			Object.entries(body).forEach(([key, value]) => {
				if (value !== undefined) cleanBody[key] = value;
			});

			const res = await fetch("/api/trpc/tts.generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: superjson.stringify(cleanBody),
				signal: abortController.signal,
			});

			const responseText = await res.text();
			// biome-ignore lint/suspicious/noExplicitAny: JSON.parse returns dynamic structure
			let json: any;
			try {
				json = JSON.parse(responseText);
			} catch {
				throw new Error(t("errors.invalidJson"));
			}

			const result = json?.result?.data?.json ?? json?.result?.data ?? json;

			if (!res.ok || result?.error || json?.error) {
				const errorMessage =
					result?.error?.message ??
					json?.error?.json?.message ??
					json?.error?.message ??
					`${t("errors.generateFailed")} (${res.status})`;
				throw new Error(errorMessage);
			}

			if (result?.type === "audio" && result?.audio) {
				let base64 = String(result.audio).trim();
				const mimeType = result.contentType || "audio/mpeg";

				const dataUrlPrefix = base64.match(/^data:[^;]+;base64,/);
				if (dataUrlPrefix) {
					base64 = base64.slice(dataUrlPrefix[0].length);
				}
				base64 = base64.replace(/[\s\r\n]/g, "");

				try {
					const byteChars = atob(base64);
					const byteArrays: Uint8Array[] = [];
					for (let offset = 0; offset < byteChars.length; offset += 512) {
						const slice = byteChars.slice(offset, offset + 512);
						const byteNumbers = new Array(slice.length);
						for (let i = 0; i < slice.length; i++) {
							byteNumbers[i] = slice.charCodeAt(i);
						}
						byteArrays.push(new Uint8Array(byteNumbers));
					}
					const blob = new Blob(byteArrays as BlobPart[], { type: mimeType });
					if (blob.size === 0) {
						throw new Error(t("errors.decodeFailed"));
					}
					if (audioUrl?.startsWith("blob:")) URL.revokeObjectURL(audioUrl);
					setAudioUrl(URL.createObjectURL(blob));
					setAudioContentType(mimeType);
				} catch (decodeErr) {
					const errMsg = decodeErr instanceof Error ? decodeErr.message : "";
					throw new Error(
						`${t("errors.decodeFailed")} (${mimeType})${errMsg ? `: ${errMsg}` : ""}`,
					);
				}

				if (result?.dailyBalance !== undefined && result?.monthlyBalance !== undefined) {
					setUserPoints((prev) =>
						prev !== null
							? {
									...prev,
									dailyBalance: result.dailyBalance,
									monthlyBalance: result.monthlyBalance,
									totalBalance: result.totalBalance,
								}
							: null,
					);
					queryClient.invalidateQueries({ queryKey: [["tts", "getPointsBalance"]] });
				}
			} else if (result?.type === "json" && result?.data) {
				if (result.data.url) {
					setAudioUrl(result.data.url);
				}
				if (result?.dailyBalance !== undefined && result?.monthlyBalance !== undefined) {
					setUserPoints((prev) =>
						prev !== null
							? {
									...prev,
									dailyBalance: result.dailyBalance,
									monthlyBalance: result.monthlyBalance,
									totalBalance: result.totalBalance,
								}
							: null,
					);
					queryClient.invalidateQueries({ queryKey: [["tts", "getPointsBalance"]] });
				}
			} else {
				throw new Error(t("errors.unknownFormat"));
			}
		} catch (err) {
			if (err instanceof Error && err.name === "AbortError") {
				toast.info(t("errors.generateCancelled") || "已取消生成");
			} else {
				toast.error(err instanceof Error ? err.message : t("errors.generateFailed"));
			}
		} finally {
			setIsGenerating(false);
			abortControllerRef.current = null;
		}
	}, [
		text,
		modelMode,
		activeProvider,
		stylePrompt,
		audioTags,
		voiceDesignPrompt,
		cloneBase64,
		t,
		queryClient,
		audioUrl,
		cloneConsent,
		getCurrentPresetVoice,
		languageBoost,
		selectedParamIds,
	]);

	const handleCancelGenerate = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
		}
	}, []);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
				e.preventDefault();
				if (!isGenerating && text.trim()) {
					if (
						!(modelMode === "design" && !voiceDesignPrompt.trim()) &&
						!(modelMode === "clone" && !cloneBase64) &&
						!(modelMode === "clone" && !cloneConsent)
					) {
						handleGenerate();
					}
				}
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isGenerating, text, modelMode, voiceDesignPrompt, cloneBase64, handleGenerate, cloneConsent]);

	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.pause();
		}
		setIsPlaying(false);
	}, []);

	const handleDownload = useCallback(() => {
		if (!audioUrl) return;
		const a = document.createElement("a");
		a.href = audioUrl;
		const ext =
			audioContentType.includes("mpeg") || audioContentType.includes("mp3") ? "mp3" : "wav";
		a.download = `tokenfaucet-${Date.now()}.${ext}`;
		a.click();
	}, [audioUrl, audioContentType]);

	const derivedStylePrompt = useMemo(
		() => buildParamStylePrompt(selectedParamIds, locale),
		[selectedParamIds, locale],
	);
	const derivedAudioTags = useMemo(() => buildTagLabels(selectedParamIds), [selectedParamIds]);

	useEffect(() => {
		setAudioTags(derivedAudioTags);
		if (!suppressAutoSync.current) {
			setStylePrompt(derivedStylePrompt);
			if (modelMode === "design" && derivedStylePrompt && !voiceDesignManuallyEdited.current) {
				setVoiceDesignPrompt(derivedStylePrompt);
				setTagSynced(true);
			}
		}
		suppressAutoSync.current = false;
	}, [derivedStylePrompt, derivedAudioTags, modelMode]);

	const estimatedPoints =
		calculateTextPoints(text) +
		(modelMode === "design" ? Math.round(calculateTextPoints(voiceDesignPrompt) / 4) : 0);

	return (
		<div className="min-h-0 lg:max-h-[calc(100dvh-80px)] overflow-y-auto lg:overflow-hidden p-2 flex flex-col gradient-mesh-bg">
			<Card className="mb-3 shrink-0 overflow-hidden card-modern">
				<CardContent className="p-1.5 sm:p-2">
					<div className="grid grid-cols-3 gap-1.5 sm:gap-2">
						{MODELS.map((m, index) => (
							<button
								type="button"
								key={m.id}
								onClick={() => {
									setModelMode(m.id);
									voiceDesignManuallyEdited.current = false;
									setTagSynced(false);
									if (m.id === "design" || m.id === "clone") {
										setActiveProvider("mimo");
									}
								}}
								className={`touch-active relative p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all duration-300 ease-out overflow-hidden hover:scale-[1.02] active:scale-[0.98] ${
									modelMode === m.id
										? "border-primary/50 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg shadow-primary/20 glow-violet"
										: "border-border/50 bg-gradient-to-br from-background to-muted/20 hover:border-primary/30 hover:shadow-md hover:shadow-primary/10 hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent"
								}`}
								style={{ animationDelay: `${index * 50}ms` }}
							>
								{modelMode === m.id && (
									<div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center shadow-lg shadow-primary/30 animate-bounce-in pulse-glow">
										<Sparkles className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
									</div>
								)}
								<div className="flex items-start gap-1.5 sm:gap-2">
									<div
										className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg shrink-0 transition-all duration-300 ${
											modelMode === m.id
												? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 glow-violet"
												: "bg-gradient-to-br from-muted to-muted/80 text-muted-foreground group-hover:from-primary/20 group-hover:to-primary/10"
										}`}
									>
										{m.icon}
									</div>
									<div className="text-left min-w-0">
										<span className="text-xs sm:text-sm font-semibold block truncate">
											{m.name}
										</span>
										<span className="text-[10px] sm:text-xs text-muted-foreground/80 truncate block">
											{m.desc}
										</span>
									</div>
								</div>
								{modelMode === m.id && (
									<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
								)}
							</button>
						))}
					</div>
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 gap-3 sm:gap-4 flex-1 lg:grid-cols-5 lg:grid-rows-1 min-h-0">
				<div className="flex flex-col gap-2 min-h-0 lg:col-span-3 order-2 lg:order-1">
					<div className="flex flex-col gap-2 min-h-0 overflow-y-auto flex-1">
						{modelMode !== "design" && (
							<TextInput
								text={text}
								onTextChange={setText}
								activeProvider={activeProvider}
								modelMode={modelMode}
								maxChars={getMaxChars()}
								estimatedPoints={estimatedPoints}
								t={t}
								richTextEditorRef={richTextEditorRef}
							/>
						)}

						{modelMode === "design" && (
							<Card className="flex-1 min-h-0 flex flex-col animate-fade-float border-violet-200/60 dark:border-violet-800/40 shadow-md shadow-violet-500/5 dark:shadow-violet-900/10">
								<CardContent className="pt-4 pb-4 space-y-3 flex-1 min-h-0 overflow-y-auto">
									<VoiceDesign
										voiceDesignPrompt={voiceDesignPrompt}
										setVoiceDesignPrompt={setVoiceDesignPrompt}
										t={t}
										text={text}
										setText={setText}
										getMaxChars={getMaxChars}
										estimatedPoints={estimatedPoints}
										tagSynced={tagSynced}
										onSyncFromTags={() => {
											voiceDesignManuallyEdited.current = false;
											if (derivedStylePrompt) {
												setVoiceDesignPrompt(derivedStylePrompt);
												setTagSynced(true);
											}
										}}
										onManualEdit={() => {
											voiceDesignManuallyEdited.current = true;
											setTagSynced(false);
										}}
									/>
								</CardContent>
							</Card>
						)}

						{modelMode === "clone" && (
							<Card className="shrink-0">
								<CardContent className="pt-2 pb-2 space-y-0">
									<VoiceClone
										cloneFile={cloneFile}
										setCloneFile={setCloneFile}
										cloneBase64={cloneBase64}
										setCloneBase64={setCloneBase64}
										cloneConsent={cloneConsent}
										setCloneConsent={setCloneConsent}
										savedVoices={savedVoices}
										onDeleteVoice={handleDeleteVoice}
										onUpdateVoiceName={handleUpdateVoiceName}
										editingVoiceId={editingVoiceId}
										setEditingVoiceId={setEditingVoiceId}
										editingVoiceName={editingVoiceName}
										setEditingVoiceName={setEditingVoiceName}
										fileInputRef={fileInputRef}
										onFileChange={handleFileChange}
										t={t}
										onGenerate={handleGenerate}
										onCancelGenerate={handleCancelGenerate}
										isGenerating={isGenerating}
										text={text}
										getMaxChars={getMaxChars}
										hasActiveMembership={hasActiveMembership}
									/>
								</CardContent>
							</Card>
						)}
					</div>

					{modelMode !== "clone" && (
						<Button
							onClick={isGenerating ? handleCancelGenerate : handleGenerate}
							disabled={
								!isGenerating &&
								(!text.trim() ||
									(modelMode === "design"
										? text.length + voiceDesignPrompt.length > getMaxChars()
										: text.length > getMaxChars()))
							}
							variant={isGenerating ? "destructive" : "default"}
							className={`w-full shrink-0 touch-btn touch-active sticky bottom-0 z-10 ${
								isGenerating
									? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-[0_4px_14px_-2px_rgba(239,68,68,0.25),0_2px_6px_-2px_rgba(239,68,68,0.15)] hover:shadow-[0_8px_20px_-4px_rgba(239,68,68,0.35),0_4px_10px_-4px_rgba(239,68,68,0.2)]"
									: "btn-gradient"
							} transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 ease-out rounded-xl font-semibold`}
							size="lg"
						>
							{isGenerating ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									{t("cancel") || "取消"}
								</>
							) : (
								<>
									<Send className="mr-2 h-4 w-4" />
									{t("generate")}
								</>
							)}
						</Button>
					)}

					{error && (
						<Card className="border-destructive/60 shadow-sm shadow-red-500/5 dark:shadow-red-900/10">
							<CardContent className="pt-6">
								<p className="text-destructive text-sm">{error}</p>
							</CardContent>
						</Card>
					)}

					<AudioPreview
						audioUrl={audioUrl}
						modelMode={modelMode}
						presetVoice={presetVoice}
						audioTags={audioTags}
						locale={locale}
						t={t}
						audioRef={audioRef}
						onDownload={handleDownload}
						onError={setError}
						onPlayingChange={setIsPlaying}
					/>
				</div>

				<div className="flex flex-col lg:col-span-2 order-1 lg:order-2 overflow-hidden">
					<div className="flex flex-col gap-3 sm:gap-4 overflow-y-auto min-h-0 flex-1 pr-1">
						<ProviderSelector
							modelMode={modelMode}
							providers={providers}
							activeProvider={activeProvider}
							hasActiveMembership={hasActiveMembership}
							t={t}
							onProviderChange={setActiveProvider}
						/>

						{modelMode !== "design" ? (
							<Card className="lg:flex-1 min-h-0 max-h-[40vh] lg:max-h-[calc(100vh-280px)] flex flex-col animate-fade-float card-modern">
								<CardContent className="pt-4 pb-4 space-y-3 flex-1 min-h-0 overflow-y-auto">
									{modelMode === "preset" && (
										<VoicePreset
											presetVoice={presetVoice}
											setPresetVoice={handlePresetVoiceChange}
											t={t}
											isLocked={isVoiceLocked}
											isMember={hasActiveMembership}
										/>
									)}

									{(modelMode === "preset" || modelMode === "clone") && (
										<div>
											<div className="h-px bg-gradient-to-r from-transparent via-violet-300/50 dark:via-violet-700/30 to-transparent mt-1" />
											<div className="pt-2">
												<VoiceParamsPanel
													provider={activeProvider as "mimo" | "minimax"}
													modelMode={modelMode}
													selectedParamIds={selectedParamIds}
													onChange={setSelectedParamIds}
													onStylePromptChange={(prompt) => {
														suppressAutoSync.current = true;
														setStylePrompt(prompt);
														queueMicrotask(() => {
															suppressAutoSync.current = false;
														});
													}}
													onPresetChange={(presetId) => {
														if (presetId) {
															setPresetVoice("");
															prevPresetDefaultTagsRef.current = [];
														}
													}}
													languageBoost={languageBoost}
													onLanguageBoostChange={setLanguageBoost}
													t={t}
													locale={locale}
												/>
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						) : (
							<Card className="lg:flex-1 min-h-0 max-h-[40vh] lg:max-h-[calc(100vh-280px)] flex flex-col card-modern">
								<CardContent className="pt-4 pb-4 flex-1 min-h-0 overflow-y-auto">
									<VoiceParamsPanel
										provider="mimo"
										modelMode={modelMode}
										selectedParamIds={selectedParamIds}
										onChange={setSelectedParamIds}
										onDesignPromptChange={(prompt) => {
											suppressAutoSync.current = true;
											setVoiceDesignPrompt(prompt);
											voiceDesignManuallyEdited.current = false;
											setTagSynced(true);
											queueMicrotask(() => {
												suppressAutoSync.current = false;
											});
										}}
										t={t}
										locale={locale}
									/>
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
