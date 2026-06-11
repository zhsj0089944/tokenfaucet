import type { VoiceModifySettings } from "./voice-params-config";
import { QUICK_PRESETS } from "./voice-params-config";

// ==================== 类型 ====================
export type ModelMode = "preset" | "design" | "clone";

export type SavedVoice = {
	id: string;
	name: string;
	description?: string | null;
	voiceType: string;
	presetVoiceId?: string | null;
	designPrompt?: string | null;
	cloneAudioData?: string | null;
	isDefault?: boolean | null;
	createdAt?: string | null;
};

export type TtsProvider = {
	id: string;
	name: string;
	description: string;
	features?: string[];
	subscriptionRequired: boolean;
	voices: Array<{ id: string; name: string; lang: string; gender: string }>;
	defaultVoice: string;
};

export type UserPointsState = {
	dailyBalance: number;
	monthlyBalance: number;
	totalBalance: number;
	dailyPoints: number;
	monthlyPoints: number;
	isSubscribed: boolean;
	planName?: string;
};

// ==================== 常量 ====================
export const INVITE_UNLOCK_COUNT = 3;
export const SUBSCRIPTION_ONLY_VOICES = ["english_lady", "english_gentleman"];

// ==================== 网站专属预设音色（统一品牌，双模型映射） ====================
export const SITE_PRESET_VOICES = [
	{
		id: "sister_warm",
		nameKey: "voices.sisterWarm" as const,
		descKey: "voices.sisterWarmDesc" as const,
		genderKey: "voices.female" as const,
		langKey: "voices.chinese" as const,
		minimaxId: "female-chengshu",
		mimoId: "冰糖",
		voiceModify: { intensity: 15 },
		defaultTagIds: ["gentle"],
	},
	{
		id: "magnetic_radio",
		nameKey: "voices.magneticRadio" as const,
		descKey: "voices.magneticRadioDesc" as const,
		genderKey: "voices.male" as const,
		langKey: "voices.chinese" as const,
		minimaxId: "male-qn-jingying",
		mimoId: "苏打",
		voiceModify: { timbre: -18 },
		defaultTagIds: ["magnetic"],
	},
	{
		id: "lively_girl",
		nameKey: "voices.livelyGirl" as const,
		descKey: "voices.livelyGirlDesc" as const,
		genderKey: "voices.female" as const,
		langKey: "voices.chinese" as const,
		minimaxId: "female-shaonv",
		mimoId: "茉莉",
		voiceModify: { pitch: 12 },
		defaultTagIds: ["lively"],
	},
	{
		id: "cool_queen",
		nameKey: "voices.coolQueen" as const,
		descKey: "voices.coolQueenDesc" as const,
		genderKey: "voices.female" as const,
		langKey: "voices.chinese" as const,
		minimaxId: "female-yujie",
		mimoId: "Chloe",
		voiceModify: { intensity: -15 },
		defaultTagIds: ["serious"],
	},
	{
		id: "business_elite",
		nameKey: "voices.businessElite" as const,
		descKey: "voices.businessEliteDesc" as const,
		genderKey: "voices.male" as const,
		langKey: "voices.chinese" as const,
		minimaxId: "male-qn-badao",
		mimoId: "白桦",
		voiceModify: { intensity: -12 },
		defaultTagIds: ["capable"],
	},
	{
		id: "english_lady",
		nameKey: "voices.englishLady" as const,
		descKey: "voices.englishLadyDesc" as const,
		genderKey: "voices.female" as const,
		langKey: "voices.english" as const,
		minimaxId: "female-chengshu",
		mimoId: "Mia",
		voiceModify: { intensity: 12 },
		defaultTagIds: ["gentle"],
	},
	{
		id: "english_gentleman",
		nameKey: "voices.englishGentleman" as const,
		descKey: "voices.englishGentlemanDesc" as const,
		genderKey: "voices.male" as const,
		langKey: "voices.english" as const,
		minimaxId: "English_Gentle-voiced_man",
		mimoId: "Dean",
		voiceModify: { timbre: -15 },
		defaultTagIds: ["calm"],
	},
];

// ==================== 工具函数 ====================
export const FEATURE_KEY_MAP: Record<string, string> = {
	风格控制: "styleControl",
	音频标签: "audioTags",
	支持中文方言: "chars10000",
	"40种语言支持": "multiLanguage",
	语速调整: "multiVoice",
	"10000字符": "chars10000",
	订阅专享: "subscriptionOnly",
};

// 根据当前 provider 获取对应的模型音色ID
export function getVoiceIdForProvider(voiceId: string, provider: string): string | null {
	if (!voiceId) return null;
	const voice = SITE_PRESET_VOICES.find((v) => v.id === voiceId);
	if (!voice) return voiceId;
	return provider === "mimo" ? voice.mimoId : voice.minimaxId;
}

// 获取品牌音色自带的 voice_modify 参数
export function getVoiceModifyForPreset(voiceId: string): VoiceModifySettings | undefined {
	const voice = SITE_PRESET_VOICES.find((v) => v.id === voiceId);
	if (!voice?.voiceModify) return undefined;
	const { pitch, intensity, timbre } = voice.voiceModify;
	if (!pitch && !intensity && !timbre) return undefined;
	return { pitch, intensity, timbre };
}

// 获取品牌音色的默认标签 ID 列表
export function getDefaultTagIdsForPreset(voiceId: string): string[] {
	const voice = SITE_PRESET_VOICES.find((v) => v.id === voiceId);
	return voice?.defaultTagIds ?? [];
}

// 检查当前选中的参数是否匹配某个快捷预设（用于互斥判断）
export function isQuickPresetActive(selectedIds: string[]): boolean {
	if (selectedIds.length === 0) return false;
	const selectedSet = new Set(selectedIds);
	return QUICK_PRESETS.some((preset) => {
		const presetIds: string[] = [];
		for (const ids of Object.values(preset.params)) {
			if (ids) presetIds.push(...ids);
		}
		if (presetIds.length !== selectedSet.size) return false;
		return presetIds.every((id) => selectedSet.has(id));
	});
}

// 获取当前激活的快捷预设（如果有）
export function getActiveQuickPreset(selectedIds: string[]) {
	if (selectedIds.length === 0) return null;
	const selectedSet = new Set(selectedIds);
	return QUICK_PRESETS.find((preset) => {
		const presetIds: string[] = [];
		for (const ids of Object.values(preset.params)) {
			if (ids) presetIds.push(...ids);
		}
		if (presetIds.length !== selectedSet.size) return false;
		return presetIds.every((id) => selectedSet.has(id));
	});
}

// 计算文本消耗的积分
export function calculateTextPoints(inputText: string): number {
	let points = 0;
	for (const char of inputText) {
		if (/[\u4e00-\u9fa5]/.test(char)) {
			points += 4;
		} else if (/[0-9]/.test(char)) {
			points += 0;
		} else if (/[a-zA-Z]/.test(char)) {
			points += 2.5;
		} else if (/[\u0021-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E]/.test(char)) {
			points += 0.5;
		} else if (/[\u3000-\u303F\uFF00-\uFFEF]/.test(char)) {
			points += 0.5;
		} else {
			points += 2.5;
		}
	}
	return Math.ceil(points);
}
