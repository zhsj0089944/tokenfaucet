import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface Props {
	params: Promise<{
		locale: string;
		slug?: string[];
	}>;
}

export default async function Page({ params: _params }: Props) {
	// Docs feature is temporarily disabled
	notFound();
}

export async function generateStaticParams() {
	return [];
}

export async function generateMetadata({ params: _params }: Props): Promise<Metadata> {
	return {
		title: "Docs",
		description: "Documentation",
	};
}
