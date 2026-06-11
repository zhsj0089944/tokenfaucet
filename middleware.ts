import createMiddleware from "next-intl/middleware";
import { routing } from "@/translate/i18n/routing";

export default createMiddleware(routing);

export const config = {
	matcher: ["/((?!api|ai|_next|_vercel|.*\\..*|$).*)"],
};
