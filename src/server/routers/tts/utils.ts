import { getUserMembershipInfo, isSameDay, isSameMonth } from "@/lib/shared-utils";
import type { Context } from "@/server/server";
import { TAG_MAPPING } from "./config";

// 重新导出共享函数
export { isSameDay, isSameMonth, getUserMembershipInfo };

/**
 * Edge Runtime 兼容的 base64 解码
 */
export function base64ToUint8Array(base64: string): Uint8Array {
	const binaryString = atob(base64);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes;
}

/**
 * 带超时和信号控制的 fetch
 */
export async function fetchWithTimeout(
	url: string,
	options: RequestInit & { timeout?: number } = {},
): Promise<Response> {
	const { timeout = 30000, ...rest } = options;
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeout);
	try {
		const response = await fetch(url, { ...rest, signal: controller.signal });
		return response;
	} finally {
		clearTimeout(id);
	}
}

/**
 * 计算文本消耗的积分（从数据库读取配置）
 * - 汉字：每字 3 积分（可配置）
 * - 字母：每字母 2.5 积分（可配置）
 * - 标点符号：每个 0.5 积分（可配置）
 */
export async function calculateTextPoints(
	text: string,
	config: { ttsCostChinese: number; ttsCostEnglish: number; ttsCostPunctuation: number },
): Promise<number> {
	const { ttsCostChinese, ttsCostEnglish, ttsCostPunctuation } = config;

	let points = 0;

	for (const char of text) {
		if (/[\u4e00-\u9fa5]/.test(char)) {
			points += ttsCostChinese;
		} else if (/[a-zA-Z]/.test(char)) {
			points += ttsCostEnglish;
		} else if (/[\u0021-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E]/.test(char)) {
			points += ttsCostPunctuation;
		} else if (/[\u3000-\u303F\uFF00-\uFFEF]/.test(char)) {
			points += ttsCostPunctuation;
		}
	}

	return Math.ceil(points);
}

/**
 * 检查用户是否有有效订阅会员
 * @returns boolean - 是否为订阅会员
 */
export async function checkMembership(ctx: Pick<Context, "db">, userId: string): Promise<boolean> {
	const membership = await getUserMembershipInfo(ctx, userId);
	return (
		membership?.membership?.status === "active" &&
		membership?.membership?.endDate &&
		new Date(membership.membership.endDate) > new Date()
	);
}

/**
 * 为 MiniMax 构建纯文本（不再嵌入标签到文本中）
 * MiniMax 的情绪/风格通过 voice_setting 的 emotion/pitch/speed 参数控制，
 * 而不是通过在文本中嵌入中文标签（MiniMax 不识别嵌入的中文标签）
 */
export function buildMinimaxText(text: string): string {
	return text.trim();
}

/**
 * 从音频标签中提取 MiniMax 官方参数：
 * - emotion: 优先级最高的情绪标签（happy/sad/angry/fearful/disgusted/surprised/calm/fluent/whisper）
 * - pitch: 所有标签的 pitch 偏移累加
 * - speed: 所有标签的 speed 系数相乘
 * - voiceModify: 所有标签的 voice_modify 参数累加
 *
 * emotion 选取规则：多个情绪标签时，取第一个有 minimaxEmotion 映射的标签
 */
