"use client";

import { useLocale, useTranslations } from "next-intl";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

export type TagType = "interjection" | "pause";

export interface InlineTag {
	type: TagType;
	tag: string;
	label: string;
}

export const INTERJECTIONS: InlineTag[] = [
	{ type: "interjection", tag: "(laughs)", label: "笑声" },
	{ type: "interjection", tag: "(chuckle)", label: "轻笑" },
	{ type: "interjection", tag: "(sighs)", label: "叹气" },
	{ type: "interjection", tag: "(pant)", label: "喘气" },
	{ type: "interjection", tag: "(inhale)", label: "吸气" },
	{ type: "interjection", tag: "(coughs)", label: "咳嗽" },
	{ type: "interjection", tag: "(clear-throat)", label: "清嗓" },
	{ type: "interjection", tag: "(humming)", label: "哼唱" },
	{ type: "interjection", tag: "(sneezes)", label: "喷嚏" },
	{ type: "interjection", tag: "(lip-smacking)", label: "咂嘴" },
];

export const PAUSES: InlineTag[] = [
	{ type: "pause", tag: "<#0.5#>", label: "0.5s" },
	{ type: "pause", tag: "<#1#>", label: "1s" },
	{ type: "pause", tag: "<#1.5#>", label: "1.5s" },
	{ type: "pause", tag: "<#2#>", label: "2s" },
	{ type: "pause", tag: "<#3#>", label: "3s" },
];

export const MIMO_EMOTIONS: InlineTag[] = [
	{ type: "interjection", tag: "[crying]", label: "哭泣" },
	{ type: "interjection", tag: "[sighs]", label: "叹气" },
	{ type: "interjection", tag: "[sniffles]", label: "抽泣" },
	{ type: "interjection", tag: "[trembling]", label: "颤抖" },
	{ type: "interjection", tag: "[Angry]", label: "愤怒" },
	{ type: "interjection", tag: "[sternly]", label: "严厉" },
	{ type: "interjection", tag: "[commanding]", label: "命令" },
	{ type: "interjection", tag: "[wearily]", label: "疲惫" },
	{ type: "interjection", tag: "[whispering]", label: "低语" },
	{ type: "interjection", tag: "[clears throat]", label: "清嗓" },
	{ type: "interjection", tag: "[吸气]", label: "吸气" },
];

export const MIMO_PAUSES: InlineTag[] = [{ type: "pause", tag: "[pause]", label: "停顿" }];

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getChipStyles(type: TagType): string {
	if (type === "interjection") {
		return "background:rgba(147,51,234,0.1);color:rgb(147,51,234);border:1px solid rgba(147,51,234,0.25)";
	}
	return "background:rgba(59,130,246,0.1);color:rgb(59,130,246);border:1px solid rgba(59,130,246,0.25)";
}

const ALL_TAGS = [...INTERJECTIONS, ...PAUSES, ...MIMO_EMOTIONS, ...MIMO_PAUSES];

export const TAG_LABEL_I18N: Record<string, string> = {
	"(laughs)": "minimax.tags.laughs",
	"(chuckle)": "minimax.tags.chuckle",
	"(sighs)": "minimax.tags.sighs",
	"(pant)": "minimax.tags.pant",
	"(inhale)": "minimax.tags.inhale",
	"(coughs)": "minimax.tags.coughs",
	"(clear-throat)": "minimax.tags.clearThroat",
	"(humming)": "minimax.tags.humming",
	"(sneezes)": "minimax.tags.sneezes",
	"(lip-smacking)": "minimax.tags.lipSmacking",
	"<#0.5#>": "minimax.tags.pause05",
	"<#1#>": "minimax.tags.pause1",
	"<#1.5#>": "minimax.tags.pause15",
	"<#2#>": "minimax.tags.pause2",
	"<#3#>": "minimax.tags.pause3",
	"[crying]": "mimo.tags.crying",
	"[sighs]": "mimo.tags.sighs",
	"[sniffles]": "mimo.tags.sniffles",
	"[trembling]": "mimo.tags.trembling",
	"[Angry]": "mimo.tags.angry",
	"[sternly]": "mimo.tags.sternly",
	"[commanding]": "mimo.tags.commanding",
	"[wearily]": "mimo.tags.wearily",
	"[whispering]": "mimo.tags.whispering",
	"[clears throat]": "mimo.tags.clearsThroat",
	"[吸气]": "mimo.tags.inhale",
	"[pause]": "mimo.tags.pause",
};

type TFunction = (key: string) => string;

