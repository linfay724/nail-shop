import type { PagedResult, PublicProduct } from './contract'
import { request } from './transport'

export const favoriteApi = {
  list(page = 1, pageSize = 10): Promise<PagedResult<PublicProduct>> {
    return request<PagedResult<PublicProduct>>(
      'favorite/list',
      { page, pageSize },
      { publicResponse: true },
    )
  },
  ids(): Promise<string[]> {
    return request<string[]>('favorite/ids')
  },
  toggle(productId: string): Promise<{ favorite: boolean }> {
    return request<{ favorite: boolean }>('favorite/toggle', { productId })
  },
}
