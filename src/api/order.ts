import type { OrderItem, OrderStatus, PublicOrder } from './contract'
import { request } from './transport'

export type OrderFilter = OrderStatus | 'all'

export interface CreateOrderPayload {
  items: OrderItem[]
  addressId: string
  /** 含「其他」尺码或甲型时必填 */
  customNote?: string
}

export const orderApi = {
  list(status: OrderFilter = 'all'): Promise<PublicOrder[]> {
    return request<PublicOrder[]>('order/list', { status }, { publicResponse: true })
  },
  detail(id: string): Promise<PublicOrder> {
    return request<PublicOrder>('order/detail', { id }, { publicResponse: true })
  },
  create(payload: CreateOrderPayload): Promise<PublicOrder> {
    return request<PublicOrder>('order/create', { ...payload }, { publicResponse: true })
  },
  pay(id: string): Promise<PublicOrder> {
    return request<PublicOrder>('order/pay', { id }, { publicResponse: true })
  },
  cancel(id: string): Promise<PublicOrder> {
    return request<PublicOrder>('order/cancel', { id }, { publicResponse: true })
  },
  confirm(id: string): Promise<PublicOrder> {
    return request<PublicOrder>('order/confirm', { id }, { publicResponse: true })
  },
}
