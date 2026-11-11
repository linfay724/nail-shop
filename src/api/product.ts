import type { PagedResult, PublicProduct, PublicProductDetail, ProductStyle, Shape, Size } from './contract'
import { request } from './transport'

/** 列表页排序：综合 / 销量 / 上新 / 价格 */
export type ProductSort = 'default' | 'sales' | 'newest' | 'price'

export interface ProductQuery {
  keyword?: string
  sort?: ProductSort
  /** 尺码筛选，命中任一已配置组合 */
  size?: Size
  /** 甲型筛选，命中任一已配置组合 */
  shape?: Shape
  /** 风格筛选 */
  style?: ProductStyle
  page?: number
  pageSize?: number
}

export const productApi = {
  list(query: ProductQuery = {}): Promise<PagedResult<PublicProduct>> {
    return request<PagedResult<PublicProduct>>('product/list', { ...query }, { publicResponse: true })
  },
  search(query: ProductQuery = {}): Promise<PagedResult<PublicProduct>> {
    return request<PagedResult<PublicProduct>>('product/search', { ...query }, { publicResponse: true })
  },
  accessories(): Promise<PublicProduct[]> {
    return request<PublicProduct[]>('product/accessory/list', {}, { publicResponse: true })
  },
  detail(id: string): Promise<PublicProductDetail> {
    return request<PublicProductDetail>('product/detail', { id }, { publicResponse: true })
  },
}
