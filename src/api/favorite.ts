import type { PublicProduct } from './contract'
import { request } from './transport'

export const favoriteApi = {
  list(): Promise<PublicProduct[]> {
    return request<PublicProduct[]>('favorite/list', {}, { publicResponse: true })
  },
  toggle(productId: string): Promise<{ favorite: boolean }> {
    return request<{ favorite: boolean }>('favorite/toggle', { productId })
  },
}
