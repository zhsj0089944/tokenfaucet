"use client";

// ==================== TTS 参数配置系统 ====================
// 重新设计：支持模型差异化、互斥规则、快捷预设

export type TtsProvider = "minimax" | "mimo";

// 参数分类
export type ParamCategory =
	| "preset" // 快捷预设
	| "basicEmotion" // 基础情绪
	| "tone" // 整体语调
	| "voiceType" // 音色定位
	| "dialect" // 方言
	| "rhythm" // 语速节奏
	| "state" // 情绪状态
	| "feature" // 语音特征
	| "expression" // 哭笑表达
	| "character" // 人设腔调
	| "speed"; // 语速

// MiniMax voice_modify 声音效果器参数
// 官方范围: pitch [-100,100], intensity [-100,100], timbre [-100,100]
// pitch: 接近-100更低沉，接近100更明亮
// intensity: 接近-100更刚劲，接近100更轻柔
// timbre: 接近-100更浑厚，接近100更清脆
export interface VoiceModifySettings {
	pitch?: number;
	intensity?: number;
	timbre?: number;
	sound_effects?: "spacious_echo" | "auditorium_echo" | "lofi_telephone" | "robotic";
}

// 单个参数选项
export interface VoiceParamOption {
	id: string;
	label: string;
	labelEn?: string;
	// MiniMax 官方映射
	minimaxEmotion?: string | null;
	minimaxPitch?: number;
	minimaxSpeed?: number;
	// MiniMax voice_modify 声音效果器（更精细的音色控制）
	minimaxVoiceModify?: VoiceModifySettings;
	// MiMo 兼容性
	mimoCompatible: boolean;
	mimoStyleTag: boolean;
	// 互斥组
	mutexGroup?: string;
	// 描述提示
	description?: string;
}

// 参数分组配置
export interface ParamGroupConfig {
	category: ParamCategory;
	label: string;
	labelEn: string;
	icon: string;
	// 选择模式: single | multiple
	selectionMode: "single" | "multiple";
	// 是否支持按 provider 过滤
	providerFilter?: TtsProvider[];
	// 该分组在哪些 modelMode 下显示
	visibleInModes?: ("preset" | "design" | "clone")[];
}

// ==================== 互斥组定义 ====================
// 同一互斥组内的选项只能选一个
export const MUTEX_GROUPS = {
	emotion: "emotion", // 基础情绪互斥
	dialect: "dialect", // 方言互斥
	character: "character", // 人设腔调互斥
	speed: "speed", // 语速互斥
	expression: "expression", // 哭笑表达互斥（笑/哭矛盾）
	state: "state", // 情绪状态互斥
} as const;

// ==================== 参数选项定义 ====================

