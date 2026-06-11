import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { pointTransactions, userPoints } from "@/drizzle/schemas";
import type { PointTransactionType } from "@/drizzle/schemas/points";
import { logger } from "@/lib/logger";
import type { Context } from "@/server/server";
import type { TtsConfig } from "./config";
import {
	base64ToUint8Array,
	buildMinimaxText,
	detectAudioFormat,
	extractMinimaxSettings,
	fetchWithTimeout,
	filterMimoTags,
} from "./utils";

export interface TtsInput {
	text: string;
	provider?: "minimax" | "mimo";
	voice?: string;
	modelMode?: "preset" | "design" | "clone";
	speed?: number;
	stylePrompt?: string;
	audioTags?: string[];
	cloneVoice?: string;
	voiceDesignPrompt?: string;
	emotion?: string;
	pitch?: number;
	volume?: number;
	languageBoost?: string;
	voiceModify?: {
		pitch?: number;
		intensity?: number;
		timbre?: number;
		sound_effects?: "spacious_echo" | "auditorium_echo" | "lofi_telephone" | "robotic";
	};
}

export interface TtsResult {
	audio: string;
	contentType: string;
}

/**
 * 调用 MiMo TTS API
 */
export async function callMimoTTS(config: TtsConfig, input: TtsInput): Promise<TtsResult> {
	if (!config.mimoApiKey) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: "MiMo TTS 未配置 API Key",
		});
	}

	const modelMap = {
		preset: config.mimoModelPreset,
		design: config.mimoModelDesign,
		clone: config.mimoModelClone,
	};

	const model = modelMap[input.modelMode || "preset"];
	const voice = input.voice || config.mimoDefaultVoice;

	// 构建 MiMo 消息格式
	const messages: Array<{
		role: "user" | "assistant";
		content: string;
	}> = [];

	// user message: 音色设计内容（音色设计模式）或风格提示
	if (input.modelMode === "design" && input.voiceDesignPrompt?.trim()) {
		messages.push({ role: "user", content: input.voiceDesignPrompt.trim() });
	} else if (input.stylePrompt?.trim()) {
		messages.push({ role: "user", content: input.stylePrompt.trim() });
	}

	// assistant message: 合成文本
	// 将 mimoStyleTag: true 的标签嵌入到文本前面，格式：[标签]文本
	// 例如：[粤语]你好
	const mimoTags = filterMimoTags(input.audioTags);
	let textContent = input.text.trim();
	if (mimoTags.length > 0) {
		const tagPrefix = mimoTags.map((tag) => `[${tag}]`).join("");
		textContent = tagPrefix + textContent;
	}
	messages.push({ role: "assistant", content: textContent });

	// 构建 MiMo 音频配置
	const audioConfig: { format: string; voice?: string } = {
		format: "wav",
	};

	if (input.modelMode === "clone") {
		if (!input.cloneVoice) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "克隆模式需要上传参考音频",
			});
		}
		if (input.cloneVoice.length > 14_000_000) {
			throw new TRPCError({
				code: "PAYLOAD_TOO_LARGE",
				message: "音频不符合规范，请上传 8-16 秒的音频（不超过 10MB）",
			});
		}
		const dataUrl = input.cloneVoice.startsWith("data:")
			? input.cloneVoice
			: `data:audio/wav;base64,${input.cloneVoice}`;
		audioConfig.voice = dataUrl;
	} else if (input.modelMode === "preset") {
		audioConfig.voice = voice;
	}

	const requestBody: {
		model: string;
		messages: Array<{ role: string; content: string }>;
		audio: typeof audioConfig;
	} = {
		model,
		messages,
		audio: audioConfig,
	};

	const response = await fetchWithTimeout(`${config.mimoEndpoint}/chat/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"api-key": String(config.mimoApiKey),
		},
		body: JSON.stringify(requestBody),
		timeout: 30000,
	});

	if (!response.ok) {
		const errorText = await response.text().catch(() => "Unknown error");
		throw new TRPCError({
			code: response.status >= 500 ? "BAD_GATEWAY" : "BAD_REQUEST",
			message: `MiMo TTS 错误 (${response.status}): ${errorText}`,
		});
	}

	const data = await response.json();
	let audioData = data?.choices?.[0]?.message?.audio?.data;

	if (!audioData) {
		logger.error("MiMo API response structure: no audio data", undefined, {
			responseKeys: Object.keys(data || {}),
			choicesLength: data?.choices?.length,
		});
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "MiMo TTS 未返回音频数据",
		});
	}

	// 确保返回纯 base64（去除可能的 data URL 前缀和空白字符）
	audioData = String(audioData).trim();
	const dataUrlMatch = audioData.match(/^data:[^;]+;base64,(.+)$/s);
	if (dataUrlMatch) {
		audioData = dataUrlMatch[1];
	}
	audioData = audioData.replace(/[\s\r\n]/g, "");

	return { audio: audioData, contentType: "audio/wav" };
}

/**
 * 调用 MiniMax TTS API
 */
export async function callMinimaxTTS(
	config: TtsConfig,
	input: TtsInput,
	userId: string,
): Promise<TtsResult> {
	if (!config.minimaxApiKey) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: "MiniMax TTS 未配置 API Key",
		});
	}

	const modelMap = {
		preset: config.minimaxModel || "speech-2.8-hd",
		design: config.minimaxModelDesign || "speech-2.8-hd",
		clone: config.minimaxModelClone || "speech-2.8-hd",
	};

	const model = modelMap[input.modelMode || "preset"];

	// 从音频标签中提取 MiniMax 官方参数（emotion/pitch/speed）和 voice_modify
	const {
		emotion: extractedEmotion,
		pitch: tagPitch,
		speed: tagSpeed,
		voiceModify: tagVoiceModify,
	} = extractMinimaxSettings(input.audioTags);

	// 合并 voice_modify：用户输入的优先，audioTags 的作为补充
	const mergedVoiceModify = (() => {
		const inputVm = input.voiceModify;
		const tagVm = tagVoiceModify;
		if (!inputVm && !tagVm) return undefined;
		const vm: { pitch?: number; intensity?: number; timbre?: number; sound_effects?: string } = {};
		// pitch: 叠加
		const p = (inputVm?.pitch ?? 0) + (tagVm?.pitch ?? 0);
		if (p !== 0) vm.pitch = Math.max(-100, Math.min(100, p));
		// intensity: 叠加
		const i = (inputVm?.intensity ?? 0) + (tagVm?.intensity ?? 0);
		if (i !== 0) vm.intensity = Math.max(-100, Math.min(100, i));
		// timbre: 叠加
		const t = (inputVm?.timbre ?? 0) + (tagVm?.timbre ?? 0);
		if (t !== 0) vm.timbre = Math.max(-100, Math.min(100, t));
		// sound_effects: input 优先
		if (inputVm?.sound_effects) vm.sound_effects = inputVm.sound_effects;
		else if (tagVm?.sound_effects) vm.sound_effects = tagVm.sound_effects;
		return Object.keys(vm).length > 0 ? vm : undefined;
	})();

	// 构建 voice_setting（使用 MiniMax 官方 emotion 参数）
	const voiceSetting: {
		speed?: number;
		vol?: number;
		pitch?: number;
		english_normalization?: boolean;
		emotion?: string;
		voice_id?: string;
	} = {
		speed: input.speed ?? tagSpeed,
		vol: input.volume ?? 10,
		pitch: input.pitch ?? tagPitch,
		english_normalization: false,
	};

	// 使用 MiniMax 官方 emotion 参数（happy/sad/angry/fearful/disgusted/surprised/calm/fluent/whisper）
	const finalEmotion = input.emotion || extractedEmotion;
	if (finalEmotion) {
		voiceSetting.emotion = finalEmotion;
	}

	// 构建 voice_modify（声音效果器，更精细的音色控制）
	const voiceModify:
		| { pitch?: number; intensity?: number; timbre?: number; sound_effects?: string }
		| undefined = mergedVoiceModify;

	if (input.modelMode === "clone") {
		// 克隆模式：需要先上传音频创建临时音色
		if (!input.cloneVoice) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "克隆模式需要上传参考音频",
			});
		}
		if (input.cloneVoice.length > 14_000_000) {
			throw new TRPCError({
				code: "PAYLOAD_TOO_LARGE",
				message: "音频不符合规范，请上传 8-16 秒的音频（不超过 10MB）",
			});
		}

		const base64Data = input.cloneVoice.startsWith("data:")
			? (input.cloneVoice.split(",")[1] ?? input.cloneVoice)
			: input.cloneVoice;

		let uint8: Uint8Array;
		try {
			uint8 = base64ToUint8Array(base64Data);
		} catch {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "参考音频格式错误",
			});
		}

		const formData = new FormData();
		const { ext, mimeType } = detectAudioFormat(uint8);
		const fileName = `clone_${Date.now()}.${ext}`;
		const file = new File([uint8.slice()], fileName, { type: mimeType });
		formData.append("file", file);
		formData.append("purpose", "voice_clone");

		const uploadResponse = await fetchWithTimeout(`${config.minimaxEndpoint}/v1/files/upload`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${config.minimaxApiKey}`,
			},
			body: formData,
			timeout: 60000,
		});

		if (!uploadResponse.ok) {
			const errorText = await uploadResponse.text().catch(() => "Unknown error");
			throw new TRPCError({
				code: uploadResponse.status >= 500 ? "BAD_GATEWAY" : "BAD_REQUEST",
				message: `MiniMax 上传复刻音频失败 (${uploadResponse.status}): ${errorText}`,
			});
		}

		const uploadData = await uploadResponse.json();
		const fileId = uploadData?.file?.file_id;

		if (!fileId) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "MiniMax 上传复刻音频未返回 file_id",
			});
		}

		// 创建克隆音色
		const clonedVoiceId = `clone_${userId}_${Date.now()}`;
		const cloneResponse = await fetchWithTimeout(`${config.minimaxEndpoint}/v1/voice_clone`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${config.minimaxApiKey}`,
			},
			body: JSON.stringify({
				file_id: fileId,
				voice_id: clonedVoiceId,
				model: config.minimaxModelClone || "speech-2.8-hd",
			}),
			timeout: 60000,
		});

		if (!cloneResponse.ok) {
			const errorText = await cloneResponse.text().catch(() => "Unknown error");
			throw new TRPCError({
				code: cloneResponse.status >= 500 ? "BAD_GATEWAY" : "BAD_REQUEST",
				message: `MiniMax 创建克隆音色失败 (${cloneResponse.status}): ${errorText}`,
			});
		}

		voiceSetting.voice_id = clonedVoiceId;
	} else {
		voiceSetting.voice_id = input.voice || config.minimaxDefaultVoice || "male-qn-qingse";
	}

	// 构建纯文本（MiniMax 通过 voice_setting 的 emotion/pitch/speed 控制风格，不嵌入标签到文本中）
	const enhancedText = buildMinimaxText(input.text);

	const requestBody: {
		model: string;
		text: string;
		voice_setting: typeof voiceSetting;
		audio_setting: { audio_sample_rate: number; bitrate: number; format: string; channel: number };
		voice_modify?: typeof voiceModify;
		language_boost?: string;
	} = {
		model,
		text: enhancedText,
		voice_setting: voiceSetting,
		audio_setting: {
			audio_sample_rate: 32000,
			bitrate: 128000,
			format: "mp3",
			channel: 1,
		},
	};

	// 添加 voice_modify 声音效果器（如果有的话）
	if (voiceModify) {
		requestBody.voice_modify = voiceModify;
	}

	// 语言增强（可选，优先使用用户选择，其次使用配置）
	const boostValue = input.languageBoost || config.minimaxLanguageBoost;
	if (boostValue) {
		requestBody.language_boost = boostValue;
	}

	const response = await fetchWithTimeout(`${config.minimaxEndpoint}/v1/t2a_v2`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${config.minimaxApiKey}`,
		},
		body: JSON.stringify(requestBody),
		timeout: 60000,
	});

	if (!response.ok) {
		const errorText = await response.text().catch(() => "Unknown error");
		throw new TRPCError({
			code: response.status >= 500 ? "BAD_GATEWAY" : "BAD_REQUEST",
			message: `MiniMax TTS 错误 (${response.status}): ${errorText}`,
		});
	}

	const data = await response.json();
	const hexAudio = data?.data?.audio;

	if (!hexAudio) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "MiniMax TTS 未返回音频数据",
		});
	}

	// MiniMax 返回的是 hex 编码，需要转为 base64
	try {
		let hexStr = String(hexAudio).trim();
		// 清理非 hex 字符（空格、换行等）
		hexStr = hexStr.replace(/[^0-9a-fA-F]/g, "");
		if (hexStr.length === 0 || hexStr.length % 2 !== 0) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "MiniMax TTS 音频数据格式错误（无效 hex）",
			});
		}
		const audioData = Buffer.from(hexStr, "hex").toString("base64");
		return { audio: audioData, contentType: "audio/mpeg" };
	} catch (e) {
		if (e instanceof TRPCError) throw e;
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "MiniMax TTS 音频数据格式错误",
		});
	}
}

