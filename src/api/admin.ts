import type {
  AdminProduct,
  AfterSaleRequest,
  ArtistCraftArchive,
  CraftArchive,
  CraftProductSummary,
  OrderStatus,
  PagedResult,
  PublicOrder,
  Review,
} from './contract'
import { request } from './transport'

/** 「售后」不是订单状态，而是按是否存在协商记录筛选 */
export type AdminOrderFilter = OrderStatus | 'all' | 'aftersale'

export interface AdminStats {
  onSaleProducts: number
  pendingShip: number
  pendingAfterSale: number
}

export const adminApi = {
  listProducts(keyword = '', page = 1, pageSize = 20): Promise<PagedResult<AdminProduct>> {
    return request<PagedResult<AdminProduct>>(
      'admin/product/list',
      { keyword, page, pageSize },
      { admin: true },
    )
  },
  getProduct(id: string): Promise<AdminProduct> {
    return request<AdminProduct>('admin/product/get', { id }, { admin: true })
  },
  saveProduct(product: AdminProduct): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('admin/product/save', { product }, { admin: true })
  },
  toggleProduct(id: string, onSale: boolean): Promise<AdminProduct> {
    return request<AdminProduct>('admin/product/toggle', { id, onSale }, { admin: true })
  },
  removeProduct(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('admin/product/remove', { id }, { admin: true })
  },
  listCraftSummaries(): Promise<CraftProductSummary[]> {
    return request<CraftProductSummary[]>('admin/craft/list', {}, { admin: true })
  },
  /** 店主拿到完整档案，美甲师拿到不含成本字段的只读档案 */
  getCraft(productId: string): Promise<CraftArchive | ArtistCraftArchive> {
    return request<CraftArchive | ArtistCraftArchive>('admin/craft/get', { productId }, { admin: true })
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
  getStats(): Promise<AdminStats> {
    return request<AdminStats>('admin/stats', {}, { admin: true })
  },
  listAfterSales(orderId = ''): Promise<AfterSaleRequest[]> {
    return request<AfterSaleRequest[]>('admin/aftersale/list', { orderId }, { admin: true })
  },
  resolveAfterSale(id: string): Promise<AfterSaleRequest> {
    return request<AfterSaleRequest>('admin/aftersale/resolve', { id }, { admin: true })
  },
  listReviews(productId = ''): Promise<Review[]> {
    return request<Review[]>('admin/review/list', { productId }, { admin: true })
  },
  setReviewVisible(id: string, visible: boolean): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('admin/review/visible', { id, visible }, { admin: true })
  },
  removeReview(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('admin/review/remove', { id }, { admin: true })
  },
}
