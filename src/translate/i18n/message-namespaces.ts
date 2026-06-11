/**
 * i18n 消息 namespace 配置
 *
 * 按页面/功能划分 namespace，减少首屏加载的消息量：
 * - common: 所有页面共享的基础 UI 文本（locale/navigation/navbar/footer/errors/auth/login）
 * - tts: TTS 页面专属
 * - pricing: 定价页
 * - legal: 法律页面（privacy/terms/refund）
 * - guide: 使用说明页
 * - docs: 文档
 * - home: 首页
 * - contact: 联系页
 * - billing: 账单/会员中心
 * - user: 用户设置/仪表盘
 */

export const COMMON_NAMESPACES = [
	"locale",
	"navigation",
	"navbar",
	"footer",
	"errors",
	"errorPages",
	"auth",
	"login",
	"dashboard",
	"settings",
	"membership",
] as const;

export const PAGE_NAMESPACES = {
	tts: ["tts"],
	pricing: ["pricing"],
	legal: ["privacy", "terms", "refund"],
	guide: ["guide"],
	docs: ["docs"],
	billing: ["billing"],
	user: ["user", "app"],
	home: ["home"],
	contact: ["contact"],
	search: ["search"],
} as const;

export type CommonNamespace = (typeof COMMON_NAMESPACES)[number];
