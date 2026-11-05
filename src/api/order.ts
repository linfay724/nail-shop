import type { AfterSaleType, OrderItem, OrderStatus, PublicOrder } from './contract'
import { request } from './transport'

export type OrderFilter = OrderStatus | 'all'

export const orderApi = {
  list(status: OrderFilter = 'all'): Promise<PublicOrder[]> {
    return request<PublicOrder[]>('order/list', { status }, { publicResponse: true })
  },
  detail(id: string): Promise<PublicOrder> {
    return request<PublicOrder>('order/detail', { id }, { publicResponse: true })
  },
  create(payload: { items: OrderItem[]; addressId: string; remark: string }): Promise<PublicOrder> {
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
  applyAfterSale(payload: {
    id: string
    type: AfterSaleType
    reason: string
    description: string
  }): Promise<PublicOrder> {
    return request<PublicOrder>('order/aftersale', { ...payload }, { publicResponse: true })
  },
}
