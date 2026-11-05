export type ProductStyle = '日式' | '法式' | '甜美' | '复古'
export type ProductShape = '方甲' | '圆甲' | '杏仁甲' | '芭蕾甲'

export interface ProductSku {
  id: string
  size: string
  pieceCount: number
  stock: number
  priceDelta?: number
}

/** 普通用户可见的商品字段（白名单） */
export interface PublicProduct {
  id: string
  name: string
  cover: string
  style: ProductStyle
  shape: ProductShape
  price: number
  sales: number
  onSale: boolean
}

export interface PublicProductDetail extends PublicProduct {
  images: string[]
  skus: ProductSku[]
}

/** 管理端商品，仅补充管理字段，不含档案内容 */
export interface AdminProduct extends PublicProductDetail {
  createdAt: string
  updatedAt: string
}

export type MaterialCategory = 'tip' | 'gel' | 'ornament' | 'other'

export interface MaterialLine {
  category: MaterialCategory
  name: string
  spec: string
  amount: number
  unit: string
}

export interface CraftStep {
  order: number
  description: string
  images: string[]
}

export interface CraftArchive {
  productId: string
  materials: MaterialLine[]
  steps: CraftStep[]
  materialCost: number
  otherCost: number
  updatedAt: string
}

export interface CartSnapshot {
  name: string
  cover: string
  price: number
  stock: number
}

export interface CartLine {
  skuId: string
  productId: string
  size: string
  pieceCount: number
  quantity: number
  selected: boolean
  snapshot: CartSnapshot
}

export interface Address {
  id: string
  receiver: string
  phone: string
  region: string[]
  detail: string
  isDefault: boolean
}

export type OrderStatus = 'pending_pay' | 'pending_ship' | 'pending_receive' | 'completed' | 'cancelled'

export interface OrderItem {
  skuId: string
  productId: string
  name: string
  cover: string
  size: string
  pieceCount: number
  price: number
  quantity: number
}

export interface LogisticsTrace {
  time: string
  text: string
}

export interface Logistics {
  company: string
  no: string
  traces: LogisticsTrace[]
}

export type AfterSaleType = 'refund' | 'return_refund'
export type AfterSaleStatus = 'pending' | 'approved' | 'rejected'

export interface AfterSale {
  type: AfterSaleType
  reason: string
  description: string
  status: AfterSaleStatus
  rejectReason?: string
  appliedAt: string
}

export interface Order {
  id: string
  status: OrderStatus
  items: OrderItem[]
  amount: number
  addressSnapshot: Address
  remark: string
  logistics: Logistics | null
  afterSale: AfterSale | null
  timestamps: {
    createdAt: number
    paidAt?: number
    shippedAt?: number
    completedAt?: number
    cancelledAt?: number
  }
}

export interface PublicOrder extends Order {}

export interface UserSession {
  token: string
  expiresAt: number
  userId: string
  nickname: string
  avatar: string
  phone: string
}

export interface AdminSession {
  token: string
  expiresAt: number
}

export interface ApiError {
  code: number
  message: string
}

export interface ApiResult<T> {
  data: T
}

export const PUBLIC_PRODUCT_FIELDS = [
  'id',
  'name',
  'cover',
  'style',
  'shape',
  'price',
  'sales',
  'onSale',
] as const

export const SENSITIVE_KEYS = ['materials', 'steps', 'costPrice', 'materialCost', 'otherCost'] as const

export const STYLE_OPTIONS: ProductStyle[] = ['日式', '法式', '甜美', '复古']
export const SHAPE_OPTIONS: ProductShape[] = ['方甲', '圆甲', '杏仁甲', '芭蕾甲']
