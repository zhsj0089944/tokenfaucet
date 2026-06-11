import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { appRouter } from "@/server/root";
import { createTRPCContext } from "@/server/server";

const handler = (req: NextRequest) =>
	fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: () => createTRPCContext({ req }),
		onError: ({ path, error }) => {
			if (process.env.NODE_ENV === "development") {
				logger.error(`tRPC failed on ${path ?? "<no-path>"}: ${error.message}`);
			} else {
				// 生产环境也记录错误，便于排查（但不泄露敏感信息）
				logger.error(`tRPC error on ${path ?? "<no-path>"}: ${error.code} - ${error.message}`);
			}
		},
	});

export { handler as GET, handler as POST };
