import type { AdminProduct, AdminSession, CraftArchive, OrderStatus, PublicOrder } from './contract'
import { request } from './transport'

export type AdminOrderFilter = OrderStatus | 'all'

export const adminApi = {
  login(passcode: string): Promise<AdminSession> {
    return request<AdminSession>('admin/login', { passcode })
  },
  listProducts(): Promise<AdminProduct[]> {
    return request<AdminProduct[]>('admin/product/list', {}, { admin: true })
  },
  saveProduct(product: AdminProduct): Promise<AdminProduct[]> {
    return request<AdminProduct[]>('admin/product/save', { product }, { admin: true })
  },
  toggleProduct(id: string, onSale: boolean): Promise<AdminProduct[]> {
    return request<AdminProduct[]>('admin/product/toggle', { id, onSale }, { admin: true })
  },
  removeProduct(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('admin/product/remove', { id }, { admin: true })
  },
  getCraft(productId: string): Promise<CraftArchive> {
    return request<CraftArchive>('admin/craft/get', { productId }, { admin: true })
  },
  saveCraft(archive: CraftArchive): Promise<CraftArchive> {
    return request<CraftArchive>('admin/craft/save', { archive }, { admin: true })
  },
  listOrders(status: AdminOrderFilter = 'all', keyword = ''): Promise<PublicOrder[]> {
    return request<PublicOrder[]>('admin/order/list', { status, keyword }, { admin: true })
  },
  getOrder(id: string): Promise<PublicOrder> {
    return request<PublicOrder>('admin/order/detail', { id }, { admin: true })
  },
  ship(id: string, company: string, no: string): Promise<PublicOrder> {
    return request<PublicOrder>('admin/order/ship', { id, company, no }, { admin: true })
  },
  handleAfterSale(id: string, approve: boolean, rejectReason = ''): Promise<PublicOrder> {
    return request<PublicOrder>('admin/order/aftersale', { id, approve, rejectReason }, { admin: true })
  },
}
