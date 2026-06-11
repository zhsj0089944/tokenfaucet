import { eq } from "drizzle-orm";
import { systemConfigs } from "@/drizzle/schemas";
import type { Context } from "@/server/server";

/**
 * TTS配置键
 */
export const TTS_CONFIG_KEYS = {
	PROVIDER: "tts.provider",
	// MiniMax (当前默认)
	MINIMAX_ENDPOINT: "tts.apiEndpoint",
	MINIMAX_API_KEY: "tts.apiKey",
	MINIMAX_MODEL: "tts.model",
	MINIMAX_MODEL_DESIGN: "tts.model.design",
	MINIMAX_MODEL_CLONE: "tts.model.clone",
	MINIMAX_DEFAULT_VOICE: "tts.defaultVoice",
	MINIMAX_LANGUAGE_BOOST: "tts.languageBoost",
	// MiMo
	MIMO_ENDPOINT: "tts.mimo.endpoint",
	MIMO_API_KEY: "tts.mimo.apiKey",
	MIMO_MODEL_PRESET: "tts.mimo.model.preset",
	MIMO_MODEL_DESIGN: "tts.mimo.model.design",
	MIMO_MODEL_CLONE: "tts.mimo.model.clone",
	MIMO_DEFAULT_VOICE: "tts.mimo.defaultVoice",
	// 字符限制
	MINIMAX_MAX_CHARS: "tts.minimax.maxChars",
	MIMO_MAX_CHARS: "tts.mimo.maxChars",
} as const;

// MiniMax 音色列表（官方系统音色）
export const MINIMAX_VOICES = [
	// 中文 - 男声
	{ id: "male-qn-qingse", name: "青涩青年", lang: "中文", gender: "男" },
	{ id: "male-qn-jingying", name: "精英青年", lang: "中文", gender: "男" },
	{ id: "male-qn-badao", name: "霸道青年", lang: "中文", gender: "男" },
	{ id: "male-qn-daxuesheng", name: "青年大学生", lang: "中文", gender: "男" },
	{ id: "presenter_male", name: "男性主持人", lang: "中文", gender: "男" },
	{ id: "audiobook_male_1", name: "有声书男声1", lang: "中文", gender: "男" },
	{ id: "audiobook_male_2", name: "有声书男声2", lang: "中文", gender: "男" },
	// 中文 - 女声
	{ id: "female-shaonv", name: "少女", lang: "中文", gender: "女" },
	{ id: "female-yujie", name: "御姐", lang: "中文", gender: "女" },
	{ id: "female-chengshu", name: "成熟女性", lang: "中文", gender: "女" },
	{ id: "female-tianmei", name: "甜美女性", lang: "中文", gender: "女" },
	{ id: "presenter_female", name: "女性主持人", lang: "中文", gender: "女" },
	{ id: "audiobook_female_1", name: "有声书女声1", lang: "中文", gender: "女" },
	{ id: "audiobook_female_2", name: "有声书女声2", lang: "中文", gender: "女" },
	// 中文 - 粤语
	{ id: "Cantonese_GentleLady", name: "粤语温柔女声", lang: "粤语", gender: "女" },
	{ id: "Cantonese_podacast_host_1", name: "粤语播客主持", lang: "粤语", gender: "男" },
	// 英文 - 女声
	{ id: "English_Graceful_Lady", name: "English Graceful Lady", lang: "英文", gender: "女" },
	{ id: "English_radiant_girl", name: "English Radiant Girl", lang: "英文", gender: "女" },
	{ id: "english_lady", name: "English Lady", lang: "英文", gender: "女" },
	// 英文 - 男声
	{
		id: "English_Insightful_Speaker",
		name: "English Insightful Speaker",
		lang: "英文",
		gender: "男",
	},
	{ id: "English_Persuasive_Man", name: "English Persuasive Man", lang: "英文", gender: "男" },
	{ id: "english_gentleman", name: "English Gentleman", lang: "英文", gender: "男" },
	// 英文 - 其他
	{ id: "English_Lucky_Robot", name: "English Lucky Robot", lang: "英文", gender: "其他" },
	// 日文
	{ id: "Japanese_Whisper_Belle", name: "Japanese Whisper Belle", lang: "日文", gender: "女" },
];

