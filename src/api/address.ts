import type { Address } from './contract'
import { request } from './transport'

export const addressApi = {
  list(): Promise<Address[]> {
    return request<Address[]>('address/list')
  },
  save(address: Address): Promise<Address[]> {
    return request<Address[]>('address/save', { address })
  },
  remove(id: string): Promise<Address[]> {
    return request<Address[]>('address/remove', { id })
  },
}