function createChipHtml(item: InlineTag, t?: TFunction): string {
	const styles = getChipStyles(item.type);
	const label = t ? t(TAG_LABEL_I18N[item.tag] ?? "") || item.label : item.label;
	return (
		`<span class="rte-chip" data-type="${item.type}" data-tag="${item.tag}" contenteditable="false" style="display:inline-flex;align-items:center;gap:2px;padding:1px 6px;border-radius:4px;font-size:12px;font-weight:500;margin:0 1px;cursor:default;user-select:none;vertical-align:baseline;${styles}">` +
		`${label}` +
		`<span class="rte-chip-x" contenteditable="false" style="display:none;align-items:center;justify-content:center;width:14px;height:14px;border-radius:50%;background:rgba(0,0,0,0.08);border:none;padding:0;margin-left:2px;cursor:pointer;font-size:10px;line-height:1;color:inherit">` +
		`×` +
		`</span>` +
		`</span>`
	);
}

function textToHtml(text: string, t?: TFunction): string {
	if (!text) return "";
	let html = text;
	for (const item of ALL_TAGS) {
		const regex = new RegExp(escapeRegex(item.tag), "g");
		html = html.replace(regex, createChipHtml(item, t));
	}
	return html;
}

function htmlToText(html: string): string {
	const div = document.createElement("div");
	div.innerHTML = html;
	let text = "";
	const walk = (node: Node) => {
		if (node.nodeType === Node.TEXT_NODE) {
			text += node.textContent || "";
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			const el = node as HTMLElement;
			if (el.classList.contains("rte-chip")) {
				text += el.getAttribute("data-tag") || "";
			} else {
				for (const child of Array.from(el.childNodes)) {
					walk(child);
				}
			}
		}
	};
	for (const child of Array.from(div.childNodes)) {
		walk(child);
	}
	return text;
}

function getTextOffsetAtCursor(editor: HTMLElement): number | null {
	const sel = window.getSelection();
	if (!sel || sel.rangeCount === 0) return null;
	const range = sel.getRangeAt(0);
	if (!editor.contains(range.startContainer)) return null;

	const preRange = document.createRange();
	preRange.selectNodeContents(editor);
	preRange.setEnd(range.startContainer, range.startOffset);

	const tmp = document.createElement("div");
	tmp.appendChild(preRange.cloneContents());
	return htmlToText(tmp.innerHTML).length;
}

function setCursorToOffset(editor: HTMLElement, targetOffset: number) {
	let offset = 0;

	function walk(node: Node): boolean {
		if (node.nodeType === Node.TEXT_NODE) {
			const len = (node.textContent || "").length;
			if (offset + len >= targetOffset) {
				const range = document.createRange();
				range.setStart(node, targetOffset - offset);
				range.collapse(true);
				const sel = window.getSelection();
				if (sel) {
					sel.removeAllRanges();
					sel.addRange(range);
				}
				return true;
			}
			offset += len;
			return false;
		}
		if (node.nodeType === Node.ELEMENT_NODE) {
			const el = node as HTMLElement;
			if (el.classList.contains("rte-chip")) {
				const tagLen = (el.getAttribute("data-tag") || "").length;
				if (offset + tagLen >= targetOffset) {
					const range = document.createRange();
					range.setStartAfter(el);
					range.collapse(true);
					const sel = window.getSelection();
					if (sel) {
						sel.removeAllRanges();
						sel.addRange(range);
					}
					return true;
				}
				offset += tagLen;
				return false;
			}
			for (const child of Array.from(el.childNodes)) {
				if (walk(child)) return true;
			}
		}
		return false;
	}

	for (const child of Array.from(editor.childNodes)) {
		if (walk(child)) return;
	}

	const range = document.createRange();
	range.selectNodeContents(editor);
	range.collapse(false);
	const sel = window.getSelection();
	if (sel) {
		sel.removeAllRanges();
		sel.addRange(range);
	}
}

export interface RichTextEditorRef {
	insertTag: (tag: string, label: string, type: TagType) => void;
	clearTags: () => void;
}

