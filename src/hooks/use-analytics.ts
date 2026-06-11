"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { trackPageView, trackUserAction } from "@/components/front/analytics/google-analytics";

// 页面视图跟踪Hook
export function usePageTracking() {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// 使用 useCallback 稳定 trackPageView 引用，避免依赖警告
	const trackCurrentPage = useCallback(() => {
		if (pathname) {
			const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
			trackPageView(url, document.title);
		}
	}, [pathname, searchParams]);

	useEffect(() => {
		trackCurrentPage();
	}, [trackCurrentPage]);
}

// 用户行为跟踪Hook
export function useUserTracking() {
	return {
		// 页面相关
		trackPageView: (url: string, title?: string) => {
			trackPageView(url, title);
		},

		// 用户行为
		trackSignUp: (method = "email") => {
			trackUserAction.signUp(method);
		},

		trackLogin: (method = "email") => {
			trackUserAction.login(method);
		},

		trackContentView: (contentType: string, contentId: string) => {
			trackUserAction.viewContent(contentType, contentId);
		},

		trackSearch: (searchTerm: string) => {
			trackUserAction.search(searchTerm);
		},

		trackDownload: (fileName: string) => {
			trackUserAction.download(fileName);
		},

		trackShare: (method: string, contentType: string) => {
			trackUserAction.share(method, contentType);
		},

		trackSubscribe: (planName: string) => {
			trackUserAction.subscribe(planName);
		},

		trackTutorialStart: (tutorialId: string) => {
			trackUserAction.startTutorial(tutorialId);
		},

		trackTutorialComplete: (tutorialId: string) => {
			trackUserAction.completeTutorial(tutorialId);
		},
	};
}
