"use client";

import {
	AudioWaveform,
	BookOpen,
	ChevronDown,
	ChevronUp,
	CloudRain,
	Drama,
	Film,
	Gauge,
	Globe,
	Heart,
	Laugh,
	Mic,
	Music,
	Radio,
	RotateCcw,
	Smile,
	Sparkles,
	Sun,
	Timer,
	User,
	Wand2,
	Waves,
	Zap,
} from "lucide-react";
import type { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import type {
	ParamCategory,
	QuickPreset,
	TtsProvider,
	VoiceParamOption,
} from "./voice-params-config";
import {
	areParamsMutex,
	buildMimoTags,
	buildMinimaxParams,
	buildStylePrompt,
	filterParamsByProvider,
	findConflictingEmotionParams,
	getParamCategory,
	LABEL_EN_MAP,
	PARAM_GROUPS,
	PARAM_OPTIONS,
	QUICK_PRESETS,
} from "./voice-params-config";

// ==================== Icon 映射 ====================
const ICON_MAP: Record<string, React.ReactNode> = {
	Zap: <Zap className="h-3.5 w-3.5" />,
	Smile: <Smile className="h-3.5 w-3.5" />,
	Music: <Music className="h-3.5 w-3.5" />,
	AudioWaveform: <AudioWaveform className="h-3.5 w-3.5" />,
	Globe: <Globe className="h-3.5 w-3.5" />,
	Timer: <Timer className="h-3.5 w-3.5" />,
	Heart: <Heart className="h-3.5 w-3.5" />,
	Waves: <Waves className="h-3.5 w-3.5" />,
	Drama: <Drama className="h-3.5 w-3.5" />,
	User: <User className="h-3.5 w-3.5" />,
	Gauge: <Gauge className="h-3.5 w-3.5" />,
	CloudRain: <CloudRain className="h-3.5 w-3.5" />,
	Sun: <Sun className="h-3.5 w-3.5" />,
	BookOpen: <BookOpen className="h-3.5 w-3.5" />,
	Radio: <Radio className="h-3.5 w-3.5" />,
	Film: <Film className="h-3.5 w-3.5" />,
	Laugh: <Laugh className="h-3.5 w-3.5" />,
	Mic: <Mic className="h-3.5 w-3.5" />,
	Video: <Film className="h-3.5 w-3.5" />,
};

// ==================== 分类颜色映射 ====================
const CATEGORY_COLORS: Record<
	ParamCategory,
	{ bg: string; border: string; text: string; activeBg: string; activeBorder: string }
> = {
	preset: {
		bg: "bg-amber-50 dark:bg-amber-950/30",
		border: "border-amber-200 dark:border-amber-800/50",
		text: "text-amber-700 dark:text-amber-400",
		activeBg: "bg-gradient-to-r from-amber-500 to-orange-500",
		activeBorder: "border-amber-500",
	},
	basicEmotion: {
		bg: "bg-rose-50 dark:bg-rose-950/30",
		border: "border-rose-200 dark:border-rose-800/50",
		text: "text-rose-700 dark:text-rose-400",
		activeBg: "bg-gradient-to-r from-rose-500 to-pink-500",
		activeBorder: "border-rose-500",
	},
	tone: {
		bg: "bg-violet-50 dark:bg-violet-950/30",
		border: "border-violet-200 dark:border-violet-800/50",
		text: "text-violet-700 dark:text-violet-400",
		activeBg: "bg-gradient-to-r from-violet-500 to-purple-500",
		activeBorder: "border-violet-500",
	},
	voiceType: {
		bg: "bg-cyan-50 dark:bg-cyan-950/30",
		border: "border-cyan-200 dark:border-cyan-800/50",
		text: "text-cyan-700 dark:text-cyan-400",
		activeBg: "bg-gradient-to-r from-cyan-500 to-blue-500",
		activeBorder: "border-cyan-500",
	},
	dialect: {
		bg: "bg-emerald-50 dark:bg-emerald-950/30",
		border: "border-emerald-200 dark:border-emerald-800/50",
		text: "text-emerald-700 dark:text-emerald-400",
		activeBg: "bg-gradient-to-r from-emerald-500 to-teal-500",
		activeBorder: "border-emerald-500",
	},
	rhythm: {
		bg: "bg-orange-50 dark:bg-orange-950/30",
		border: "border-orange-200 dark:border-orange-800/50",
		text: "text-orange-700 dark:text-orange-400",
		activeBg: "bg-gradient-to-r from-orange-500 to-amber-500",
		activeBorder: "border-orange-500",
	},
	state: {
		bg: "bg-indigo-50 dark:bg-indigo-950/30",
		border: "border-indigo-200 dark:border-indigo-800/50",
		text: "text-indigo-700 dark:text-indigo-400",
		activeBg: "bg-gradient-to-r from-indigo-500 to-blue-500",
		activeBorder: "border-indigo-500",
	},
	feature: {
		bg: "bg-slate-50 dark:bg-slate-950/30",
		border: "border-slate-200 dark:border-slate-800/50",
		text: "text-slate-700 dark:text-slate-400",
		activeBg: "bg-gradient-to-r from-slate-500 to-gray-500",
		activeBorder: "border-slate-500",
	},
	expression: {
		bg: "bg-fuchsia-50 dark:bg-fuchsia-950/30",
		border: "border-fuchsia-200 dark:border-fuchsia-800/50",
		text: "text-fuchsia-700 dark:text-fuchsia-400",
		activeBg: "bg-gradient-to-r from-fuchsia-500 to-pink-500",
		activeBorder: "border-fuchsia-500",
	},
	character: {
		bg: "bg-yellow-50 dark:bg-yellow-950/30",
		border: "border-yellow-200 dark:border-yellow-800/50",
		text: "text-yellow-700 dark:text-yellow-400",
		activeBg: "bg-gradient-to-r from-yellow-500 to-amber-500",
		activeBorder: "border-yellow-500",
	},
	speed: {
		bg: "bg-teal-50 dark:bg-teal-950/30",
		border: "border-teal-200 dark:border-teal-800/50",
		text: "text-teal-700 dark:text-teal-400",
		activeBg: "bg-gradient-to-r from-teal-500 to-emerald-500",
		activeBorder: "border-teal-500",
	},
};

// ==================== Props ====================
type Props = {
	provider: TtsProvider;
	modelMode: "preset" | "design" | "clone";
	selectedParamIds: string[];
	onChange: (ids: string[]) => void;
	onDesignPromptChange?: (prompt: string) => void;
	onStylePromptChange?: (prompt: string) => void;
	onPresetChange?: (presetId: string | null) => void;
	languageBoost?: string;
	onLanguageBoostChange?: (value: string) => void;
	t: ReturnType<typeof useTranslations>;
	locale: string;
};

export function VoiceParamsPanel({
	provider,
	modelMode,
	selectedParamIds,
	onChange,
	onDesignPromptChange,
	onStylePromptChange,
	onPresetChange,
	languageBoost,
	onLanguageBoostChange,
	t,
	locale,
}: Props) {
	const [collapsedGroups, setCollapsedGroups] = useState<Set<ParamCategory>>(
		new Set(PARAM_GROUPS.filter((g) => g.category !== "preset").map((g) => g.category)),
	);
	const [activePreset, setActivePreset] = useState<string | null>(null);

	const toggleGroup = useCallback((category: ParamCategory) => {
		setCollapsedGroups((prev) => {
			const next = new Set(prev);
			if (next.has(category)) {
				next.delete(category);
			} else {
				next.add(category);
			}
			return next;
		});
	}, []);

	// 判断是否选中
	const isSelected = useCallback((id: string) => selectedParamIds.includes(id), [selectedParamIds]);

	// 切换参数选择（处理互斥 + emotion 冲突）
	const toggleParam = useCallback(
		(option: VoiceParamOption, category: ParamCategory) => {
			const groupConfig = PARAM_GROUPS.find((g) => g.category === category);
			const isMulti = groupConfig?.selectionMode === "multiple";

			if (isSelected(option.id)) {
				onChange(selectedParamIds.filter((id) => id !== option.id));
				if (activePreset) {
					setActivePreset(null);
					onPresetChange?.(null);
				}
			} else {
				let newIds = [...selectedParamIds];

				// 方言标签：与所有其他标签互斥，直接替换
				if (category === "dialect") {
					onChange([option.id]);
					if (activePreset) {
						setActivePreset(null);
						onPresetChange?.(null);
					}
					return;
				}

				// 选非方言标签时，清除已选的方言标签
				newIds = newIds.filter((id) => getParamCategory(id) !== "dialect");

				// 同 mutexGroup 互斥
				if (option.mutexGroup) {
					newIds = newIds.filter((id) => {
						if (id === option.id) return false;
						return !areParamsMutex(id, option.id);
					});
				}

				// 单选模式：同分类互斥
				if (!isMulti) {
					newIds = newIds.filter((id) => getParamCategory(id) !== category);
				}

				// 跨分类 emotion 冲突：MiniMax 只接受一个 emotion
				const emotionConflicts = findConflictingEmotionParams(newIds, option.id);
				if (emotionConflicts.length > 0) {
					newIds = newIds.filter((id) => !emotionConflicts.includes(id));
				}

				newIds.push(option.id);
				onChange(newIds);
				if (activePreset) {
					setActivePreset(null);
					onPresetChange?.(null);
				}
			}
		},
		[selectedParamIds, onChange, isSelected, activePreset, onPresetChange],
	);

	// 应用快捷预设
	const applyPreset = useCallback(
		(preset: QuickPreset) => {
			const newIds: string[] = [];
			for (const [_cat, ids] of Object.entries(preset.params)) {
				if (ids) {
					newIds.push(...ids);
				}
			}
			onChange(newIds);
			setActivePreset(preset.id);
			onPresetChange?.(preset.id);
			const dp =
				locale === "en" && preset.designPromptEn ? preset.designPromptEn : preset.designPrompt;
			if (dp) {
				onDesignPromptChange?.(dp);
			}
			const sp =
				locale === "en" && preset.stylePromptEn ? preset.stylePromptEn : preset.stylePrompt;
			if (sp) {
				onStylePromptChange?.(sp);
			}
		},
		[onChange, onDesignPromptChange, onStylePromptChange, onPresetChange, locale],
	);

	// 重置所有参数
	const resetParams = useCallback(() => {
		onChange([]);
		setActivePreset(null);
		onPresetChange?.(null);
	}, [onChange, onPresetChange]);

	// 总选中数量
	const totalSelected = selectedParamIds.length;

	// 构建 MiniMax 参数预览
	const minimaxPreview = useMemo(() => {
		if (provider !== "minimax") return null;
		return buildMinimaxParams(selectedParamIds);
	}, [provider, selectedParamIds]);

	// 构建 MiMo 标签预览
	const _mimoPreview = useMemo(() => {
		if (provider !== "mimo") return null;
		return buildMimoTags(selectedParamIds);
	}, [provider, selectedParamIds]);

	const styleSummary = useMemo(() => buildStylePrompt(selectedParamIds), [selectedParamIds]);

	const getDisplayLabel = useCallback(
		(label: string) => {
			if (locale !== "en") return label;
			return LABEL_EN_MAP[label] || label;
		},
		[locale],
	);

	const styleSummaryDisplay = useMemo(() => {
		const parts: string[] = [];
		for (const id of selectedParamIds) {
			for (const category of Object.keys(PARAM_OPTIONS) as ParamCategory[]) {
				const opt = PARAM_OPTIONS[category]?.find((o) => o.id === id);
				if (opt?.mimoStyleTag) {
					parts.push(getDisplayLabel(opt.label));
				}
			}
		}
		return parts.join(locale === "en" ? ", " : "，");
	}, [selectedParamIds, locale, getDisplayLabel]);

	// 检查某参数是否与当前选中参数存在 emotion 冲突（用于视觉提示）
	const wouldEmotionConflict = useCallback(
		(optionId: string) => {
			return findConflictingEmotionParams(selectedParamIds, optionId).length > 0;
		},
		[selectedParamIds],
	);

	return (
		<TooltipProvider delayDuration={200}>
			<div className="space-y-3">
				{/* 顶部工具栏 */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400">
							<Wand2 className="h-3.5 w-3.5" />
						</div>
						<span className="text-sm font-semibold">{t("params.title")}</span>
						{totalSelected > 0 && (
							<Badge
								variant="secondary"
								className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
							>
								{totalSelected}
							</Badge>
						)}
					</div>
					<Button
						variant="ghost"
						size="sm"
						className="h-7 text-xs text-muted-foreground hover:text-destructive"
						onClick={resetParams}
						disabled={totalSelected === 0}
					>
						<RotateCcw className="h-3 w-3 mr-1" />
						{t("params.reset")}
					</Button>
				</div>

				{/* 风格快捷预设 - 横向滚动卡片 */}
				<div className="relative">
					<div
						className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
						style={{
							maskImage:
								"linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)",
							WebkitMaskImage:
								"linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)",
						}}
					>
						{QUICK_PRESETS.map((preset) => {
							const isActive = activePreset === preset.id;
							return (
								<button
									type="button"
									key={preset.id}
									onClick={() => applyPreset(preset)}
									className={`relative shrink-0 flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all duration-200 min-w-[80px] ${
										isActive
											? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 shadow-sm"
											: "border-transparent bg-muted/40 hover:bg-muted hover:border-amber-200/50"
									}`}
								>
									<div
										className={`flex items-center justify-center w-8 h-8 rounded-full ${
											isActive
												? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm"
												: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
										}`}
									>
										{ICON_MAP[preset.icon] || <Zap className="h-4 w-4" />}
									</div>
									<span className="text-[11px] font-semibold leading-tight text-center">
										{locale === "en" ? preset.labelEn : preset.label}
									</span>
									<span className="text-[9px] text-muted-foreground/70 leading-tight text-center line-clamp-1">
										{locale === "en" ? preset.descriptionEn : preset.description}
									</span>
								</button>
							);
						})}
					</div>
				</div>

				{/* 参数预览条 */}
				{totalSelected > 0 && (
					<Card className="border-dashed border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-950/20">
						<CardContent className="p-2.5">
							<div className="flex flex-wrap gap-1">
								{selectedParamIds.map((id) => {
									const cat = getParamCategory(id);
									const opt = cat ? PARAM_OPTIONS[cat]?.find((o) => o.id === id) : null;
									if (!opt || !cat) return null;
									const colors = CATEGORY_COLORS[cat];
									return (
										<Badge
											key={id}
											variant="secondary"
											className={`text-xs cursor-pointer hover:opacity-80 ${colors.activeBg} text-white border-0`}
											onClick={() => toggleParam(opt, cat)}
										>
											{getDisplayLabel(opt.label)}
											<span className="ml-1 opacity-70">×</span>
										</Badge>
									);
								})}
							</div>
							{minimaxPreview && (
								<div className="mt-2 pt-2 border-t border-amber-200/50 dark:border-amber-800/30 flex items-center gap-3 text-[10px] text-muted-foreground">
									<span className="flex items-center gap-1">
										<span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
										emotion: {minimaxPreview.emotion || "auto"}
									</span>
									<span className="flex items-center gap-1">
										<span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
										pitch: {minimaxPreview.pitch}
									</span>
									<span className="flex items-center gap-1">
										<span className="w-1.5 h-1.5 rounded-full bg-green-400" />
										speed: {minimaxPreview.speed.toFixed(2)}
									</span>
								</div>
							)}
							{provider === "mimo" && styleSummary && (
								<div className="mt-2 pt-2 border-t border-amber-200/50 dark:border-amber-800/30 text-[10px] text-muted-foreground">
									<span className="flex items-center gap-1">
										<span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
										{t("params.style")} {styleSummaryDisplay}
									</span>
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{/* 参数分组 - 两栏网格 */}
				<div className="grid grid-cols-2 gap-2">
					{PARAM_GROUPS.filter((g) => g.category !== "preset")
						.filter((g) => !(g.category === "dialect" && modelMode !== "preset"))
						.map((group) => {
							const colors = CATEGORY_COLORS[group.category];
							const options = PARAM_OPTIONS[group.category] || [];
							const filteredOptions = filterParamsByProvider(options, provider, group.category);
							if (filteredOptions.length === 0) return null;
							const selectedCount = selectedParamIds.filter(
								(id) => getParamCategory(id) === group.category,
							).length;
							const isCollapsed = collapsedGroups.has(group.category);

							return (
								<div key={group.category}>
									<button
										type="button"
										onClick={() => toggleGroup(group.category)}
										className={`flex items-center justify-between w-full px-2 py-1 rounded-md transition-colors ${
											selectedCount > 0
												? `${colors.bg} border ${colors.border}`
												: "hover:bg-muted/40"
										}`}
									>
										<div className="flex items-center gap-1.5 min-w-0">
											<div
												className={`flex items-center justify-center w-4 h-4 rounded ${colors.bg} ${colors.text} shrink-0`}
											>
												{ICON_MAP[group.icon] || <Sparkles className="h-3 w-3" />}
											</div>
											<span className="text-[11px] font-medium truncate">
												{locale === "en" ? group.labelEn : group.label}
											</span>
											{selectedCount > 0 && (
												<span
													className={`text-[9px] font-bold shrink-0 px-1 rounded ${colors.activeBg} text-white`}
												>
													{selectedCount}
												</span>
											)}
										</div>
										{isCollapsed ? (
											<ChevronDown className="h-3 w-3 text-muted-foreground/60 shrink-0" />
										) : (
											<ChevronUp className="h-3 w-3 text-muted-foreground/60 shrink-0" />
										)}
									</button>

									{!isCollapsed && (
										<div className="flex flex-wrap gap-1 pt-1.5 pb-0.5">
											{filteredOptions.map((option) => {
												const selected = isSelected(option.id);
												const hasConflict = !selected && wouldEmotionConflict(option.id);
												const isDialect = group.category === "dialect";
												const label = isDialect
													? `${getDisplayLabel(option.label)}（${t("params.solo")}）`
													: getDisplayLabel(option.label);
												return (
													<button
														type="button"
														key={option.id}
														onClick={() => toggleParam(option, group.category)}
														className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all duration-200 border ${
															selected
																? `${colors.activeBg} text-white ${colors.activeBorder} shadow-sm`
																: hasConflict
																	? "bg-white/50 dark:bg-gray-900/50 text-muted-foreground/50 border-muted/30 line-through cursor-pointer"
																	: `${colors.bg} ${colors.border} ${colors.text} hover:bg-accent hover:text-accent-foreground hover:shadow-sm`
														}`}
													>
														{label}
													</button>
												);
											})}
										</div>
									)}
								</div>
							);
						})}
				</div>

				{/* MiniMax 语言增强 - 仅在 MiniMax 选中时显示 */}
				{provider === "minimax" && onLanguageBoostChange && (
					<div className="space-y-1.5">
						<div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
							<div className="flex items-center justify-center w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
								<Globe className="h-3 w-3" />
							</div>
							<span className="text-[11px] font-medium text-blue-700 dark:text-blue-400">
								{t("languageBoost")}
							</span>
						</div>
						<Select value={languageBoost || ""} onValueChange={onLanguageBoostChange}>
							<SelectTrigger className="h-7 text-[11px]">
								<SelectValue placeholder={t("autoDetect")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="auto">{t("autoDetect")}</SelectItem>
								<SelectItem value="Chinese">{t("languages.chinese")}</SelectItem>
								<SelectItem value="Chinese,Yue">{t("languages.cantonese")}</SelectItem>
								<SelectItem value="English">{t("languages.english")}</SelectItem>
								<SelectItem value="Japanese">{t("languages.japanese")}</SelectItem>
								<SelectItem value="Korean">{t("languages.korean")}</SelectItem>
								<SelectItem value="French">{t("languages.french")}</SelectItem>
								<SelectItem value="German">{t("languages.german")}</SelectItem>
								<SelectItem value="Spanish">{t("languages.spanish")}</SelectItem>
								<SelectItem value="Portuguese">{t("languages.portuguese")}</SelectItem>
								<SelectItem value="Russian">{t("languages.russian")}</SelectItem>
								<SelectItem value="Arabic">{t("languages.arabic")}</SelectItem>
								<SelectItem value="Italian">{t("languages.italian")}</SelectItem>
								<SelectItem value="Vietnamese">{t("languages.vietnamese")}</SelectItem>
								<SelectItem value="Indonesian">{t("languages.indonesian")}</SelectItem>
								<SelectItem value="Turkish">{t("languages.turkish")}</SelectItem>
								<SelectItem value="Dutch">{t("languages.dutch")}</SelectItem>
								<SelectItem value="Ukrainian">{t("languages.ukrainian")}</SelectItem>
								<SelectItem value="Thai">{t("languages.thai")}</SelectItem>
								<SelectItem value="Polish">{t("languages.polish")}</SelectItem>
								<SelectItem value="Romanian">{t("languages.romanian")}</SelectItem>
								<SelectItem value="Greek">{t("languages.greek")}</SelectItem>
								<SelectItem value="Czech">{t("languages.czech")}</SelectItem>
								<SelectItem value="Finnish">{t("languages.finnish")}</SelectItem>
								<SelectItem value="Hindi">{t("languages.hindi")}</SelectItem>
								<SelectItem value="Bulgarian">{t("languages.bulgarian")}</SelectItem>
								<SelectItem value="Danish">{t("languages.danish")}</SelectItem>
								<SelectItem value="Hebrew">{t("languages.hebrew")}</SelectItem>
								<SelectItem value="Malay">{t("languages.malay")}</SelectItem>
								<SelectItem value="Persian">{t("languages.persian")}</SelectItem>
								<SelectItem value="Slovak">{t("languages.slovak")}</SelectItem>
								<SelectItem value="Swedish">{t("languages.swedish")}</SelectItem>
								<SelectItem value="Croatian">{t("languages.croatian")}</SelectItem>
								<SelectItem value="Filipino">{t("languages.filipino")}</SelectItem>
								<SelectItem value="Hungarian">{t("languages.hungarian")}</SelectItem>
								<SelectItem value="Norwegian">{t("languages.norwegian")}</SelectItem>
								<SelectItem value="Slovenian">{t("languages.slovenian")}</SelectItem>
								<SelectItem value="Catalan">{t("languages.catalan")}</SelectItem>
								<SelectItem value="Tamil">{t("languages.tamil")}</SelectItem>
								<SelectItem value="Afrikaans">{t("languages.afrikaans")}</SelectItem>
							</SelectContent>
						</Select>
					</div>
				)}
			</div>
		</TooltipProvider>
	);
}
