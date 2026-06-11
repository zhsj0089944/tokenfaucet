"use client";

import { Crown, Globe, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FEATURE_KEY_MAP, type ModelMode, type TtsProvider } from "./tts-app-constants";

interface ProviderSelectorProps {
	modelMode: ModelMode;
	providers: TtsProvider[];
	activeProvider: string;
	hasActiveMembership: boolean;
	t: (key: string) => string;
	onProviderChange: (provider: string) => void;
}

export function ProviderSelector({
	modelMode,
	providers,
	activeProvider,
	hasActiveMembership,
	t,
	onProviderChange,
}: ProviderSelectorProps) {
	const providerList =
		modelMode === "design" || modelMode === "clone"
			? [
					{
						id: "mimo" as const,
						name: providers.find((p) => p.id === "mimo")?.name || "MiMo",
						subscriptionRequired:
							providers.find((p) => p.id === "mimo")?.subscriptionRequired ?? false,
						features: providers.find((p) => p.id === "mimo")?.features || [
							"styleControl",
							"audioTags",
							"chars10000",
						],
					},
				]
			: [
					{
						id: "mimo" as const,
						name: providers.find((p) => p.id === "mimo")?.name || "MiMo",
						subscriptionRequired:
							providers.find((p) => p.id === "mimo")?.subscriptionRequired ?? false,
						features: providers.find((p) => p.id === "mimo")?.features || [
							"styleControl",
							"audioTags",
							"chars10000",
						],
					},
					{
						id: "minimax" as const,
						name: providers.find((p) => p.id === "minimax")?.name || "MiniMax",
						subscriptionRequired:
							providers.find((p) => p.id === "minimax")?.subscriptionRequired ?? true,
						features: providers.find((p) => p.id === "minimax")?.features || [
							"multiLanguage",
							"multiVoice",
							"chars10000",
						],
					},
				];

	return (
		<Card className="shrink-0 overflow-hidden card-modern">
			<CardContent className="p-1.5">
				<div
					className={
						modelMode === "design" || modelMode === "clone"
							? "grid grid-cols-1 gap-1.5"
							: "grid grid-cols-2 gap-3"
					}
				>
					{providerList.map((p, idx) => {
						const isSelected = activeProvider === p.id;
						const isLocked = p.subscriptionRequired && !hasActiveMembership;

						return (
							<button
								type="button"
								key={p.id}
								className={`touch-active relative p-2.5 rounded-xl border-2 cursor-pointer transition-colors transition-shadow duration-300 ease-out overflow-hidden ${
									isSelected
										? "border-primary/50 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg shadow-primary/20"
										: isLocked
											? "border-muted/30 bg-gradient-to-br from-muted/20 to-muted/5 opacity-50 cursor-not-allowed"
											: "border-border/50 bg-gradient-to-br from-background to-muted/20 hover:border-primary/30 hover:shadow-md hover:shadow-primary/10 hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent"
								}`}
								onClick={() => {
									if (isLocked) return;
									if (p.id === "minimax" && (modelMode === "design" || modelMode === "clone")) {
										return;
									}
									onProviderChange(p.id);
								}}
								style={{ animationDelay: `${idx * 100}ms` }}
							>
								{p.subscriptionRequired && (
									<div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 text-amber-700 dark:text-amber-300 text-[9px] rounded-full shadow-sm">
										<Crown className="h-2 w-2" />
										<span>{t("providers.subscriptionOnly")}</span>
									</div>
								)}

								{isSelected && !isLocked && (
									<div className="absolute top-1.5 right-1.5 flex items-center justify-center w-5 h-5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full shadow-lg shadow-primary/30 animate-bounce-in">
										<Sparkles className="h-2.5 w-2.5" />
									</div>
								)}

								<div className="flex items-center gap-2.5">
									<div
										className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 transition-colors transition-shadow duration-300 ${
											p.id === "minimax"
												? "bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-lg shadow-blue-500/30"
												: "bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 shadow-lg shadow-orange-500/30"
										} ${isSelected ? "ring-4 ring-primary/20" : ""}`}
									>
										{p.id === "minimax" ? (
											<Globe className="h-4 w-4 text-white" />
										) : (
											<Sparkles className="h-4 w-4 text-white" />
										)}
									</div>

									<div className="min-w-0 flex-1">
										<h3 className="font-bold text-xs">{p.name}</h3>
										<div className="flex flex-wrap gap-1 mt-1">
											{p.features?.slice(0, 3).map((f) => (
												<span
													key={f}
													className={`text-[9px] px-1.5 py-0.5 rounded-md transition-colors ${
														isSelected
															? "bg-primary/10 text-primary/80"
															: "bg-muted/50 text-muted-foreground/70"
													}`}
												>
													{t(`providers.${FEATURE_KEY_MAP[f] || f}`)}
												</span>
											))}
										</div>
									</div>
								</div>

								{isSelected && !isLocked && (
									<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
								)}
							</button>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
