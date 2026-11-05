import type { CartLine } from './contract'
import { request } from './transport'

export const cartApi = {
  list(): Promise<CartLine[]> {
    return request<CartLine[]>('cart/list')
  },
  save(lines: CartLine[]): Promise<CartLine[]> {
    return request<CartLine[]>('cart/save', { lines })
  },
}
