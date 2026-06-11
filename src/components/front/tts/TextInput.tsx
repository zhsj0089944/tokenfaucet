"use client";

import { Clock, Laugh, Sparkles } from "lucide-react";
import { type RefObject, useId } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	INTERJECTIONS,
	MIMO_EMOTIONS,
	MIMO_PAUSES,
	PAUSES,
	RichTextEditor,
	type RichTextEditorRef,
	TAG_LABEL_I18N,
} from "./rich-text-editor";

interface TextInputProps {
	text: string;
	onTextChange: (text: string) => void;
	activeProvider: string;
	modelMode: string;
	maxChars: number;
	estimatedPoints: number;
	t: (key: string) => string;
	richTextEditorRef: RefObject<RichTextEditorRef | null>;
}

export function TextInput({
	text,
	onTextChange,
	activeProvider,
	modelMode,
	maxChars,
	estimatedPoints,
	t,
	richTextEditorRef,
}: TextInputProps) {
	const editorId = useId();

	return (
		<Card className="shrink-0 overflow-hidden animate-fade-float card-modern">
			<CardContent className="pt-4 pb-4 flex flex-col gap-3">
				<div className="space-y-2 flex flex-col min-h-0">
					<div className="flex items-center gap-2 text-sm font-medium shrink-0 flex-wrap sm:flex-nowrap">
						<div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-400 shrink-0">
							<Sparkles className="h-3.5 w-3.5" />
						</div>
						<span className="text-xs sm:text-sm">{t("input.label")}</span>
						<span className="text-[10px] sm:text-xs text-muted-foreground/70 font-normal hidden sm:inline">
							{t("input.hint")}
						</span>
						<div className="flex-1 min-w-[4px]" />
						{activeProvider === "minimax" && (
							<>
								<Popover>
									<PopoverTrigger asChild>
										<button
											type="button"
											className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-medium rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/30 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors cursor-pointer"
										>
											<Laugh className="h-3 w-3" />
											<span className="hidden sm:inline">
												{t("minimax.interjections") || "语气词"}
											</span>
										</button>
									</PopoverTrigger>
									<PopoverContent align="end" className="w-auto p-2 max-w-[280px] sm:max-w-none">
										<div className="flex flex-wrap gap-1">
											{INTERJECTIONS.map((item) => (
												<button
													key={item.tag}
													type="button"
													onPointerDown={(e) => e.preventDefault()}
													onClick={() => {
														richTextEditorRef.current?.insertTag(item.tag, item.label, item.type);
													}}
													className="text-xs px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200/50 dark:border-purple-800/30 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 hover:shadow-sm"
												>
													{t(TAG_LABEL_I18N[item.tag] ?? "") || item.label}
												</button>
											))}
										</div>
									</PopoverContent>
								</Popover>
								<Popover>
									<PopoverTrigger asChild>
										<button
											type="button"
											className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-medium rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/30 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
										>
											<Clock className="h-3 w-3" />
											<span className="hidden sm:inline">{t("minimax.pause") || "停顿"}</span>
										</button>
									</PopoverTrigger>
									<PopoverContent align="end" className="w-auto p-2 max-w-[280px] sm:max-w-none">
										<div className="flex gap-1">
											{PAUSES.map((item) => (
												<button
													key={item.tag}
													type="button"
													onPointerDown={(e) => e.preventDefault()}
													onClick={() => {
														richTextEditorRef.current?.insertTag(item.tag, item.label, item.type);
													}}
													className="text-xs px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/50 dark:border-blue-800/30 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 hover:shadow-sm"
												>
													{t(TAG_LABEL_I18N[item.tag] ?? "") || item.label}
												</button>
											))}
										</div>
									</PopoverContent>
								</Popover>
							</>
						)}
						{activeProvider === "mimo" && (
							<>
								<Popover>
									<PopoverTrigger asChild>
										<button
											type="button"
											className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-medium rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/30 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors cursor-pointer"
										>
											<Laugh className="h-3 w-3" />
											<span className="hidden sm:inline">{t("mimo.emotions") || "情感"}</span>
										</button>
									</PopoverTrigger>
									<PopoverContent align="end" className="w-auto p-2 max-w-[280px] sm:max-w-none">
										<div className="flex flex-wrap gap-1">
											{MIMO_EMOTIONS.map((item) => (
												<button
													key={item.tag}
													type="button"
													onPointerDown={(e) => e.preventDefault()}
													onClick={() => {
														richTextEditorRef.current?.insertTag(item.tag, item.label, item.type);
													}}
													className="text-xs px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200/50 dark:border-purple-800/30 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 hover:shadow-sm"
												>
													{t(TAG_LABEL_I18N[item.tag] ?? "") || item.label}
												</button>
											))}
										</div>
									</PopoverContent>
								</Popover>
								<Popover>
									<PopoverTrigger asChild>
										<button
											type="button"
											className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-medium rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/30 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
										>
											<Clock className="h-3 w-3" />
											<span className="hidden sm:inline">{t("mimo.pause") || "停顿"}</span>
										</button>
									</PopoverTrigger>
									<PopoverContent align="end" className="w-auto p-2 max-w-[280px] sm:max-w-none">
										<div className="flex gap-1">
											{MIMO_PAUSES.map((item) => (
												<button
													key={item.tag}
													type="button"
													onPointerDown={(e) => e.preventDefault()}
													onClick={() => {
														richTextEditorRef.current?.insertTag(item.tag, item.label, item.type);
													}}
													className="text-xs px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/50 dark:border-blue-800/30 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 hover:shadow-sm"
												>
													{t(TAG_LABEL_I18N[item.tag] ?? "") || item.label}
												</button>
											))}
										</div>
									</PopoverContent>
								</Popover>
							</>
						)}
					</div>
					<RichTextEditor
						ref={richTextEditorRef}
						id={editorId}
						value={text}
						onChange={onTextChange}
						placeholder={t("input.placeholder")}
						minH={
							modelMode === "clone"
								? "min-h-[15vh] max-h-[15vh] sm:min-h-[18vh] sm:max-h-[18vh]"
								: "min-h-[25vh] sm:min-h-[35vh]"
						}
						className="flex-1 min-h-0"
					/>
					<div className="flex flex-wrap items-center justify-between shrink-0 p-2 rounded-xl bg-violet-50/50 dark:bg-violet-900/20 border border-violet-100/50 dark:border-violet-800/30 gap-1">
						<span className="text-[10px] sm:text-xs text-violet-600/70 dark:text-violet-400/70">
							{t("preview.hint")}
						</span>
						<span
							className={`text-[10px] sm:text-xs font-medium ${text.length > maxChars ? "text-red-500" : "text-violet-600/70 dark:text-violet-400/70"}`}
						>
							{text.length} / {maxChars}
							{text.length > 0 && (
								<span className="ml-1 sm:ml-2 text-violet-500 dark:text-violet-400 bg-violet-100/50 dark:bg-violet-900/50 px-1 sm:px-1.5 py-0.5 rounded whitespace-nowrap">
									≈ {estimatedPoints} {t("input.points")}
								</span>
							)}
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
