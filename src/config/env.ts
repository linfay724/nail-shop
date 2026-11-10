export interface AppConfig {
  /** 是否使用本地 mock 数据层 */
  mockMode: boolean
  /** 真实后端 baseURL（mockMode 为 false 时生效） */
  baseURL: string
  /** 默认经营主体（mock 阶段单主体） */
  defaultMerchantId: string
  /** 运费配置缺失时的兜底值，避免静默包邮造成资损 */
  fallbackShipping: {
    freeShippingThreshold: number
    flatFee: number
  }
  /** 待付款订单超时（毫秒） */
  orderPayTimeout: number
}

export const appConfig: AppConfig = {
  mockMode: true,
  baseURL: 'https://api.example.com/nail-store',
  defaultMerchantId: 'm1',
  fallbackShipping: {
    freeShippingThreshold: 2,
    flatFee: 800,
  },
  orderPayTimeout: 30 * 60 * 1000,
}

/** mock 阶段的演示入口码，仅用于本地自测，真实环境由后端发码 */
export const DEMO_ENTRY_CODES = {
  owner: 'M1-OWNER',
  artist: 'M1-ARTIST',
} as const