// MiMo 预置音色列表
export const MIMO_VOICES = [
	{ id: "冰糖", name: "冰糖", lang: "中文", gender: "女" },
	{ id: "茉莉", name: "茉莉", lang: "中文", gender: "女" },
	{ id: "苏打", name: "苏打", lang: "中文", gender: "男" },
	{ id: "白桦", name: "白桦", lang: "中文", gender: "男" },
	{ id: "Mia", name: "Mia", lang: "英文", gender: "女" },
	{ id: "Chloe", name: "Chloe", lang: "英文", gender: "女" },
	{ id: "Milo", name: "Milo", lang: "英文", gender: "男" },
	{ id: "Dean", name: "Dean", lang: "英文", gender: "男" },
];

// ==================== 标签到 MiniMax 官方参数的映射 ====================
// MiniMax 官方支持 emotion 参数: happy, sad, angry, fearful, disgusted, surprised, calm, fluent, whisper
// 同时支持 pitch (-12~12) 和 speed (0.5~2.0) 微调

export interface TagMapping {
	/** MiniMax 官方 emotion 参数值（null 表示不使用 emotion） */
	minimaxEmotion: string | null;
	/** MiniMax pitch 微调值（叠加到默认值 0 上） */
	minimaxPitch: number;
	/** MiniMax speed 微调系数（乘以默认值 1.0） */
	minimaxSpeed: number;
	/** MiniMax voice_modify 声音效果器（更精细的音色控制） */
	minimaxVoiceModify?: {
		pitch?: number;
		intensity?: number;
		timbre?: number;
		sound_effects?: "spacious_echo" | "auditorium_echo" | "lofi_telephone" | "robotic";
	};
	/** MiMo 原生支持的中文标签（直接传递即可） */
	mimoCompatible: boolean;
	/** 是否作为 MiMo 文本风格标签嵌入（有些标签只影响参数，不应该嵌入文本） */
	mimoStyleTag: boolean;
}

