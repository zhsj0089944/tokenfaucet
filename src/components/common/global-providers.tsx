/**
 * @deprecated 使用 BaseProviders（通用层）+ AuthProviders（认证层）代替
 * 保留此文件作为向后兼容的导出，新代码请直接导入 BaseProviders 和 AuthProviders
 */

export { AuthProviders } from "./auth-providers";
export { BaseProviders as GlobalProviders } from "./base-providers";