export const PARAM_OPTIONS: Record<ParamCategory, VoiceParamOption[]> = {
	preset: [], // 快捷预设在下面单独定义

	basicEmotion: [
		{
			id: "happy",
			label: "开心",
			minimaxEmotion: "happy",
			minimaxPitch: 2,
			minimaxSpeed: 1.05,
			minimaxVoiceModify: { pitch: 18 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.emotion,
		},
		{
			id: "sad",
			label: "悲伤",
			minimaxEmotion: "sad",
			minimaxPitch: -2,
			minimaxSpeed: 0.85,
			minimaxVoiceModify: { intensity: 20 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.emotion,
		},
		{
			id: "angry",
			label: "愤怒",
			minimaxEmotion: "angry",
			minimaxPitch: 2,
			minimaxSpeed: 1.1,
			minimaxVoiceModify: { intensity: -20 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.emotion,
		},
		{
			id: "fearful",
			label: "恐惧",
			minimaxEmotion: "fearful",
			minimaxPitch: 2,
			minimaxSpeed: 1.05,
			minimaxVoiceModify: { intensity: 18 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.emotion,
		},
		{
			id: "surprised",
			label: "惊讶",
			minimaxEmotion: "surprised",
			minimaxPitch: 3,
			minimaxSpeed: 1.1,
			minimaxVoiceModify: { pitch: 20 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.emotion,
		},
		{
			id: "calm",
			label: "平静",
			minimaxEmotion: "calm",
			minimaxPitch: 0,
			minimaxSpeed: 1.0,
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.emotion,
		},
		{
			id: "excited",
			label: "兴奋",
			minimaxEmotion: "happy",
			minimaxPitch: 3,
			minimaxSpeed: 1.15,
			minimaxVoiceModify: { pitch: 20, intensity: -5 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.emotion,
		},
		{
			id: "grievance",
			label: "委屈",
			minimaxEmotion: "sad",
			minimaxPitch: -1,
			minimaxSpeed: 0.9,
			minimaxVoiceModify: { intensity: 18, pitch: 5 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.emotion,
		},
		{
			id: "indifferent",
			label: "冷漠",
			minimaxEmotion: "calm",
			minimaxPitch: -2,
			minimaxSpeed: 0.95,
			minimaxVoiceModify: { intensity: -18 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.emotion,
		},
		{
			id: "lost",
			label: "怅然",
			minimaxEmotion: "sad",
			minimaxPitch: -2,
			minimaxSpeed: 0.9,
			minimaxVoiceModify: { intensity: 18 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.emotion,
		},
		{
			id: "helpless",
			label: "无奈",
			minimaxEmotion: "sad",
			minimaxPitch: -2,
			minimaxSpeed: 0.9,
			minimaxVoiceModify: { intensity: 18 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.emotion,
		},
		{
			id: "anxious",
			label: "忐忑",
			minimaxEmotion: "fearful",
			minimaxPitch: 2,
			minimaxSpeed: 1.05,
			minimaxVoiceModify: { pitch: 12, intensity: 8 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.emotion,
		},
		{
			id: "moved",
			label: "动情",
			minimaxEmotion: "happy",
			minimaxPitch: 1,
			minimaxSpeed: 0.9,
			minimaxVoiceModify: { intensity: 20 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.emotion,
		},
		{
			id: "relieved",
			label: "释然",
			minimaxEmotion: "calm",
			minimaxPitch: 0,
			minimaxSpeed: 0.95,
			minimaxVoiceModify: { intensity: 15 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.emotion,
		},
	],

	tone: [
		{
			id: "gentle",
			label: "温柔",
			minimaxEmotion: null,
			minimaxPitch: -1,
			minimaxSpeed: 0.95,
			minimaxVoiceModify: { intensity: 20 },
			mimoCompatible: true,
			mimoStyleTag: true,
		},
		{
			id: "lively",
			label: "活泼",
			minimaxEmotion: "happy",
			minimaxPitch: 2,
			minimaxSpeed: 1.1,
			minimaxVoiceModify: { pitch: 18 },
			mimoCompatible: true,
			mimoStyleTag: true,
		},
		{
			id: "serious",
			label: "严肃",
			minimaxEmotion: "calm",
			minimaxPitch: 0,
			minimaxSpeed: 0.95,
			minimaxVoiceModify: { intensity: -18 },
			mimoCompatible: true,
			mimoStyleTag: true,
		},
		{
			id: "lazy",
			label: "慵懒",
			minimaxEmotion: null,
			minimaxPitch: -1,
			minimaxSpeed: 0.8,
			minimaxVoiceModify: { intensity: 20 },
			mimoCompatible: true,
			mimoStyleTag: true,
		},
		{
			id: "playful",
			label: "俏皮",
			minimaxEmotion: "happy",
			minimaxPitch: 2,
			minimaxSpeed: 1.1,
			minimaxVoiceModify: { pitch: 15, intensity: -5 },
			mimoCompatible: true,
			mimoStyleTag: true,
		},
		{
			id: "deep",
			label: "深沉",
			minimaxEmotion: null,
			minimaxPitch: -3,
			minimaxSpeed: 0.85,
			minimaxVoiceModify: { pitch: -20 },
			mimoCompatible: true,
			mimoStyleTag: true,
		},
		{
			id: "capable",
			label: "干练",
			minimaxEmotion: null,
			minimaxPitch: 0,
			minimaxSpeed: 1.05,
			minimaxVoiceModify: { intensity: -15 },
			mimoCompatible: true,
			mimoStyleTag: true,
		},
		{
			id: "sharp",
			label: "凌厉",
			minimaxEmotion: null,
			minimaxPitch: 2,
			minimaxSpeed: 1.1,
			minimaxVoiceModify: { intensity: -20 },
			mimoCompatible: true,
			mimoStyleTag: true,
		},
	],

	voiceType: [
		{
			id: "magnetic",
			label: "磁性",
			minimaxEmotion: null,
			minimaxPitch: -2,
			minimaxSpeed: 0.9,
			minimaxVoiceModify: { timbre: -22 },
			mimoCompatible: true,
			mimoStyleTag: true,
		},
		{
			id: "mellow",
			label: "醇厚",
			minimaxEmotion: null,
			minimaxPitch: -3,
			minimaxSpeed: 0.85,
			minimaxVoiceModify: { timbre: -25 },
			mimoCompatible: true,
			mimoStyleTag: true,
		},
		{
			id: "clear",
			label: "清亮",
			minimaxEmotion: null,
			minimaxPitch: 2,
			minimaxSpeed: 1.05,
			minimaxVoiceModify: { timbre: 22 },
			mimoCompatible: true,
			mimoStyleTag: true,
		},
		{
			id: "ethereal",
			label: "空灵",
			minimaxEmotion: null,
			minimaxPitch: 3,
			minimaxSpeed: 1.0,
			minimaxVoiceModify: { timbre: 25 },
			mimoCompatible: true,
			mimoStyleTag: true,
		},
		{
			id: "sweet",
			label: "甜美",
			minimaxEmotion: null,
			minimaxPitch: 2,
			minimaxSpeed: 1.05,
			minimaxVoiceModify: { timbre: 18, intensity: 8 },
			mimoCompatible: true,
			mimoStyleTag: true,
		},
		{
			id: "hoarse",
			label: "沙哑",
			minimaxEmotion: null,
			minimaxPitch: -3,
			minimaxSpeed: 0.9,
			minimaxVoiceModify: { timbre: -22 },
			mimoCompatible: true,
			mimoStyleTag: true,
		},
		{
			id: "childish",
			label: "稚嫩",
			minimaxEmotion: null,
			minimaxPitch: 3,
			minimaxSpeed: 1.1,
			minimaxVoiceModify: { timbre: 20 },
			mimoCompatible: true,
			mimoStyleTag: true,
		},
		{
			id: "aged",
			label: "苍老",
			minimaxEmotion: null,
			minimaxPitch: -4,
			minimaxSpeed: 0.8,
			minimaxVoiceModify: { timbre: -22 },
			mimoCompatible: true,
			mimoStyleTag: true,
		},
	],

	dialect: [
		{
			id: "northeast",
			label: "东北话",
			minimaxEmotion: null,
			minimaxPitch: 0,
			minimaxSpeed: 1.1,
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.dialect,
		},
		{
			id: "sichuan",
			label: "四川话",
			minimaxEmotion: null,
			minimaxPitch: 0,
			minimaxSpeed: 1.05,
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.dialect,
		},
		{
			id: "henan",
			label: "河南话",
			minimaxEmotion: null,
			minimaxPitch: 0,
			minimaxSpeed: 1.0,
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.dialect,
		},
		{
			id: "cantonese",
			label: "粤语",
			minimaxEmotion: null,
			minimaxPitch: 0,
			minimaxSpeed: 1.0,
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.dialect,
		},
	],

	rhythm: [
		{
			id: "sigh",
			label: "叹气",
			minimaxEmotion: "sad",
			minimaxPitch: -2,
			minimaxSpeed: 0.9,
			minimaxVoiceModify: { intensity: 12 },
			mimoCompatible: true,
			mimoStyleTag: true,
		},
		{
			id: "gasp",
			label: "喘息",
			minimaxEmotion: null,
			minimaxPitch: 0,
			minimaxSpeed: 0.9,
			minimaxVoiceModify: { intensity: 10, pitch: 3 },
			mimoCompatible: true,
			mimoStyleTag: false,
		},
		{
			id: "deep_breath",
			label: "深呼吸",
			minimaxEmotion: null,
			minimaxPitch: 0,
			minimaxSpeed: 0.9,
			minimaxVoiceModify: { intensity: 8, pitch: -2 },
			mimoCompatible: true,
			mimoStyleTag: false,
		},
		{
			id: "inhale",
			label: "吸气",
			minimaxEmotion: null,
			minimaxPitch: 0,
			minimaxSpeed: 0.9,
			minimaxVoiceModify: { intensity: 5, pitch: 2 },
			mimoCompatible: true,
			mimoStyleTag: true,
		},
		{
			id: "hold_breath",
			label: "屏息",
			minimaxEmotion: "whisper",
			minimaxPitch: 0,
			minimaxSpeed: 0.7,
			minimaxVoiceModify: { intensity: 18, pitch: -3 },
			mimoCompatible: true,
			mimoStyleTag: true,
		},
	],

	state: [
		{
			id: "nervous",
			label: "紧张",
			minimaxEmotion: "fearful",
			minimaxPitch: 2,
			minimaxSpeed: 1.1,
			minimaxVoiceModify: { pitch: 15 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.state,
		},
		{
			id: "scared",
			label: "害怕",
			minimaxEmotion: "fearful",
			minimaxPitch: 3,
			minimaxSpeed: 1.1,
			minimaxVoiceModify: { intensity: 18 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.state,
		},
		{
			id: "excited_state",
			label: "激动",
			minimaxEmotion: "happy",
			minimaxPitch: 3,
			minimaxSpeed: 1.15,
			minimaxVoiceModify: { pitch: 20, intensity: -5 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.state,
		},
		{
			id: "tired",
			label: "疲惫",
			minimaxEmotion: null,
			minimaxPitch: -3,
			minimaxSpeed: 0.75,
			minimaxVoiceModify: { intensity: 20 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.state,
		},
		{
			id: "coquettish",
			label: "撒娇",
			minimaxEmotion: "happy",
			minimaxPitch: 3,
			minimaxSpeed: 1.1,
			minimaxVoiceModify: { intensity: 20, pitch: 5 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.state,
		},
		{
			id: "shocked",
			label: "震惊",
			minimaxEmotion: "surprised",
			minimaxPitch: 5,
			minimaxSpeed: 1.2,
			minimaxVoiceModify: { pitch: 20 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.state,
		},
		{
			id: "guilty",
			label: "心虚",
			minimaxEmotion: "fearful",
			minimaxPitch: 1,
			minimaxSpeed: 1.0,
			minimaxVoiceModify: { intensity: 18 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.state,
		},
		{
			id: "impatient",
			label: "不耐烦",
			minimaxEmotion: "angry",
			minimaxPitch: 2,
			minimaxSpeed: 1.15,
			minimaxVoiceModify: { intensity: -18 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.state,
		},
	],

	feature: [
		{
			id: "whisper",
			label: "悄悄话",
			minimaxEmotion: "whisper",
			minimaxPitch: 0,
			minimaxSpeed: 0.8,
			minimaxVoiceModify: { intensity: 18, pitch: -3 },
			mimoCompatible: true,
			mimoStyleTag: true,
		},
		{
			id: "breathy",
			label: "气声",
			minimaxEmotion: "whisper",
			minimaxPitch: 0,
			minimaxSpeed: 0.9,
			minimaxVoiceModify: { intensity: 15 },
			mimoCompatible: true,
			mimoStyleTag: true,
		},
		{
			id: "trembling",
			label: "颤抖",
			minimaxEmotion: "fearful",
			minimaxPitch: 2,
			minimaxSpeed: 1.1,
			minimaxVoiceModify: { pitch: 12 },
			mimoCompatible: true,
			mimoStyleTag: true,
		},
		{
			id: "nasal",
			label: "鼻音",
			minimaxEmotion: null,
			minimaxPitch: -1,
			minimaxSpeed: 0.95,
			minimaxVoiceModify: { timbre: 10 },
			mimoCompatible: true,
			mimoStyleTag: true,
		},
		{
			id: "crack",
			label: "破音",
			minimaxEmotion: null,
			minimaxPitch: 5,
			minimaxSpeed: 1.25,
			minimaxVoiceModify: { pitch: 22 },
			mimoCompatible: true,
			mimoStyleTag: false,
		},
	],

	expression: [
		{
			id: "laugh",
			label: "笑",
			minimaxEmotion: "happy",
			minimaxPitch: 1,
			minimaxSpeed: 1.05,
			minimaxVoiceModify: { intensity: 15 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.expression,
		},
		{
			id: "chuckle",
			label: "轻笑",
			minimaxEmotion: "happy",
			minimaxPitch: 1,
			minimaxSpeed: 1.0,
			minimaxVoiceModify: { intensity: 12 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.expression,
		},
		{
			id: "laugh_loud",
			label: "大笑",
			minimaxEmotion: "happy",
			minimaxPitch: 3,
			minimaxSpeed: 1.15,
			minimaxVoiceModify: { pitch: 15 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.expression,
		},
		{
			id: "sneer",
			label: "冷笑",
			minimaxEmotion: "angry",
			minimaxPitch: -1,
			minimaxSpeed: 0.95,
			minimaxVoiceModify: { intensity: -18 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.expression,
		},
		{
			id: "sob",
			label: "抽泣",
			minimaxEmotion: "sad",
			minimaxPitch: -2,
			minimaxSpeed: 0.85,
			minimaxVoiceModify: { intensity: 18 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.expression,
		},
		{
			id: "whimper",
			label: "呜咽",
			minimaxEmotion: null,
			minimaxPitch: -3,
			minimaxSpeed: 0.8,
			minimaxVoiceModify: { intensity: 20 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.expression,
		},
		{
			id: "choke",
			label: "哽咽",
			minimaxEmotion: "sad",
			minimaxPitch: -2,
			minimaxSpeed: 0.85,
			minimaxVoiceModify: { intensity: 18 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.expression,
		},
		{
			id: "wail",
			label: "嚎啕大哭",
			minimaxEmotion: "sad",
			minimaxPitch: -4,
			minimaxSpeed: 0.75,
			minimaxVoiceModify: { intensity: 25 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.expression,
		},
	],

	character: [
		{
			id: "jiaziyin",
			label: "夹子音",
			minimaxEmotion: null,
			minimaxPitch: 4,
			minimaxSpeed: 1.1,
			minimaxVoiceModify: { pitch: 20 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.character,
		},
		{
			id: "yujie",
			label: "御姐音",
			minimaxEmotion: null,
			minimaxPitch: -2,
			minimaxSpeed: 0.9,
			minimaxVoiceModify: { timbre: -20 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.character,
		},
		{
			id: "zhengta",
			label: "正太音",
			minimaxEmotion: null,
			minimaxPitch: 3,
			minimaxSpeed: 1.05,
			minimaxVoiceModify: { pitch: 18 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.character,
		},
		{
			id: "dashu",
			label: "大叔音",
			minimaxEmotion: null,
			minimaxPitch: -4,
			minimaxSpeed: 0.85,
			minimaxVoiceModify: { timbre: -25 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.character,
		},
		{
			id: "taiwan",
			label: "台湾腔",
			minimaxEmotion: null,
			minimaxPitch: 1,
			minimaxSpeed: 1.05,
			minimaxVoiceModify: { intensity: 12 },
			mimoCompatible: true,
			mimoStyleTag: true,
			mutexGroup: MUTEX_GROUPS.character,
		},
	],

	speed: [
		{
			id: "very_slow",
			label: "极慢",
			minimaxEmotion: null,
			minimaxPitch: 0,
			minimaxSpeed: 0.5,
			mimoCompatible: true,
			mimoStyleTag: false,
			mutexGroup: MUTEX_GROUPS.speed,
		},
		{
			id: "slow",
			label: "慢速",
			minimaxEmotion: null,
			minimaxPitch: 0,
			minimaxSpeed: 0.75,
			mimoCompatible: true,
			mimoStyleTag: false,
			mutexGroup: MUTEX_GROUPS.speed,
		},
		{
			id: "normal",
			label: "正常",
			minimaxEmotion: null,
			minimaxPitch: 0,
			minimaxSpeed: 1.0,
			mimoCompatible: true,
			mimoStyleTag: false,
			mutexGroup: MUTEX_GROUPS.speed,
		},
		{
			id: "fast",
			label: "快速",
			minimaxEmotion: null,
			minimaxPitch: 0,
			minimaxSpeed: 1.3,
			mimoCompatible: true,
			mimoStyleTag: false,
			mutexGroup: MUTEX_GROUPS.speed,
		},
		{
			id: "very_fast",
			label: "极快",
			minimaxEmotion: null,
			minimaxPitch: 0,
			minimaxSpeed: 1.6,
			mimoCompatible: true,
			mimoStyleTag: false,
			mutexGroup: MUTEX_GROUPS.speed,
		},
	],
};

// ==================== 快捷预设 ====================
export interface QuickPreset {
	id: string;
	label: string;
	labelEn: string;
	description: string;
	descriptionEn: string;
	icon: string;
	// 预设选中的参数
	params: Partial<Record<ParamCategory, string[]>>;
	// 预设摘要，用于在 UI 中快速解释风格走向
	summary?: string[];
	// 预设的音色描述（design 模式用）
	designPrompt?: string;
	designPromptEn?: string;
	// 预设的 stylePrompt
	stylePrompt?: string;
	stylePromptEn?: string;
	// 推荐 provider
	recommendedProvider?: TtsProvider;
	// MiniMax 专用参数覆盖（绕过标签聚合，直接指定 API 参数）
	minimaxOverrides?: {
		emotion?: string | null;
		pitch?: number;
		speed?: number;
		voiceModify?: VoiceModifySettings;
	};
}

export const QUICK_PRESETS: QuickPreset[] = [
	{
		id: "sad_monologue",
		label: "悲伤独白",
		labelEn: "Sad Monologue",
		description: "低沉缓慢的悲伤语调，适合独白场景",
		descriptionEn: "Slow, melancholic tone for monologues",
		icon: "CloudRain",
		params: { basicEmotion: ["sad"], tone: ["deep"] },
		summary: ["悲伤", "深沉"],
		stylePrompt:
			"用极度悲伤的语气，声音低沉颤抖，带着哽咽和抽泣，语速缓慢，每句话之间有停顿，像是在自言自语地诉说内心痛苦",
		stylePromptEn:
			"Use an extremely sad tone, voice low and trembling with sobs and sniffles, slow pace with pauses between sentences, as if muttering about inner pain",
		designPrompt: "悲伤的独白语调，低沉而缓慢，声音带着哽咽和呜咽感，适合内心独白或情感叙述",
		designPromptEn:
			"A slow, melancholic monologue voice, low and deep with a choked, whimpering quality, ideal for inner monologues and emotional narration",
		minimaxOverrides: {
			emotion: "sad",
			pitch: -4,
			speed: 0.7,
			voiceModify: { pitch: -25, intensity: 25 },
		},
	},
	{
		id: "energetic_blogger",
		label: "元气博主",
		labelEn: "Energetic Blogger",
		description: "活泼明快的语调，适合短视频配音",
		descriptionEn: "Bright and energetic for short videos",
		icon: "Sun",
		params: { basicEmotion: ["excited"], voiceType: ["clear"] },
		summary: ["兴奋", "清亮"],
		stylePrompt:
			"用超级活泼的语气，声音明亮清脆，语速偏快，语调起伏大，充满感染力和热情，像在和好朋友分享开心的事",
		stylePromptEn:
			"Use a super lively tone, voice bright and crisp, slightly fast pace with big intonation swings, full of enthusiasm as if sharing happy news with a friend",
		designPrompt: "元气满满的主播风格，声线清亮活泼，语调欢快有感染力，适合短视频和直播配音",
		designPromptEn:
			"An energetic presenter style with a bright, lively voice and cheerful, engaging intonation, perfect for short videos and livestream narration",
		minimaxOverrides: {
			emotion: "happy",
			pitch: 4,
			speed: 1.3,
			voiceModify: { pitch: 20, intensity: -10 },
		},
	},
	{
		id: "science_explain",
		label: "科普解说",
		labelEn: "Science Explain",
		description: "清晰干练的语调，适合知识讲解",
		descriptionEn: "Clear and professional for explanations",
		icon: "BookOpen",
		params: { basicEmotion: ["calm"], tone: ["capable"], voiceType: ["clear"] },
		summary: ["平静", "干练", "清亮"],
		stylePrompt:
			"用沉稳专业的语气，声音清晰有力，语速适中偏慢，语调平稳，重点词汇适当加重，像纪录片解说员在讲解科学知识",
		stylePromptEn:
			"Use a steady professional tone, voice clear and powerful, medium-to-slow pace with stable intonation, emphasizing key words like a documentary narrator explaining science",
		designPrompt: "专业的科普解说风格，声音清晰干练，语调平稳有条理，适合知识类内容讲解",
		designPromptEn:
			"A professional science explainer voice, clear and capable with a steady, well-structured tone, ideal for educational and knowledge-based content",
		minimaxOverrides: {
			emotion: "calm",
			pitch: 0,
			speed: 0.9,
			voiceModify: { intensity: -15, timbre: 15 },
		},
	},
	{
		id: "podcast_live",
		label: "播客现场",
		labelEn: "Podcast Live",
		description: "自然慵懒的电台感，适合播客录制",
		descriptionEn: "Natural radio-like tone for podcasts",
		icon: "Radio",
		params: { basicEmotion: ["calm"], tone: ["lazy"], voiceType: ["magnetic"] },
		summary: ["平静", "慵懒", "磁性"],
		stylePrompt:
			"用轻松自然的语气，声音慵懒有磁性，语速适中，像深夜电台主持人在和听众聊天，偶尔有停顿和思考的感觉",
		stylePromptEn:
			"Use a relaxed natural tone, voice lazy and magnetic, medium pace like a late-night radio host chatting with listeners, with occasional pauses and thoughtful moments",
		designPrompt: "播客主持人的自然语调，声音磁性而有质感，慵懒从容，适合播客和电台节目",
		designPromptEn:
			"A natural podcast host voice, magnetic and textured with a relaxed, easygoing delivery, perfect for podcasts and radio shows",
		minimaxOverrides: {
			emotion: "calm",
			pitch: -1,
			speed: 0.85,
			voiceModify: { intensity: 18, timbre: -15 },
		},
	},
	{
		id: "movie_dialogue",
		label: "影视对白",
		labelEn: "Movie Dialogue",
		description: "富有戏剧张力的对白演绎",
		descriptionEn: "Dramatic dialogue delivery",
		icon: "Film",
		params: {
			basicEmotion: ["moved"],
			tone: ["deep"],
			voiceType: ["magnetic"],
			state: ["nervous"],
		},
		summary: ["动情", "深沉", "磁性", "紧张"],
		stylePrompt:
			"用富有戏剧张力的语气，声音深沉有力，语速随情节变化，时而低沉缓慢时而激动加快，像在演绎一段精彩的影视台词",
		stylePromptEn:
			"Use a dramatically tense tone, voice deep and powerful, pace varying with the plot—sometimes slow and low, sometimes excited and fast—as if performing a cinematic monologue",
		designPrompt: "影视剧式的对白演绎，声音富有张力和戏剧感，适合台词朗读和影视配音",
		designPromptEn:
			"A cinematic dialogue delivery voice, rich in tension and dramatic presence, ideal for line readings and film dubbing",
		minimaxOverrides: {
			emotion: "surprised",
			pitch: -2,
			speed: 0.95,
			voiceModify: { pitch: -15, intensity: 20, timbre: -20 },
		},
	},
	{
		id: "funny_meme",
		label: "搞怪鬼畜",
		labelEn: "Funny Meme",
		description: "夸张俏皮的语调，适合搞笑配音",
		descriptionEn: "Exaggerated and playful for comedy",
		icon: "Laugh",
		params: {
			character: ["jiaziyin"],
			expression: ["laugh_loud"],
		},
		summary: ["夹子音", "大笑"],
		stylePrompt:
			"用极度夸张搞怪的语气，声音尖锐变形，语速忽快忽慢，语调大幅度起伏，像在表演一段搞笑的配音秀",
		stylePromptEn:
			"Use an extremely exaggerated comedic tone, voice sharp and distorted, pace alternating fast and slow with dramatic intonation swings, as if performing a funny voice-over show",
		designPrompt: "夸张搞怪的鬼畜风格，声线俏皮多变，适合搞笑配音和创意短视频",
		designPromptEn:
			"An exaggerated, comedic meme voice with playful and versatile vocal delivery, perfect for funny dubs and creative short videos",
		minimaxOverrides: {
			emotion: "happy",
			pitch: 6,
			speed: 1.4,
			voiceModify: { pitch: 30, intensity: -15 },
		},
	},
	{
		id: "documentary",
		label: "纪录片",
		labelEn: "Documentary",
		description: "沉稳厚重的纪录片旁白",
		descriptionEn: "Steady documentary narration",
		icon: "Video",
		params: { basicEmotion: ["calm"], tone: ["serious"], voiceType: ["mellow"] },
		summary: ["平静", "严肃", "醇厚"],
		stylePrompt:
			"用庄重沉稳的语气，声音浑厚有质感，语速缓慢均匀，语调平稳大气，像在解说一部宏大的自然纪录片",
		stylePromptEn:
			"Use a solemn and steady tone, voice rich and textured, slow and even pace with a grand, stable intonation, as if narrating a magnificent nature documentary",
		designPrompt: "纪录片风格的旁白，声音沉稳醇厚，语调庄重严肃，适合纪录片解说和叙事性内容",
		designPromptEn:
			"A documentary-style narration voice, steady and mellow with a solemn, serious tone, ideal for documentary commentary and narrative content",
		minimaxOverrides: {
			emotion: "calm",
			pitch: -3,
			speed: 0.8,
			voiceModify: { intensity: -20, timbre: -25 },
		},
	},
];

// ==================== 分组配置 ====================
export const PARAM_GROUPS: ParamGroupConfig[] = [
	{
		category: "preset",
		label: "快捷预设",
		labelEn: "Quick Presets",
		icon: "Zap",
		selectionMode: "single",
		visibleInModes: ["preset", "design", "clone"],
	},
	{
		category: "basicEmotion",
		label: "基础情绪",
		labelEn: "Basic Emotions",
		icon: "Smile",
		selectionMode: "single",
		visibleInModes: ["preset", "design", "clone"],
	},
	{
		category: "tone",
		label: "整体语调",
		labelEn: "Overall Tone",
		icon: "Music",
		selectionMode: "single",
		visibleInModes: ["preset", "design", "clone"],
	},
	{
		category: "voiceType",
		label: "音色定位",
		labelEn: "Voice Type",
		icon: "AudioWaveform",
		selectionMode: "single",
		visibleInModes: ["preset", "design", "clone"],
	},
	{
		category: "dialect",
		label: "方言",
		labelEn: "Dialect",
		icon: "Globe",
		selectionMode: "single",
		visibleInModes: ["preset", "design", "clone"],
	},
	{
		category: "rhythm",
		label: "语速节奏",
		labelEn: "Rhythm",
		icon: "Timer",
		selectionMode: "single",
		visibleInModes: ["preset", "design", "clone"],
	},
	{
		category: "state",
		label: "情绪状态",
		labelEn: "Emotional State",
		icon: "Heart",
		selectionMode: "single",
		visibleInModes: ["preset", "design", "clone"],
	},
	{
		category: "feature",
		label: "语音特征",
		labelEn: "Voice Features",
		icon: "Waves",
		selectionMode: "single",
		visibleInModes: ["preset", "design", "clone"],
	},
	{
		category: "expression",
		label: "哭笑表达",
		labelEn: "Expressions",
		icon: "Drama",
		selectionMode: "single",
		visibleInModes: ["preset", "design", "clone"],
	},
	{
		category: "character",
		label: "人设腔调",
		labelEn: "Character Voice",
		icon: "User",
		selectionMode: "single",
		visibleInModes: ["preset", "design", "clone"],
	},
	{
		category: "speed",
		label: "语速",
		labelEn: "Speed",
		icon: "Gauge",
		selectionMode: "single",
		visibleInModes: ["preset", "design", "clone"],
	},
];

// ==================== 工具函数 ====================

/**
 * 根据 provider 过滤参数选项
 * - MiMo：只显示 mimoCompatible 且 mimoStyleTag 的标签
 * - MiniMax：隐藏整个方言分类（通过语言增强 Language Boost 支持粤语）
 */
export function filterParamsByProvider(
	options: VoiceParamOption[],
	provider: TtsProvider,
	category?: ParamCategory,
): VoiceParamOption[] {
	if (provider === "mimo") {
		return options.filter((opt) => opt.mimoCompatible && opt.mimoStyleTag);
	}
	// MiniMax：隐藏整个方言分类（粤语通过语言增强支持）
	if (category === "dialect") {
		return [];
	}
	// MiniMax 端：隐藏 emotion=whisper 标签（speech-2.8-hd 不支持，用户点了收不到效果）
	// 该标签对 MiMo 端依然可见可用
	return options.filter((opt) => {
		if (opt.minimaxEmotion === "whisper") return false;
		if (opt.minimaxEmotion) return true;
		if (opt.minimaxPitch && opt.minimaxPitch !== 0) return true;
		if (opt.minimaxSpeed && opt.minimaxSpeed !== 1.0) return true;
		return false;
	});
}

/**
 * 获取参数选项的映射（用于查找）
 */
export function getParamOptionById(
	category: ParamCategory,
	id: string,
): VoiceParamOption | undefined {
	return PARAM_OPTIONS[category]?.find((opt) => opt.id === id);
}

/**
 * 获取某个参数的 minimaxEmotion 值
 */
export function getParamEmotion(paramId: string): string | null {
	for (const category of Object.keys(PARAM_OPTIONS) as ParamCategory[]) {
		const opt = PARAM_OPTIONS[category]?.find((o) => o.id === paramId);
		if (opt?.minimaxEmotion) return opt.minimaxEmotion;
	}
	return null;
}

/**
 * 查找与 newParamId 有 emotion 冲突的现有参数
 * MiniMax 只能接受一个 emotion，不同 emotion 值互斥
 * 相同 emotion 值兼容（一起叠加 pitch/speed）
 */
export function findConflictingEmotionParams(existingIds: string[], newParamId: string): string[] {
	const newEmotion = getParamEmotion(newParamId);
	if (!newEmotion) return [];

	return existingIds.filter((id) => {
		const existingEmotion = getParamEmotion(id);
		return existingEmotion !== null && existingEmotion !== newEmotion;
	});
}

/**
 * 构建 MiniMax 参数（从选中的参数ID列表）
 * 最后出现的 emotion 胜出（匹配用户最后点击的意图）
 * voice_modify 参数采用加权叠加（pitch/intensity/timbre 均为 [-100,100] 范围）
 */
export function buildMinimaxParams(selectedIds: string[]): {
	emotion: string | null;
	pitch: number;
	speed: number;
	voiceModify: VoiceModifySettings;
} {
	let emotion: string | null = null;
	let pitch = 0;
	let speed = 1.0;
	let vmPitch = 0;
	let vmIntensity = 0;
	let vmTimbre = 0;
	let soundEffects: VoiceModifySettings["sound_effects"] | undefined;

	for (const id of selectedIds) {
		for (const category of Object.keys(PARAM_OPTIONS) as ParamCategory[]) {
			const opt = PARAM_OPTIONS[category]?.find((o) => o.id === id);
			if (!opt) continue;

			if (opt.minimaxEmotion) {
				emotion = opt.minimaxEmotion;
			}
			pitch += opt.minimaxPitch ?? 0;
			if (opt.minimaxSpeed) {
				speed *= opt.minimaxSpeed;
			}
			// 聚合 voice_modify 参数
			if (opt.minimaxVoiceModify) {
				vmPitch += opt.minimaxVoiceModify.pitch ?? 0;
				vmIntensity += opt.minimaxVoiceModify.intensity ?? 0;
				vmTimbre += opt.minimaxVoiceModify.timbre ?? 0;
				if (opt.minimaxVoiceModify.sound_effects) {
					soundEffects = opt.minimaxVoiceModify.sound_effects;
				}
			}
		}
	}

	const voiceModify: VoiceModifySettings = {
		pitch: Math.max(-100, Math.min(100, Math.round(vmPitch))),
		intensity: Math.max(-100, Math.min(100, Math.round(vmIntensity))),
		timbre: Math.max(-100, Math.min(100, Math.round(vmTimbre))),
	};
	if (soundEffects) {
		voiceModify.sound_effects = soundEffects;
	}

	return {
		emotion,
		pitch: Math.max(-12, Math.min(12, Math.round(pitch))),
		speed: Math.max(0.5, Math.min(2.0, speed)),
		voiceModify,
	};
}

/**
 * 构建 MiMo 风格标签（只包含 mimoStyleTag: true 的）
 */
export function buildMimoTags(selectedIds: string[]): string[] {
	const tags: string[] = [];
	for (const id of selectedIds) {
		for (const category of Object.keys(PARAM_OPTIONS) as ParamCategory[]) {
			const opt = PARAM_OPTIONS[category]?.find((o) => o.id === id);
			if (opt?.mimoCompatible && opt.mimoStyleTag) {
				tags.push(opt.label);
			}
		}
	}
	return tags;
}

export const LABEL_EN_MAP: Record<string, string> = {
	开心: "Happy",
	悲伤: "Sad",
	愤怒: "Angry",
	恐惧: "Fearful",
	惊讶: "Surprised",
	平静: "Calm",
	兴奋: "Excited",
	委屈: "Grievance",
	冷漠: "Indifferent",
	怅然: "Lost",
	无奈: "Helpless",
	忐忑: "Anxious",
	动情: "Moved",
	释然: "Relieved",
	温柔: "Gentle",
	活泼: "Lively",
	严肃: "Serious",
	慵懒: "Lazy",
	俏皮: "Playful",
	深沉: "Deep",
	干练: "Capable",
	凌厉: "Sharp",
	磁性: "Magnetic",
	醇厚: "Mellow",
	清亮: "Clear",
	空灵: "Ethereal",
	甜美: "Sweet",
	沙哑: "Hoarse",
	稚嫩: "Young",
	苍老: "Aged",
	东北话: "Northeastern",
	四川话: "Sichuan",
	河南话: "Henan",
	粤语: "Cantonese",
	叹气: "Sigh",
	紧张: "Nervous",
	害怕: "Scared",
	激动: "Excited",
	疲惫: "Tired",
	撒娇: "Coquettish",
	震惊: "Shocked",
	心虚: "Guilty",
	不耐烦: "Impatient",
	悄悄话: "Whisper",
	气声: "Breathy",
	颤抖: "Trembling",
	鼻音: "Nasal",
	笑: "Laugh",
	轻笑: "Chuckle",
	大笑: "Laugh Loudly",
	冷笑: "Sneer",
	抽泣: "Sob",
	呜咽: "Whimper",
	哽咽: "Choke Up",
	嚎啕大哭: "Wail",
	夹子音: "Cute Voice",
	御姐音: "Mature Voice",
	正太音: "Boyish Voice",
	大叔音: "Deep Voice",
	台湾腔: "Taiwanese Accent",
};

/**
 * 构建 stylePrompt（从选中的参数ID列表）
 */
export function buildStylePrompt(selectedIds: string[], locale?: string): string {
	const parts: string[] = [];
	for (const id of selectedIds) {
		for (const category of Object.keys(PARAM_OPTIONS) as ParamCategory[]) {
			if (category === "dialect") continue;
			const opt = PARAM_OPTIONS[category]?.find((o) => o.id === id);
			if (opt?.mimoStyleTag) {
				const enLabel = LABEL_EN_MAP[opt.label];
				parts.push(locale === "en" && enLabel ? enLabel : opt.label);
			}
		}
	}
	return parts.join(locale === "en" ? ", " : "，");
}

/**
 * 构建完整标签列表（用于后端参数映射）
 */
export function buildTagLabels(selectedIds: string[]): string[] {
	const parts: string[] = [];
	for (const id of selectedIds) {
		for (const category of Object.keys(PARAM_OPTIONS) as ParamCategory[]) {
			const opt = PARAM_OPTIONS[category]?.find((o) => o.id === id);
			if (opt) {
				parts.push(opt.label);
			}
		}
	}
	return parts;
}

/**
 * 检查两个参数是否互斥
 */
export function areParamsMutex(id1: string, id2: string): boolean {
	let group1: string | undefined;
	let group2: string | undefined;

	for (const category of Object.keys(PARAM_OPTIONS) as ParamCategory[]) {
		const opt1 = PARAM_OPTIONS[category]?.find((o) => o.id === id1);
		if (opt1?.mutexGroup) group1 = opt1.mutexGroup;

		const opt2 = PARAM_OPTIONS[category]?.find((o) => o.id === id2);
		if (opt2?.mutexGroup) group2 = opt2.mutexGroup;
	}

	return !!group1 && group1 === group2;
}

/**
 * 获取某个参数所属的分组
 */
export function getParamCategory(id: string): ParamCategory | null {
	for (const category of Object.keys(PARAM_OPTIONS) as ParamCategory[]) {
		if (PARAM_OPTIONS[category]?.some((o) => o.id === id)) {
			return category;
		}
	}
	return null;
}
