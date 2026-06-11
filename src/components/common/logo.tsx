"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useSiteConfig } from "@/hooks/use-site-config";

interface LogoProps {
	withLink?: boolean;
	className?: string;
}

export const Logo = ({ withLink = true, className = "flex items-center gap-2" }: LogoProps) => {
	const _t = useTranslations("app");
	const locale = useLocale();
	const { isLoading } = useSiteConfig();
	const [imgError, setImgError] = useState(false);

	// 导航栏显示固定短名称，不从配置读取
	const displayName = isLoading ? "" : "TokenFaucet";

	const logoContent = (
		<>
			{imgError ? (
				<div className="w-10 h-10 rounded bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
					T
				</div>
			) : (
				<Image
					src="/weblogo.png"
					alt="logo"
					width={40}
					height={40}
					className="rounded"
					onError={() => setImgError(true)}
				/>
			)}
			<span className="text-lg font-semibold">{displayName}</span>
		</>
	);

	if (withLink) {
		return (
			<Link href={`/${locale}/`} className={className}>
				{logoContent}
			</Link>
		);
	}

	return <div className={className}>{logoContent}</div>;
};

export default Logo;