export function extractMinimaxSettings(audioTags?: string[]): {
	emotion: string | null;
	pitch: number;
	speed: number;
	voiceModify?: {
		pitch?: number;
		intensity?: number;
		timbre?: number;
		sound_effects?: "spacious_echo" | "auditorium_echo" | "lofi_telephone" | "robotic";
	};
} {
	let emotion: string | null = null;
	let pitch = 0;
	let speed = 1.0;
	let vmPitch = 0;
	let vmIntensity = 0;
	let vmTimbre = 0;
	let soundEffects: "spacious_echo" | "auditorium_echo" | "lofi_telephone" | "robotic" | undefined;
	let hasVoiceModify = false;

	if (!audioTags || audioTags.length === 0) return { emotion, pitch, speed };

	for (const tag of audioTags) {
		const mapping = TAG_MAPPING[tag];
		if (!mapping) continue;

		// 取第一个有 emotion 映射的标签
		if (!emotion && mapping.minimaxEmotion) {
			emotion = mapping.minimaxEmotion;
		}

		pitch += mapping.minimaxPitch;
		speed *= mapping.minimaxSpeed;

		// 聚合 voice_modify 参数
		if (mapping.minimaxVoiceModify) {
			const vm = mapping.minimaxVoiceModify;
			vmPitch += vm.pitch ?? 0;
			vmIntensity += vm.intensity ?? 0;
			vmTimbre += vm.timbre ?? 0;
			if (vm.sound_effects) {
				soundEffects = vm.sound_effects;
			}
			hasVoiceModify = true;
		}
	}

	const result: {
		emotion: string | null;
		pitch: number;
		speed: number;
		voiceModify?: {
			pitch?: number;
			intensity?: number;
			timbre?: number;
			sound_effects?: "spacious_echo" | "auditorium_echo" | "lofi_telephone" | "robotic";
		};
	} = {
		emotion,
		pitch: Math.max(-12, Math.min(12, Math.round(pitch))),
		speed: Math.max(0.5, Math.min(2.0, speed)),
	};

	if (hasVoiceModify) {
		const vm: {
			pitch?: number;
			intensity?: number;
			timbre?: number;
			sound_effects?: "spacious_echo" | "auditorium_echo" | "lofi_telephone" | "robotic";
		} = {};
		const clampedPitch = Math.max(-100, Math.min(100, Math.round(vmPitch)));
		const clampedIntensity = Math.max(-100, Math.min(100, Math.round(vmIntensity)));
		const clampedTimbre = Math.max(-100, Math.min(100, Math.round(vmTimbre)));
		if (clampedPitch !== 0) vm.pitch = clampedPitch;
		if (clampedIntensity !== 0) vm.intensity = clampedIntensity;
		if (clampedTimbre !== 0) vm.timbre = clampedTimbre;
		if (soundEffects) vm.sound_effects = soundEffects;
		if (Object.keys(vm).length > 0) {
			result.voiceModify = vm;
		}
	}

	return result;
}

/**
 * 从音频标签中过滤出 MiMo 可嵌入文本的风格标签
 * 只有 mimoStyleTag: true 的标签才会被嵌入到文本中
 * mimoStyleTag: false 的标签（如变调、破音）只影响参数，不会被嵌入文本
 */
export function filterMimoTags(audioTags?: string[]): string[] {
	if (!audioTags || audioTags.length === 0) return [];
	return audioTags.filter((tag) => {
		const mapping = TAG_MAPPING[tag];
		// 只有标记为 mimoStyleTag 的标签才嵌入文本
		return mapping ? mapping.mimoStyleTag : false;
	});
}

/**
 * 检测音频格式（通过魔数识别）
 */
export function detectAudioFormat(bytes: Uint8Array): { ext: string; mimeType: string } {
	const b0 = bytes[0] ?? 0,
		b1 = bytes[1] ?? 0,
		b2 = bytes[2] ?? 0,
		b3 = bytes[3] ?? 0,
		b4 = bytes[4] ?? 0,
		b5 = bytes[5] ?? 0,
		b6 = bytes[6] ?? 0,
		b7 = bytes[7] ?? 0;
	if (bytes.length >= 3 && b0 === 0xff && (b1 & 0xe0) === 0xe0) {
		return { ext: "mp3", mimeType: "audio/mpeg" }; // MP3 (untagged)
	}
	if (bytes.length >= 3 && b0 === 0x49 && b1 === 0x44 && b2 === 0x33) {
		return { ext: "mp3", mimeType: "audio/mpeg" }; // MP3 (ID3v2 tagged)
	}
	if (bytes.length >= 8) {
		const ftyp = String.fromCharCode(b4, b5, b6, b7);
		if (ftyp === "ftyp" && b3 >= 0x00 && b3 <= 0x0f) {
			return { ext: "m4a", mimeType: "audio/mp4" };
		}
	}
	// WAV magic: "RIFF" + "WAVE"
	if (
		bytes.length >= 12 &&
		String.fromCharCode(b0, b1, b2, b3) === "RIFF" &&
		String.fromCharCode(bytes[8] ?? 0, bytes[9] ?? 0, bytes[10] ?? 0, bytes[11] ?? 0) === "WAVE"
	) {
		return { ext: "wav", mimeType: "audio/wav" };
	}
	// Default to wav
	return { ext: "wav", mimeType: "audio/wav" };
}
