import { describe, expect, it } from "vitest";
import {
	base64ToUint8Array,
	buildMinimaxText,
	calculateTextPoints,
	detectAudioFormat,
	extractMinimaxSettings,
	filterMimoTags,
	isSameDay,
	isSameMonth,
} from "../routers/tts/utils";

describe("TTS Utils", () => {
	describe("base64ToUint8Array", () => {
		it("should decode base64 to Uint8Array", () => {
			const base64 = "SGVsbG8gV29ybGQ="; // "Hello World"
			const result = base64ToUint8Array(base64);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(11);
		});
	});

	describe("isSameDay", () => {
		it("should return true for same day", () => {
			const d1 = new Date("2024-01-15T10:00:00");
			const d2 = new Date("2024-01-15T22:00:00");
			expect(isSameDay(d1, d2)).toBe(true);
		});

		it("should return false for different days", () => {
			const d1 = new Date("2024-01-15T10:00:00");
			const d2 = new Date("2024-01-16T10:00:00");
			expect(isSameDay(d1, d2)).toBe(false);
		});

		it("should return false for different months", () => {
			const d1 = new Date("2024-01-15T10:00:00");
			const d2 = new Date("2024-02-15T10:00:00");
			expect(isSameDay(d1, d2)).toBe(false);
		});
	});

	describe("isSameMonth", () => {
		it("should return true for same month", () => {
			const d1 = new Date("2024-01-15T10:00:00");
			const d2 = new Date("2024-01-25T22:00:00");
			expect(isSameMonth(d1, d2)).toBe(true);
		});

		it("should return false for different months", () => {
			const d1 = new Date("2024-01-15T10:00:00");
			const d2 = new Date("2024-02-15T10:00:00");
			expect(isSameMonth(d1, d2)).toBe(false);
		});
	});

	describe("calculateTextPoints", () => {
		it("should calculate points for Chinese text", async () => {
			const config = { ttsCostChinese: 4, ttsCostEnglish: 2.5, ttsCostPunctuation: 0.5 };
			const points = await calculateTextPoints("你好世界", config);
			expect(points).toBe(16); // 4 chars * 4 points
		});

		it("should calculate points for English text", async () => {
			const config = { ttsCostChinese: 4, ttsCostEnglish: 2.5, ttsCostPunctuation: 0.5 };
			const points = await calculateTextPoints("Hello", config);
			expect(points).toBe(13); // 5 chars * 2.5 = 12.5 -> ceil -> 13
		});

		it("should calculate points for mixed text", async () => {
			const config = { ttsCostChinese: 4, ttsCostEnglish: 2.5, ttsCostPunctuation: 0.5 };
			const points = await calculateTextPoints("Hello世界!", config);
			// H(2.5) + e(2.5) + l(2.5) + l(2.5) + o(2.5) + 世(4) + 界(4) + !(0.5) = 21
			expect(points).toBe(21);
		});
	});

	describe("buildMinimaxText", () => {
		it("should return plain text", () => {
			const result = buildMinimaxText("Hello world");
			expect(result).toBe("Hello world");
		});

		it("should trim whitespace", () => {
			const result = buildMinimaxText("  Hello world  ");
			expect(result).toBe("Hello world");
		});
	});

	describe("extractMinimaxSettings", () => {
		it("should return defaults for empty tags", () => {
			const result = extractMinimaxSettings([]);
			expect(result).toEqual({ emotion: null, pitch: 0, speed: 1.0 });
		});

		it("should return defaults for undefined tags", () => {
			const result = extractMinimaxSettings(undefined);
			expect(result).toEqual({ emotion: null, pitch: 0, speed: 1.0 });
		});

		it("should extract emotion from single tag", () => {
			const result = extractMinimaxSettings(["开心"]);
			expect(result.emotion).toBe("happy");
			expect(result.pitch).toBe(2);
			expect(result.speed).toBe(1.05);
		});

		it("should extract emotion from multiple tags (first wins)", () => {
			const result = extractMinimaxSettings(["开心", "悲伤"]);
			// 开心: emotion=happy, pitch=2, speed=1.05
			// 悲伤: emotion=sad, pitch=-2, speed=0.85
			// emotion: first wins = happy
			// pitch: 2 + (-2) = 0; speed: 1.05 * 0.85 = 0.8925
			expect(result.emotion).toBe("happy");
			expect(result.pitch).toBe(0);
			expect(result.speed).toBeCloseTo(0.8925);
		});

		it("should use null emotion for non-emotion tags", () => {
			const result = extractMinimaxSettings(["温柔", "磁性"]);
			expect(result.emotion).toBeNull();
			expect(result.pitch).toBe(-3); // -1 + -2
			expect(result.speed).toBeCloseTo(0.855); // 0.95 * 0.9
		});

		it("should clamp pitch to [-10, 10]", () => {
			const result = extractMinimaxSettings(["震惊", "破音"]);
			// 震惊: pitch=5; 破音: pitch=5 -> total 10
			expect(result.pitch).toBe(10);
		});

		it("should clamp speed to [0.25, 4.0]", () => {
			const result = extractMinimaxSettings(["破音"]);
			// 破音: speed=1.25
			expect(result.speed).toBeLessThanOrEqual(4.0);
			expect(result.speed).toBeGreaterThanOrEqual(0.25);
		});
	});

	describe("filterMimoTags", () => {
		it("should return empty for undefined", () => {
			expect(filterMimoTags(undefined)).toEqual([]);
		});

		it("should return empty for empty array", () => {
			expect(filterMimoTags([])).toEqual([]);
		});

		it("should return all compatible tags", () => {
			const result = filterMimoTags(["开心", "悲伤", "东北话"]);
			expect(result).toEqual(["开心", "悲伤", "东北话"]);
		});
	});

	describe("detectAudioFormat", () => {
		it("should detect MP3 by magic bytes", () => {
			const bytes = new Uint8Array([0xff, 0xe0, 0x00]);
			const result = detectAudioFormat(bytes);
			expect(result.ext).toBe("mp3");
			expect(result.mimeType).toBe("audio/mpeg");
		});

		it("should detect MP3 with ID3 tag", () => {
			const bytes = new Uint8Array([0x49, 0x44, 0x33]);
			const result = detectAudioFormat(bytes);
			expect(result.ext).toBe("mp3");
		});

		it("should detect WAV by RIFF header", () => {
			const bytes = new Uint8Array([
				0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
			]);
			const result = detectAudioFormat(bytes);
			expect(result.ext).toBe("wav");
			expect(result.mimeType).toBe("audio/wav");
		});

		it("should default to wav for unknown format", () => {
			const bytes = new Uint8Array([0x00, 0x00, 0x00]);
			const result = detectAudioFormat(bytes);
			expect(result.ext).toBe("wav");
		});
	});
});
