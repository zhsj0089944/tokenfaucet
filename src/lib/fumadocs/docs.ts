import { loader } from "fumadocs-core/source";
import type { TOCItemType } from "fumadocs-core/toc";
import type { MDXContent } from "mdx/types";
import { cache } from "react";

// Minimal stub - matching fumadocs-core interface
const emptyDocs = {
	getPageMap() {
		return {};
	},
	getPages() {
		return [];
	},
	getPage(_slug: string[]) {
		return undefined;
	},
	getMeta() {
		return {};
	},
};

export const docsSource = loader({
	baseUrl: "/docs",
	source: emptyDocs as unknown as Parameters<typeof loader>[0]["source"],
});

export type DocsMeta = Record<string, unknown>;
export type DocsPage = undefined;

export interface MDXPageData {
	title?: string;
	description?: string;
	body: MDXContent;
	toc: TOCItemType[];
	structuredData: Record<string, unknown>;
	_exports: Record<string, unknown>;
}

export const getDocsPages = cache((): DocsPage[] => {
	return [];
});

export const getDocsPage = cache((_slug: string[]): DocsPage | undefined => {
	return undefined;
});
