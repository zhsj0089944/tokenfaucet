import type { ReactNode } from "react";

type Props = {
	children: ReactNode;
};

export default async function Layout({ children }: Props) {
	// Docs feature is temporarily disabled
	return <>{children}</>;
}