// 中文标签 → MiniMax/MiMo 参数映射
// 设计原则：每个标签只强控一个 voice_modify 主维度（±15-25），次维度为 0
// - timbre (-浑厚 ↔ +清脆): 磁性、醇厚、清亮、甜美、空灵、沙哑、稚嫩、苍老、御姐音、大叔音、深沉、鼻音
// - pitch (-低沉 ↔ +明亮): 开心、悲伤、惊讶、兴奋、活泼、俏皮、夹子音、正太音、震惊、激动、忐忑、大笑、颤抖、破音
// - intensity (-刚劲 ↔ +柔和): 温柔、严肃、慵懒、干练、凌厉、愤怒、恐惧、委屈、冷漠、疲惫、撒娇、心虚、不耐烦、笑、轻笑、冷笑、抽泣、呜咽、哽咽
// 设计原则：单标签 vm 主值 ±18-25（单选效果明显），预设组合避免同方向叠加
export const TAG_MAPPING: Record<string, TagMapping> = {
	// ==================== 基础情绪 ====================
	// pitch-primary: 开心(+18)、惊讶(+20)、兴奋(+20)、忐忑(+12)
	// intensity-primary: 悲伤(+20)、愤怒(-20)、恐惧(+18)、委屈(+18)、冷漠(-18)、怅然(+18)、无奈(+18)、动情(+20)、释然(+15)
	开心: {
		minimaxEmotion: "happy",
		minimaxPitch: 2,
		minimaxSpeed: 1.05,
		minimaxVoiceModify: { pitch: 18 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	悲伤: {
		minimaxEmotion: "sad",
		minimaxPitch: -2,
		minimaxSpeed: 0.85,
		minimaxVoiceModify: { intensity: 20 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	愤怒: {
		minimaxEmotion: "angry",
		minimaxPitch: 2,
		minimaxSpeed: 1.1,
		minimaxVoiceModify: { intensity: -20 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	恐惧: {
		minimaxEmotion: "fearful",
		minimaxPitch: 2,
		minimaxSpeed: 1.05,
		minimaxVoiceModify: { intensity: 18 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	惊讶: {
		minimaxEmotion: "surprised",
		minimaxPitch: 3,
		minimaxSpeed: 1.1,
		minimaxVoiceModify: { pitch: 20 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	厌恶: {
		minimaxEmotion: "disgusted",
		minimaxPitch: -1,
		minimaxSpeed: 0.9,
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	兴奋: {
		minimaxEmotion: "happy",
		minimaxPitch: 3,
		minimaxSpeed: 1.15,
		minimaxVoiceModify: { pitch: 20, intensity: -5 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	委屈: {
		minimaxEmotion: "sad",
		minimaxPitch: -1,
		minimaxSpeed: 0.9,
		minimaxVoiceModify: { intensity: 18, pitch: 5 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	平静: {
		minimaxEmotion: "calm",
		minimaxPitch: 0,
		minimaxSpeed: 1.0,
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	冷漠: {
		minimaxEmotion: "calm",
		minimaxPitch: -2,
		minimaxSpeed: 0.95,
		minimaxVoiceModify: { intensity: -18 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	怅然: {
		minimaxEmotion: "sad",
		minimaxPitch: -2,
		minimaxSpeed: 0.9,
		minimaxVoiceModify: { intensity: 18 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	欣慰: {
		minimaxEmotion: "happy",
		minimaxPitch: 1,
		minimaxSpeed: 1.0,
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	无奈: {
		minimaxEmotion: "sad",
		minimaxPitch: -2,
		minimaxSpeed: 0.9,
		minimaxVoiceModify: { intensity: 18 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	愧疚: {
		minimaxEmotion: "sad",
		minimaxPitch: -2,
		minimaxSpeed: 0.85,
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	释然: {
		minimaxEmotion: "calm",
		minimaxPitch: 0,
		minimaxSpeed: 0.95,
		minimaxVoiceModify: { intensity: 15 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	嫉妒: {
		minimaxEmotion: "angry",
		minimaxPitch: 1,
		minimaxSpeed: 1.05,
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	厌倦: {
		minimaxEmotion: "sad",
		minimaxPitch: -2,
		minimaxSpeed: 0.8,
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	忐忑: {
		minimaxEmotion: "fearful",
		minimaxPitch: 2,
		minimaxSpeed: 1.05,
		minimaxVoiceModify: { pitch: 12, intensity: 8 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	动情: {
		minimaxEmotion: "happy",
		minimaxPitch: 1,
		minimaxSpeed: 0.9,
		minimaxVoiceModify: { intensity: 20 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},

	// ==================== 整体语调 ====================
	// intensity-primary: 温柔(+20)、严肃(-18)、慵懒(+20)、干练(-15)、凌厉(-20)
	// pitch-primary: 活泼(+18)、俏皮(+15)、深沉(-20)
	温柔: {
		minimaxEmotion: null,
		minimaxPitch: -1,
		minimaxSpeed: 0.95,
		minimaxVoiceModify: { intensity: 20 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	高冷: {
		minimaxEmotion: null,
		minimaxPitch: -1,
		minimaxSpeed: 0.85,
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	活泼: {
		minimaxEmotion: "happy",
		minimaxPitch: 2,
		minimaxSpeed: 1.1,
		minimaxVoiceModify: { pitch: 18 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	严肃: {
		minimaxEmotion: "calm",
		minimaxPitch: 0,
		minimaxSpeed: 0.95,
		minimaxVoiceModify: { intensity: -18 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	慵懒: {
		minimaxEmotion: null,
		minimaxPitch: -1,
		minimaxSpeed: 0.8,
		minimaxVoiceModify: { intensity: 20 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	俏皮: {
		minimaxEmotion: "happy",
		minimaxPitch: 2,
		minimaxSpeed: 1.1,
		minimaxVoiceModify: { pitch: 15, intensity: -5 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	深沉: {
		minimaxEmotion: null,
		minimaxPitch: -3,
		minimaxSpeed: 0.85,
		minimaxVoiceModify: { pitch: -20 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	干练: {
		minimaxEmotion: null,
		minimaxPitch: 0,
		minimaxSpeed: 1.05,
		minimaxVoiceModify: { intensity: -15 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	凌厉: {
		minimaxEmotion: null,
		minimaxPitch: 2,
		minimaxSpeed: 1.1,
		minimaxVoiceModify: { intensity: -20 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},

	// ==================== 音色定位（全部 timbre-primary） ====================
	磁性: {
		minimaxEmotion: null,
		minimaxPitch: -2,
		minimaxSpeed: 0.9,
		minimaxVoiceModify: { timbre: -22 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	醇厚: {
		minimaxEmotion: null,
		minimaxPitch: -3,
		minimaxSpeed: 0.85,
		minimaxVoiceModify: { timbre: -25 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	清亮: {
		minimaxEmotion: null,
		minimaxPitch: 2,
		minimaxSpeed: 1.05,
		minimaxVoiceModify: { timbre: 22 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	空灵: {
		minimaxEmotion: null,
		minimaxPitch: 3,
		minimaxSpeed: 1.0,
		minimaxVoiceModify: { timbre: 25 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	稚嫩: {
		minimaxEmotion: null,
		minimaxPitch: 3,
		minimaxSpeed: 1.1,
		minimaxVoiceModify: { timbre: 20 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	苍老: {
		minimaxEmotion: null,
		minimaxPitch: -4,
		minimaxSpeed: 0.8,
		minimaxVoiceModify: { timbre: -22 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	甜美: {
		minimaxEmotion: null,
		minimaxPitch: 2,
		minimaxSpeed: 1.05,
		minimaxVoiceModify: { timbre: 18, intensity: 8 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	沙哑: {
		minimaxEmotion: null,
		minimaxPitch: -3,
		minimaxSpeed: 0.9,
		minimaxVoiceModify: { timbre: -22 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	醇雅: {
		minimaxEmotion: null,
		minimaxPitch: -2,
		minimaxSpeed: 0.9,
		mimoCompatible: true,
		mimoStyleTag: true,
	},

	// ==================== 人设腔调 ====================
	// pitch-primary: 夹子音(+25)、正太音(+18)
	// timbre-primary: 御姐音(-20)、大叔音(-25)
	// intensity-primary: 台湾腔(+12)
	夹子音: {
		minimaxEmotion: null,
		minimaxPitch: 4,
		minimaxSpeed: 1.1,
		minimaxVoiceModify: { pitch: 20 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	御姐音: {
		minimaxEmotion: null,
		minimaxPitch: -2,
		minimaxSpeed: 0.9,
		minimaxVoiceModify: { timbre: -20 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	正太音: {
		minimaxEmotion: null,
		minimaxPitch: 3,
		minimaxSpeed: 1.05,
		minimaxVoiceModify: { pitch: 18 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	大叔音: {
		minimaxEmotion: null,
		minimaxPitch: -4,
		minimaxSpeed: 0.85,
		minimaxVoiceModify: { timbre: -25 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	台湾腔: {
		minimaxEmotion: null,
		minimaxPitch: 1,
		minimaxSpeed: 1.05,
		minimaxVoiceModify: { intensity: 12 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},

	// ==================== 方言 ====================
	东北话: {
		minimaxEmotion: null,
		minimaxPitch: 0,
		minimaxSpeed: 1.1,
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	四川话: {
		minimaxEmotion: null,
		minimaxPitch: 0,
		minimaxSpeed: 1.05,
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	河南话: {
		minimaxEmotion: null,
		minimaxPitch: 0,
		minimaxSpeed: 1.0,
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	粤语: {
		minimaxEmotion: null,
		minimaxPitch: 0,
		minimaxSpeed: 1.0,
		mimoCompatible: true,
		mimoStyleTag: true,
	},

	// ==================== 角色扮演 ====================
	孙悟空: {
		minimaxEmotion: null,
		minimaxPitch: 2,
		minimaxSpeed: 1.2,
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	林黛玉: {
		minimaxEmotion: null,
		minimaxPitch: -2,
		minimaxSpeed: 0.85,
		mimoCompatible: true,
		mimoStyleTag: true,
	},

	// ==================== 语速节奏 ====================
	叹气: {
		minimaxEmotion: "sad",
		minimaxPitch: -2,
		minimaxSpeed: 0.9,
		minimaxVoiceModify: { intensity: 12 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	喘息: {
		minimaxEmotion: null,
		minimaxPitch: 0,
		minimaxSpeed: 0.9,
		minimaxVoiceModify: { intensity: 10, pitch: 3 },
		mimoCompatible: true,
		mimoStyleTag: false,
	},
	深呼吸: {
		minimaxEmotion: null,
		minimaxPitch: 0,
		minimaxSpeed: 0.9,
		minimaxVoiceModify: { intensity: 8, pitch: -2 },
		mimoCompatible: true,
		mimoStyleTag: false,
	},
	吸气: {
		minimaxEmotion: null,
		minimaxPitch: 0,
		minimaxSpeed: 0.9,
		minimaxVoiceModify: { intensity: 5, pitch: 2 },
		mimoCompatible: true,
		mimoStyleTag: false,
	},
	屏息: {
		minimaxEmotion: "whisper",
		minimaxPitch: 0,
		minimaxSpeed: 0.7,
		minimaxVoiceModify: { intensity: 18, pitch: -3 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},

	// ==================== 情绪状态 ====================
	// pitch-primary: 紧张(+15)、激动(+20)、震惊(+20)
	// intensity-primary: 害怕(+18)、疲惫(+20)、撒娇(+20)、心虚(+18)、不耐烦(-18)
	紧张: {
		minimaxEmotion: "fearful",
		minimaxPitch: 2,
		minimaxSpeed: 1.1,
		minimaxVoiceModify: { pitch: 15 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	害怕: {
		minimaxEmotion: "fearful",
		minimaxPitch: 3,
		minimaxSpeed: 1.1,
		minimaxVoiceModify: { intensity: 18 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	激动: {
		minimaxEmotion: "happy",
		minimaxPitch: 3,
		minimaxSpeed: 1.15,
		minimaxVoiceModify: { pitch: 20, intensity: -5 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	疲惫: {
		minimaxEmotion: null,
		minimaxPitch: -3,
		minimaxSpeed: 0.75,
		minimaxVoiceModify: { intensity: 20 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	撒娇: {
		minimaxEmotion: "happy",
		minimaxPitch: 3,
		minimaxSpeed: 1.1,
		minimaxVoiceModify: { intensity: 20, pitch: 5 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	心虚: {
		minimaxEmotion: "fearful",
		minimaxPitch: 1,
		minimaxSpeed: 1.0,
		minimaxVoiceModify: { intensity: 18 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	震惊: {
		minimaxEmotion: "surprised",
		minimaxPitch: 5,
		minimaxSpeed: 1.2,
		minimaxVoiceModify: { pitch: 20 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	不耐烦: {
		minimaxEmotion: "angry",
		minimaxPitch: 2,
		minimaxSpeed: 1.15,
		minimaxVoiceModify: { intensity: -18 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},

	// ==================== 语音特征 ====================
	// pitch-primary: 颤抖(+12)、破音(+22)
	// timbre-primary: 鼻音(+10)
	悄悄话: {
		minimaxEmotion: "whisper",
		minimaxPitch: 0,
		minimaxSpeed: 0.8,
		minimaxVoiceModify: { intensity: 18, pitch: -3 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	气声: {
		minimaxEmotion: "whisper",
		minimaxPitch: 0,
		minimaxSpeed: 0.9,
		minimaxVoiceModify: { intensity: 15 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	颤抖: {
		minimaxEmotion: "fearful",
		minimaxPitch: 2,
		minimaxSpeed: 1.1,
		minimaxVoiceModify: { pitch: 12 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	变调: {
		minimaxEmotion: null,
		minimaxPitch: 4,
		minimaxSpeed: 1.2,
		mimoCompatible: true,
		mimoStyleTag: false,
	},
	破音: {
		minimaxEmotion: null,
		minimaxPitch: 5,
		minimaxSpeed: 1.25,
		minimaxVoiceModify: { pitch: 22 },
		mimoCompatible: true,
		mimoStyleTag: false,
	},
	鼻音: {
		minimaxEmotion: null,
		minimaxPitch: -1,
		minimaxSpeed: 0.95,
		minimaxVoiceModify: { timbre: 10 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},

	// ==================== 哭笑表达 ====================
	// intensity-primary: 笑(+15)、轻笑(+12)、冷笑(-18)、抽泣(+18)、呜咽(+20)、哽咽(+18)、嚎啕大哭(+25)
	// pitch-primary: 大笑(+18)
	笑: {
		minimaxEmotion: "happy",
		minimaxPitch: 1,
		minimaxSpeed: 1.05,
		minimaxVoiceModify: { intensity: 15 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	轻笑: {
		minimaxEmotion: "happy",
		minimaxPitch: 1,
		minimaxSpeed: 1.0,
		minimaxVoiceModify: { intensity: 12 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	大笑: {
		minimaxEmotion: "happy",
		minimaxPitch: 3,
		minimaxSpeed: 1.15,
		minimaxVoiceModify: { pitch: 15 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	冷笑: {
		minimaxEmotion: "angry",
		minimaxPitch: -1,
		minimaxSpeed: 0.95,
		minimaxVoiceModify: { intensity: -18 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	抽泣: {
		minimaxEmotion: "sad",
		minimaxPitch: -2,
		minimaxSpeed: 0.85,
		minimaxVoiceModify: { intensity: 18 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	呜咽: {
		minimaxEmotion: null,
		minimaxPitch: -3,
		minimaxSpeed: 0.8,
		minimaxVoiceModify: { intensity: 20 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	哽咽: {
		minimaxEmotion: "sad",
		minimaxPitch: -2,
		minimaxSpeed: 0.85,
		minimaxVoiceModify: { intensity: 18 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},
	嚎啕大哭: {
		minimaxEmotion: "sad",
		minimaxPitch: -4,
		minimaxSpeed: 0.75,
		minimaxVoiceModify: { intensity: 25 },
		mimoCompatible: true,
		mimoStyleTag: true,
	},

	// ==================== 语速 ====================
	极慢: {
		minimaxEmotion: null,
		minimaxPitch: 0,
		minimaxSpeed: 0.5,
		mimoCompatible: true,
		mimoStyleTag: false,
	},
	慢速: {
		minimaxEmotion: null,
		minimaxPitch: 0,
		minimaxSpeed: 0.75,
		mimoCompatible: true,
		mimoStyleTag: false,
	},
	正常: {
		minimaxEmotion: null,
		minimaxPitch: 0,
		minimaxSpeed: 1.0,
		mimoCompatible: true,
		mimoStyleTag: false,
	},
	快速: {
		minimaxEmotion: null,
		minimaxPitch: 0,
		minimaxSpeed: 1.3,
		mimoCompatible: true,
		mimoStyleTag: false,
	},
	极快: {
		minimaxEmotion: null,
		minimaxPitch: 0,
		minimaxSpeed: 1.6,
		mimoCompatible: true,
		mimoStyleTag: false,
	},
};

export function buildTtsConfig(configs: { key: string; value: unknown }[]) {
	const configMap = new Map(configs.map((c) => [c.key, String(c.value ?? "")]));
	return {
		provider: configMap.get(TTS_CONFIG_KEYS.PROVIDER) ?? "minimax",
		minimaxEndpoint: configMap.get(TTS_CONFIG_KEYS.MINIMAX_ENDPOINT) ?? "https://api.minimaxi.com",
		minimaxApiKey: configMap.get(TTS_CONFIG_KEYS.MINIMAX_API_KEY) ?? "",
		minimaxModel: configMap.get(TTS_CONFIG_KEYS.MINIMAX_MODEL) ?? "speech-2.8-hd",
		minimaxModelDesign: configMap.get(TTS_CONFIG_KEYS.MINIMAX_MODEL_DESIGN) ?? "speech-2.8-hd",
		minimaxModelClone: configMap.get(TTS_CONFIG_KEYS.MINIMAX_MODEL_CLONE) ?? "speech-2.8-hd",
		minimaxDefaultVoice: configMap.get(TTS_CONFIG_KEYS.MINIMAX_DEFAULT_VOICE) ?? "male-qn-qingse",
		minimaxLanguageBoost: configMap.get(TTS_CONFIG_KEYS.MINIMAX_LANGUAGE_BOOST) ?? "",
		minimaxMaxChars: Number(configMap.get(TTS_CONFIG_KEYS.MINIMAX_MAX_CHARS)) || 10000,
		mimoEndpoint:
			configMap.get(TTS_CONFIG_KEYS.MIMO_ENDPOINT) ?? "https://token-plan-cn.xiaomimimo.com/v1",
		mimoApiKey: configMap.get(TTS_CONFIG_KEYS.MIMO_API_KEY) ?? "",
		mimoModelPreset: configMap.get(TTS_CONFIG_KEYS.MIMO_MODEL_PRESET) ?? "mimo-v2.5-tts",
		mimoModelDesign:
			configMap.get(TTS_CONFIG_KEYS.MIMO_MODEL_DESIGN) ?? "mimo-v2.5-tts-voicedesign",
		mimoModelClone: configMap.get(TTS_CONFIG_KEYS.MIMO_MODEL_CLONE) ?? "mimo-v2.5-tts-voiceclone",
		mimoDefaultVoice: configMap.get(TTS_CONFIG_KEYS.MIMO_DEFAULT_VOICE) ?? "冰糖",
		mimoMaxChars: Number(configMap.get(TTS_CONFIG_KEYS.MIMO_MAX_CHARS)) || 10000,
	};
}

export type TtsConfig = ReturnType<typeof buildTtsConfig>;

// TTS 配置缓存（使用 Map 支持多实例/多租户场景，避免 serverless 并发问题）
const ttsConfigCache = new Map<string, { config: TtsConfig; time: number }>();
const ttsConfigPromise = new Map<string, Promise<TtsConfig>>();
const TTS_CONFIG_CACHE_TTL = 60_000; // 60 秒缓存

function getCacheKey(): string {
	// 使用进程 ID + 线程 ID（如果有）作为实例标识
	return `tts-config-${process.pid}`;
}

/**
 * 获取TTS配置（从系统配置表，带60秒缓存，原子化锁防止并发重建）
 * 使用 Map 存储缓存，支持多实例/多租户场景
 */
export async function getTtsConfig(ctx: Pick<Context, "db">) {
	const cacheKey = getCacheKey();
	const now = Date.now();
	const cached = ttsConfigCache.get(cacheKey);

	if (cached && now - cached.time < TTS_CONFIG_CACHE_TTL) {
		return cached.config;
	}

	// 如果已有请求在构建缓存，复用该 Promise（防止并发 Race Condition）
	const existingPromise = ttsConfigPromise.get(cacheKey);
	if (existingPromise) {
		return existingPromise;
	}

	const promise = (async () => {
		const configs = await ctx.db
			.select()
			.from(systemConfigs)
			.where(eq(systemConfigs.category, "tts"));

		const config = buildTtsConfig(configs);
		ttsConfigCache.set(cacheKey, { config, time: Date.now() });
		return config;
	})();

	ttsConfigPromise.set(cacheKey, promise);

	try {
		return await promise;
	} finally {
		ttsConfigPromise.delete(cacheKey);
	}
}

/**
 * 清除TTS配置缓存（用于测试或配置更新后）
 */
export function clearTtsConfigCache() {
	ttsConfigCache.clear();
	ttsConfigPromise.clear();
}
