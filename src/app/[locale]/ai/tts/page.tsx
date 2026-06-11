import { Navigation } from "@/components/front/layout";
import TtsApp from "@/components/front/tts/tts-app";

export async function generateMetadata({
	params: paramsPromise,
}: {
	params: Promise<{ locale: "zh" | "en" }>;
}) {
	const { locale } = await paramsPromise;
	const titles = {
		zh: "AI 文字转语音",
		en: "AI Text to Speech",
	};
	const descriptions = {
		zh: "将文字转换为自然流畅的语音，支持多种音色和情感控制",
		en: "Convert text to natural speech with multiple voices and emotional control",
	};
	return {
		title: titles[locale],
		description: descriptions[locale],
	};
}

export default function TtsPage() {
	return (
		<div className="flex flex-col min-h-dvh">
			<Navigation />
			<div className="flex-1 min-h-0">
				<TtsApp />
			</div>
		</div>
	);
}
