import { beforeEach, describe, expect, it } from "vitest";
import {
	buildTtsConfig,
	clearTtsConfigCache,
	MIMO_VOICES,
	MINIMAX_VOICES,
	TAG_MAPPING,
	TTS_CONFIG_KEYS,
} from "../routers/tts/config";

describe("TTS Config", () => {
	beforeEach(() => {
		clearTtsConfigCache();
	});

	describe("buildTtsConfig", () => {
		it("should build config with default values when no configs provided", () => {
			const config = buildTtsConfig([]);

			expect(config.provider).toBe("minimax");
			expect(config.minimaxEndpoint).toBe("https://api.minimaxi.com");
			expect(config.minimaxModel).toBe("speech-2.8-hd");
			expect(config.minimaxDefaultVoice).toBe("male-qn-qingse");
			expect(config.mimoEndpoint).toBe("https://token-plan-cn.xiaomimimo.com/v1");
			expect(config.mimoModelPreset).toBe("mimo-v2.5-tts");
			expect(config.mimoDefaultVoice).toBe("冰糖");
		});

		it("should use provided config values", () => {
			const configs = [
				{ key: TTS_CONFIG_KEYS.PROVIDER, value: "mimo" },
				{ key: TTS_CONFIG_KEYS.MINIMAX_API_KEY, value: "test-key" },
				{ key: TTS_CONFIG_KEYS.MIMO_DEFAULT_VOICE, value: "茉莉" },
			];

			const config = buildTtsConfig(configs);

			expect(config.provider).toBe("mimo");
			expect(config.minimaxApiKey).toBe("test-key");
			expect(config.mimoDefaultVoice).toBe("茉莉");
		});
	});

	describe("Voice Lists", () => {
		it("should have 24 MiniMax voices", () => {
			expect(MINIMAX_VOICES).toHaveLength(24);
			expect(MINIMAX_VOICES[0]).toHaveProperty("id");
			expect(MINIMAX_VOICES[0]).toHaveProperty("name");
			expect(MINIMAX_VOICES[0]).toHaveProperty("lang");
			expect(MINIMAX_VOICES[0]).toHaveProperty("gender");
		});

		it("should have 8 MiMo voices", () => {
			expect(MIMO_VOICES).toHaveLength(8);
			expect(MIMO_VOICES[0]).toHaveProperty("id");
			expect(MIMO_VOICES[0]).toHaveProperty("name");
		});

		it("should have Cantonese voices in MiniMax", () => {
			const cantoneseVoices = MINIMAX_VOICES.filter((v) => v.lang === "粤语");
			expect(cantoneseVoices).toHaveLength(2);
			expect(cantoneseVoices[0]?.id).toBe("Cantonese_GentleLady");
			expect(cantoneseVoices[1]?.id).toBe("Cantonese_podacast_host_1");
		});
	});

	describe("TAG_MAPPING", () => {
		it("should map emotion tags to MiniMax emotion parameter", () => {
			expect(TAG_MAPPING.开心?.minimaxEmotion).toBe("happy");
			expect(TAG_MAPPING.悲伤?.minimaxEmotion).toBe("sad");
			expect(TAG_MAPPING.愤怒?.minimaxEmotion).toBe("angry");
			expect(TAG_MAPPING.恐惧?.minimaxEmotion).toBe("fearful");
			expect(TAG_MAPPING.惊讶?.minimaxEmotion).toBe("surprised");
			expect(TAG_MAPPING.平静?.minimaxEmotion).toBe("calm");
			expect(TAG_MAPPING.悄悄话?.minimaxEmotion).toBe("whisper");
		});

		it("should contain pitch and speed adjustments", () => {
			expect(TAG_MAPPING.开心?.minimaxPitch).toBe(2);
			expect(TAG_MAPPING.开心?.minimaxSpeed).toBe(1.05);
			expect(TAG_MAPPING.悲伤?.minimaxPitch).toBe(-2);
			expect(TAG_MAPPING.悲伤?.minimaxSpeed).toBe(0.85);
		});

		it("should mark MiMo compatibility", () => {
			expect(TAG_MAPPING.开心?.mimoCompatible).toBe(true);
			expect(TAG_MAPPING.东北话?.mimoCompatible).toBe(true);
			expect(TAG_MAPPING.粤语?.mimoCompatible).toBe(true);
		});

		it("should contain dialect tags", () => {
			expect(TAG_MAPPING.东北话).toBeDefined();
			expect(TAG_MAPPING.粤语).toBeDefined();
		});

		it("should contain character tags", () => {
			expect(TAG_MAPPING.孙悟空).toBeDefined();
			expect(TAG_MAPPING.林黛玉).toBeDefined();
		});
	});
});
