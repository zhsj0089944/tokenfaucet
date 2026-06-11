"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type TurnstileStatus = "loading" | "ready" | "completed" | "error";

export interface TurnstileRef {
	getToken: () => string;
	getStatus: () => TurnstileStatus;
	waitForToken: (timeoutMs?: number) => Promise<string>;
	reset: () => void;
}

interface TurnstileProps {
	siteKey: string;
	onVerify?: (token: string) => void;
	onReady?: () => void;
	onError?: () => void;
	onExpire?: () => void;
	theme?: "light" | "dark" | "auto";
	className?: string;
	ref?: React.Ref<TurnstileRef>;
}

const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;

let scriptLoadingPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
	if (typeof window === "undefined") return Promise.resolve();
	if (window.turnstile) return Promise.resolve();
	if (scriptLoadingPromise) return scriptLoadingPromise;

	scriptLoadingPromise = new Promise<void>((resolve, reject) => {
		const existing = document.getElementById("turnstile-script") as HTMLScriptElement | null;
		if (existing) {
			if (window.turnstile) {
				resolve();
				return;
			}
			existing.addEventListener("load", () => {
				if (window.turnstile) resolve();
				else reject(new Error("turnstile not available after script load"));
			});
			existing.addEventListener("error", () => reject(new Error("Script load failed")));
			return;
		}

		const script = document.createElement("script");
		script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
		script.id = "turnstile-script";
		script.async = true;
		script.defer = true;

		script.addEventListener("load", () => {
			if (window.turnstile) resolve();
			else reject(new Error("turnstile not available after script load"));
		});
		script.addEventListener("error", () => reject(new Error("Script load failed")));

		document.head.appendChild(script);
	});

	return scriptLoadingPromise;
}

