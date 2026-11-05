import type { PublicProduct, PublicProductDetail } from './contract'
import { request } from './transport'

export interface ProductQuery {
  style?: string
  shape?: string
}

export const productApi = {
  list(query: ProductQuery = {}): Promise<PublicProduct[]> {
    return request<PublicProduct[]>('product/list', { ...query }, { publicResponse: true })
  },
  detail(id: string): Promise<PublicProductDetail> {
    return request<PublicProductDetail>('product/detail', { id }, { publicResponse: true })
  },
}