/**
 * 退还积分（TTS 失败时）
 */
export async function refundPoints(
	ctx: Pick<Context, "db">,
	userId: string,
	pointsCost: number,
	usedDaily: number,
	usedMonthly: number,
	businessId: string,
	errorMessage: string,
	now: Date = new Date(),
) {
	await ctx.db.transaction(async (tx) => {
		const [currentRecord] = await tx
			.select()
			.from(userPoints)
			.where(eq(userPoints.userId, userId))
			.for("update");

		if (currentRecord) {
			await tx
				.update(userPoints)
				.set({
					dailyBalance: currentRecord.dailyBalance + usedDaily,
					monthlyBalance: currentRecord.monthlyBalance + usedMonthly,
					totalConsumed: Math.max(0, currentRecord.totalConsumed - pointsCost),
					updatedAt: now,
				})
				.where(eq(userPoints.userId, userId));

			await tx.insert(pointTransactions).values({
				userId,
				type: "refund" as PointTransactionType,
				amount: pointsCost,
				balanceBefore: currentRecord.dailyBalance + currentRecord.monthlyBalance,
				balanceAfter:
					currentRecord.dailyBalance + usedDaily + currentRecord.monthlyBalance + usedMonthly,
				businessId,
				description: `TTS生成失败退还积分: ${errorMessage}`,
				createdAt: now,
			});
		}
	});
}
