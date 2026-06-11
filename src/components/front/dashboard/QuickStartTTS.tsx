"use client";

import { ArrowRight, Mic, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function QuickStartTTS() {
	const pathname = usePathname();
	const locale = pathname.split("/")[1] || "zh";

	return (
		<Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 hover:shadow-lg transition-colors transition-shadow">
			<CardContent className="p-6">
				<div className="flex flex-col md:flex-row items-center justify-between gap-4">
					<div className="flex items-center gap-4">
						<div className="p-3 bg-primary/20 rounded-full">
							<Mic className="h-8 w-8 text-primary" />
						</div>
						<div>
							<h3 className="text-lg font-semibold flex items-center gap-2">
								开始使用 TTS
								<Sparkles className="h-4 w-4 text-yellow-500" />
							</h3>
							<p className="text-sm text-muted-foreground">
								将文字转换为自然流畅的语音，支持多种音色和语言
							</p>
						</div>
					</div>

					<Button asChild size="lg" className="gap-2">
						<Link href={`/${locale}/ai/tts`}>
							立即开始
							<ArrowRight className="h-4 w-4" />
						</Link>
					</Button>
				</div>

				<div className="mt-4 grid grid-cols-3 gap-4 text-center">
					<div className="p-2 bg-background/50 rounded-lg">
						<p className="text-2xl font-bold text-primary">50+</p>
						<p className="text-xs text-muted-foreground">音色选择</p>
					</div>
					<div className="p-2 bg-background/50 rounded-lg">
						<p className="text-2xl font-bold text-primary">10+</p>
						<p className="text-xs text-muted-foreground">支持语言</p>
					</div>
					<div className="p-2 bg-background/50 rounded-lg">
						<p className="text-2xl font-bold text-primary">HD</p>
						<p className="text-xs text-muted-foreground">高清音质</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