interface RichTextEditorProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	id?: string;
	minH?: string;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
	function RichTextEditor({ value, onChange, placeholder, className, id, minH }, ref) {
		const editorRef = useRef<HTMLDivElement>(null);
		const isInternalUpdate = useRef(false);
		const isComposing = useRef(false);
		const cursorOffsetRef = useRef<number | null>(null);
		const _locale = useLocale();
		const t = useTranslations("tts");

		const doInsertTag = useCallback(
			(tag: string) => {
				const editor = editorRef.current;
				if (!editor) return;

				const cursorOffset = getTextOffsetAtCursor(editor);
				const insertAt = cursorOffset !== null ? cursorOffset : value.length;
				const newValue = `${value.slice(0, insertAt) + tag} ${value.slice(insertAt)}`;

				isInternalUpdate.current = false;
				cursorOffsetRef.current = insertAt + tag.length + 1;
				onChange(newValue);
			},
			[value, onChange],
		);

		useImperativeHandle(
			ref,
			() => ({
				insertTag: (tag: string) => {
					doInsertTag(tag);
				},
				clearTags: () => {
					onChange("");
				},
			}),
			[doInsertTag, onChange],
		);

		useEffect(() => {
			if (editorRef.current && !isInternalUpdate.current) {
				const newHtml = textToHtml(value, t);
				if (editorRef.current.innerHTML !== newHtml) {
					editorRef.current.innerHTML = newHtml;
				}
				if (cursorOffsetRef.current !== null) {
					setCursorToOffset(editorRef.current, cursorOffsetRef.current);
					cursorOffsetRef.current = null;
				}
			}
		}, [value, t]);

		const handleInput = useCallback(() => {
			if (isComposing.current) return;
			if (editorRef.current) {
				isInternalUpdate.current = true;
				onChange(htmlToText(editorRef.current.innerHTML));
				setTimeout(() => {
					isInternalUpdate.current = false;
				}, 100);
			}
		}, [onChange]);

		const handleCompositionStart = useCallback(() => {
			isComposing.current = true;
		}, []);

		const handleCompositionEnd = useCallback(() => {
			isComposing.current = false;
			requestAnimationFrame(() => {
				handleInput();
			});
		}, [handleInput]);

		const handlePaste = useCallback(
			(e: React.ClipboardEvent) => {
				e.preventDefault();
				const plain = e.clipboardData.getData("text/plain");
				const editor = editorRef.current;
				if (!editor) return;

				const cursorOffset = getTextOffsetAtCursor(editor);
				const insertAt = cursorOffset !== null ? cursorOffset : value.length;
				const newValue = value.slice(0, insertAt) + plain + value.slice(insertAt);

				isInternalUpdate.current = false;
				cursorOffsetRef.current = insertAt + plain.length;
				onChange(newValue);
			},
			[value, onChange],
		);

		const handleMouseDown = useCallback(
			(e: React.MouseEvent) => {
				const target = e.target as HTMLElement;
				if (target.classList.contains("rte-chip-x")) {
					e.preventDefault();
					e.stopPropagation();
					const chip = target.closest(".rte-chip") as HTMLElement | null;
					if (chip && editorRef.current) {
						const tag = chip.getAttribute("data-tag");
						if (tag) {
							const preRange = document.createRange();
							preRange.selectNodeContents(editorRef.current);
							preRange.setEndBefore(chip);
							const tmp = document.createElement("div");
							tmp.appendChild(preRange.cloneContents());
							const offset = htmlToText(tmp.innerHTML).length;

							let removeLen = tag.length;
							if (value.slice(offset + tag.length, offset + tag.length + 1) === " ") {
								removeLen += 1;
							}
							isInternalUpdate.current = false;
							onChange(value.slice(0, offset) + value.slice(offset + removeLen));
						}
					}
				}
			},
			[value, onChange],
		);

		const minHClass = minH || "min-h-[35vh]";

		const _ToolbarButton = ({ item, t }: { item: InlineTag; t?: TFunction }) => {
			const styles =
				item.type === "interjection"
					? "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-800/30"
					: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/30";
			const label = t ? t(TAG_LABEL_I18N[item.tag] ?? "") || item.label : item.label;

			return (
				<button
					type="button"
					onMouseDown={(e) => {
						e.preventDefault();
						e.stopPropagation();
					}}
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						editorRef.current?.focus();
						doInsertTag(item.tag);
					}}
					className={`text-xs px-2 py-0.5 rounded-md border cursor-pointer hover:opacity-80 transition-opacity ${styles}`}
				>
					{label}
				</button>
			);
		};

		return (
			<div className={className}>
				<style>{`.rte-chip:hover .rte-chip-x { display: flex !important; }`}</style>
				{/* biome-ignore lint/a11y/noStaticElementInteractions: contentEditable div is interactive */}
				<div
					ref={editorRef}
					id={id}
					contentEditable
					dir="auto"
					className={`w-full ${minHClass} p-3 text-base border-2 border-violet-100 dark:border-violet-900/50 rounded-xl bg-gradient-to-br from-white/80 to-violet-50/30 dark:from-gray-900/80 dark:to-violet-900/10 focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100/50 dark:focus:ring-violet-900/20 overflow-y-auto empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none`}
					onInput={handleInput}
					onCompositionStart={handleCompositionStart}
					onCompositionEnd={handleCompositionEnd}
					onPaste={handlePaste}
					onMouseDown={handleMouseDown}
					onKeyDown={() => {}}
					data-placeholder={placeholder}
					suppressContentEditableWarning
				/>
			</div>
		);
	},
);
