export interface AppConfig {
  /** 是否使用本地 mock 数据层 */
  mockMode: boolean
  /** 真实后端 baseURL（mockMode 为 false 时生效） */
  baseURL: string
  /** 管理端口令占位，真实环境由后端账号体系替代 */
  adminPasscode: string
  /** 待付款订单超时（毫秒） */
  orderPayTimeout: number
}

export const appConfig: AppConfig = {
  mockMode: true,
  baseURL: 'https://api.example.com/nail-store',
  adminPasscode: '888888',
  orderPayTimeout: 30 * 60 * 1000,
}
