import type { AfterSaleRequest, AfterSaleType, ReviewMedia } from './contract'
import { request } from './transport'

export interface CreateAfterSalePayload {
  orderId: string
  type: AfterSaleType
  description: string
  /** 图片或短视频凭证，最多 9 张图片或 1 个视频 */
  media?: ReviewMedia[]
}

export const afterSaleApi = {
  create(payload: CreateAfterSalePayload): Promise<AfterSaleRequest> {
    return request<AfterSaleRequest>('aftersale/create', { ...payload }, { publicResponse: true })
  },
  listByOrder(orderId: string): Promise<AfterSaleRequest[]> {
    return request<AfterSaleRequest[]>('aftersale/list', { orderId }, { publicResponse: true })
  },
}
