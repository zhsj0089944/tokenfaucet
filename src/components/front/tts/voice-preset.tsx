"use client";

import { Crown, Sparkles, Wand2 } from "lucide-react";
import type { useTranslations } from "next-intl";

type Props = {
	presetVoice: string;
	setPresetVoice: (id: string) => void;
	t: ReturnType<typeof useTranslations>;
	isLocked?: (voiceId: string) => boolean;
	isMember?: boolean;
};

const SITE_PRESET_VOICES = [
	{
		id: "sister_warm",
		nameKey: "voices.sisterWarm",
		langKey: "voices.chinese",
		genderKey: "voices.female",
	},
	{
		id: "magnetic_radio",
		nameKey: "voices.magneticRadio",
		langKey: "voices.chinese",
		genderKey: "voices.male",
	},
	{
		id: "lively_girl",
		nameKey: "voices.livelyGirl",
		langKey: "voices.chinese",
		genderKey: "voices.female",
	},
	{
		id: "cool_queen",
		nameKey: "voices.coolQueen",
		langKey: "voices.chinese",
		genderKey: "voices.female",
	},
	{
		id: "business_elite",
		nameKey: "voices.businessElite",
		langKey: "voices.chinese",
		genderKey: "voices.male",
	},
	{
		id: "english_lady",
		nameKey: "voices.englishLady",
		langKey: "voices.english",
		genderKey: "voices.female",
		subscriptionOnly: true,
	},
	{
		id: "english_gentleman",
		nameKey: "voices.englishGentleman",
		langKey: "voices.english",
		genderKey: "voices.male",
		subscriptionOnly: true,
	},
];

export function VoicePreset({ presetVoice, setPresetVoice, t, isLocked }: Props) {
	return (
		<div className="space-y-2">
			<div className="flex items-center gap-1.5 px-0.5">
				<div className="flex items-center justify-center w-5 h-5 rounded-md bg-violet-100 dark:bg-violet-900/30">
					<Sparkles className="h-3 w-3 text-violet-500" />
				</div>
				<span className="text-[11px] font-semibold text-violet-700 dark:text-violet-300">
					{t("voices.voiceCharacter")}
				</span>
			</div>

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
					<button
						type="button"
						onClick={() => setPresetVoice("")}
						className={`shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl border-2 min-w-[90px] transition-all duration-200 ${
							!presetVoice
								? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 shadow-sm"
								: "border-muted/40 bg-card hover:border-muted-foreground/25"
						}`}
					>
						<div
							className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
								!presetVoice
									? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md"
									: "bg-muted text-muted-foreground"
							}`}
						>
							<Wand2 className="h-4 w-4" />
						</div>
						<span className="text-[11px] font-semibold leading-tight">{t("voices.auto")}</span>
					</button>

					{SITE_PRESET_VOICES.map((v) => {
						const locked = isLocked?.(v.id) ?? false;
						const selected = presetVoice === v.id;
						const showCrown = v.subscriptionOnly;
						return (
							<button
								type="button"
								key={v.id}
								onClick={() => !locked && setPresetVoice(v.id)}
								className={`shrink-0 relative flex flex-col items-center gap-1 p-2 rounded-xl border-2 min-w-[90px] transition-all duration-200 ${
									locked
										? "border-muted/30 bg-muted/20 opacity-40 cursor-not-allowed"
										: selected
											? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 shadow-sm"
											: "border-muted/40 bg-card hover:border-muted-foreground/25"
								}`}
							>
								{showCrown && (
									<div className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full shadow-sm">
										<Crown className="h-2.5 w-2.5" />
									</div>
								)}
								<div
									className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
										selected
											? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md"
											: "bg-muted text-muted-foreground"
									}`}
								>
									<Sparkles className="h-4 w-4" />
								</div>
								<span className="text-[11px] font-semibold leading-tight">{t(v.nameKey)}</span>
								<span className="text-[10px] text-muted-foreground leading-none">
									{t(v.genderKey)}
								</span>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