export function Turnstile({
	siteKey,
	onVerify,
	onReady,
	onError,
	onExpire,
	theme = "auto",
	className = "",
	ref,
}: TurnstileProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetIdRef = useRef<string | null>(null);
	const [status, setStatus] = useState<TurnstileStatus>("loading");

	const callbackRefs = useRef({ onVerify, onReady, onError, onExpire });
	callbackRefs.current = { onVerify, onReady, onError, onExpire };

	const tokenRef = useRef("");
	const statusRef = useRef<TurnstileStatus>("loading");
	const tokenWaitersRef = useRef<
		Array<{ resolve: (token: string) => void; reject: (reason: string) => void }>
	>([]);

	const notifyWaiters = useCallback((token: string, errorReason?: string) => {
		const waiters = tokenWaitersRef.current;
		tokenWaitersRef.current = [];
		for (const waiter of waiters) {
			if (errorReason) {
				waiter.reject(errorReason);
			} else {
				waiter.resolve(token);
			}
		}
	}, []);

	const waitForToken = useCallback((timeoutMs = 5000): Promise<string> => {
		const currentToken = tokenRef.current;
		const currentStatus = statusRef.current;

		if (currentStatus === "completed" && currentToken) {
			return Promise.resolve(currentToken);
		}

		if (currentStatus === "error") {
			return Promise.reject(new Error("error"));
		}

		const effectiveTimeout = currentStatus === "loading" ? Math.min(timeoutMs, 3000) : timeoutMs;

		return new Promise<string>((resolve, reject) => {
			const wrapped = {
				resolve: (token: string) => {
					clearTimeout(timer);
					resolve(token);
				},
				reject: (reason: string) => {
					clearTimeout(timer);
					reject(new Error(reason));
				},
			};

			const timer = setTimeout(() => {
				const idx = tokenWaitersRef.current.indexOf(wrapped);
				if (idx !== -1) tokenWaitersRef.current.splice(idx, 1);
				reject(new Error("timeout"));
			}, effectiveTimeout);

			tokenWaitersRef.current.push(wrapped);
		});
	}, []);

	const resetWidget = useCallback(() => {
		tokenRef.current = "";
		statusRef.current = "loading";
		setStatus("loading");
		notifyWaiters("", "reset");
		if (widgetIdRef.current && window.turnstile) {
			try {
				window.turnstile.reset(widgetIdRef.current);
			} catch {}
		}
	}, [notifyWaiters]);

	useEffect(() => {
		if (ref) {
			const handle: TurnstileRef = {
				getToken: () => tokenRef.current,
				getStatus: () => statusRef.current,
				waitForToken,
				reset: resetWidget,
			};
			if (typeof ref === "function") {
				ref(handle);
			} else {
				(ref as React.MutableRefObject<TurnstileRef | null>).current = handle;
			}
		}
	}, [ref, resetWidget, waitForToken]);

	useEffect(() => {
		if (!siteKey || typeof window === "undefined") return;

		statusRef.current = "loading";
		setStatus("loading");

		let widgetId: string | null = null;
		let cancelled = false;
		let retryTimeout: ReturnType<typeof setTimeout> | null = null;

		const renderWidget = () => {
			if (cancelled || !containerRef.current || !window.turnstile) {
				return;
			}

			try {
				const id = window.turnstile.render(containerRef.current, {
					sitekey: siteKey,
					theme,
					size: "flexible",
					appearance: "always",
					execution: "render",
					refreshExpired: "auto",
					callback: (token: string) => {
						if (!cancelled) {
							tokenRef.current = token;
							statusRef.current = "completed";
							setStatus("completed");
							callbackRefs.current.onVerify?.(token);
							notifyWaiters(token);
						}
					},
					"error-callback": () => {
						if (!cancelled) {
							tokenRef.current = "";
							statusRef.current = "error";
							setStatus("error");
							callbackRefs.current.onError?.();
							notifyWaiters("", "error");
						}
					},
					"expired-callback": () => {
						if (!cancelled) {
							tokenRef.current = "";
							statusRef.current = "ready";
							setStatus("ready");
							callbackRefs.current.onExpire?.();
						}
					},
				});

				if (id) {
					widgetId = id;
					widgetIdRef.current = id;
					if (!cancelled) {
						statusRef.current = "ready";
						setStatus("ready");
						callbackRefs.current.onReady?.();
					}
				} else {
					if (!cancelled) scheduleRetry();
				}
			} catch {
				if (!cancelled) scheduleRetry();
			}
		};

		const scheduleRetry = (attempt = 0) => {
			if (cancelled || attempt >= MAX_RETRIES) {
				if (!cancelled) {
					statusRef.current = "error";
					setStatus("error");
					callbackRefs.current.onError?.();
				}
				return;
			}
			retryTimeout = setTimeout(() => {
				if (cancelled) return;
				if (window.turnstile && containerRef.current) {
					renderWidget();
				} else {
					scheduleRetry(attempt + 1);
				}
			}, RETRY_DELAY);
		};

		const init = async () => {
			try {
				await loadTurnstileScript();
				if (cancelled) return;
				renderWidget();
			} catch {
				if (!cancelled) {
					statusRef.current = "error";
					setStatus("error");
					callbackRefs.current.onError?.();
				}
			}
		};

		init();

		return () => {
			cancelled = true;
			if (retryTimeout) clearTimeout(retryTimeout);
			if (widgetId && window.turnstile) {
				try {
					window.turnstile.remove(widgetId);
				} catch {}
			}
			widgetIdRef.current = null;
		};
	}, [siteKey, theme, notifyWaiters]);

	return (
		<div className={className}>
			<div ref={containerRef} />
			{status === "loading" && (
				<div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
					<svg
						aria-hidden="true"
						className="animate-spin h-3 w-3"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						/>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
					<span>Loading security verification...</span>
				</div>
			)}
			{status === "error" && (
				<div className="text-xs text-amber-600 mt-1">
					Security verification unavailable. You can still proceed.
				</div>
			)}
		</div>
	);
}

declare global {
	interface Window {
		turnstile?: {
			render: (container: Element | string, options: Record<string, unknown>) => string;
			remove: (widgetId: string) => void;
			reset: (widgetId: string) => void;
		};
	}
}
