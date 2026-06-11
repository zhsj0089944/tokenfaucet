import { notFound, redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import { defaultLocale, locales } from "@/translate/i18n/config";

interface CatchAllPageProps {
	params: Promise<{ slug?: string[] }>;
}

export default async function CatchAllPage({ params }: CatchAllPageProps) {
	const { slug = [] } = await params;
	const segments = slug.filter(Boolean);
	logger.debug("CatchAllPage segments", { segments });

	// 排除不需要国际化的路径（api 由 Next.js API routes 优先处理）
	const excludedPaths = ["api"];
	const firstSegment = segments[0];

	if (firstSegment && excludedPaths.includes(firstSegment)) {
		notFound();
	}

	// 如果路径已经包含支持的语言前缀，直接重定向到原路径，避免重复拼接
	if (firstSegment && locales.includes(firstSegment as (typeof locales)[number])) {
		notFound();
	}

	const targetPath = segments.length
		? `/${defaultLocale}/${segments.join("/")}`
		: `/${defaultLocale}`;
	redirect(targetPath);
}
