export type ProductStyle = '日式' | '法式' | '甜美' | '复古'

/** 尺码枚举，OTHER 表示需要定制备注的「其他」 */
export type Size = 'S' | 'M' | 'L' | 'OTHER'
/** 甲型枚举，OTHER 表示需要定制备注的「其他」 */
export type Shape = 'SHORT_ROUND' | 'MEDIUM' | 'LONG_TAPER' | 'OTHER'

export type Role = 'owner' | 'artist'

export const SIZE_OPTIONS: Size[] = ['S', 'M', 'L', 'OTHER']
export const SHAPE_OPTIONS: Shape[] = ['SHORT_ROUND', 'MEDIUM', 'LONG_TAPER', 'OTHER']

export const SIZE_LABELS: Record<Size, string> = {
  S: 'S',
  M: 'M',
  L: 'L',
  OTHER: '其他',
}

export const SHAPE_LABELS: Record<Shape, string> = {
  SHORT_ROUND: '短圆',
  MEDIUM: '中长',
  LONG_TAPER: '长梯',
  OTHER: '其他',
}

export const STYLE_OPTIONS: ProductStyle[] = ['日式', '法式', '甜美', '复古']

/** 尺码 × 甲型的组合规格，仅店主配置过的组合才存在 */
export interface ProductSku {
  id: string
  size: Size
  shape: Shape
  stock: number
  /** 相对商品基础价的价差，可为负 */
  priceDiff: number
}

/** 普通用户可见的商品字段（白名单） */
export interface PublicProduct {
  id: string
  name: string
  cover: string
  style: ProductStyle
  tags: string[]
  price: number
  unit: '副'
  /** 每副片数，0 表示未配置 */
  piecesPerSet: number
  sales: number
  onSale: boolean
  /** 工具包等配件不参与包邮副数统计 */
  isAccessory: boolean
}

export interface PublicProductDetail extends PublicProduct {
  images: string[]
  video?: string
  skus: ProductSku[]
}

/** 管理端商品，仅补充管理字段，不含档案内容 */
export interface AdminProduct extends PublicProductDetail {
  merchantId: string
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
  title: string
  desc: string
  images: string[]
  video?: string
}

export interface CraftCost {
  materialCost: number
  hours: number
  suggestedPrice: number
}

export interface CraftArchive {
  productId: string
  materials: MaterialLine[]
  steps: CraftStep[]
  cost: CraftCost
  updatedAt: string
}

/** 美甲师可见的档案，结构上不存在成本字段 */
export interface ArtistCraftArchive {
  productId: string
  materials: MaterialLine[]
  steps: CraftStep[]
  updatedAt: string
}

export interface CartSnapshot {
  name: string
  cover: string
  price: number
  stock: number
  unit: string
  piecesPerSet: number
}

export interface CartLine {
  skuId: string
  productId: string
  size?: Size
  shape?: Shape
  isAccessory: boolean
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

/** 快递发货 */
export type OrderStatus = 'pending_pay' | 'pending_ship' | 'pending_receive' | 'completed' | 'cancelled'

export interface OrderItem {
  skuId: string
  productId: string
  name: string
  cover: string
  size?: Size
  shape?: Shape
  unit: string
  price: number
  quantity: number
  isAccessory: boolean
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

export interface Order {
  id: string
  merchantId: string
  status: OrderStatus
  items: OrderItem[]
  goodsAmount: number
  shippingFee: number
  amount: number
  addressSnapshot: Address
  /** 「其他」尺码或甲型的定制备注 */
  customNote: string
  logistics: Logistics | null
  reviewed: boolean
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
  accountId: string
  name: string
  role: Role
  merchantId: string
  qrCodeId: string
}

export type AccountStatus = 'active' | 'disabled'

export interface StaffAccount {
  accountId: string
  name: string
  role: Role
  merchantId: string
  qrCodeId: string
  status: AccountStatus
}

export interface QrCode {
  code: string
  accountId: string
  merchantId: string
  status: 'active' | 'invalid'
}

/** 账号管理列表项，附带当前入口码状态 */
export interface StaffAccountView extends StaffAccount {
  qrCode: QrCode | null
}

/** 制作资料列表项（美甲师可见） */
export interface CraftProductSummary {
  productId: string
  name: string
  cover: string
  hasArchive: boolean
}

export interface ShippingConfig {
  merchantId: string
  /** 包邮所需副数阈值 */
  freeShippingThreshold: number
  /** 未满阈值时的固定邮费（分） */
  flatFee: number
}

export type ReviewMediaType = 'image' | 'video'

export interface ReviewMedia {
  type: ReviewMediaType
  url: string
}

export interface Review {
  id: string
  merchantId: string
  productId: string
  orderId: string
  userId: string
  nickname: string
  rating: number
  content: string
  media: ReviewMedia[]
  visible: boolean
  createdAt: number
}

/** 售后协商的问题类型 */
export type AfterSaleType = 'size' | 'damaged' | 'mismatch' | 'other'

export const AFTER_SALE_TYPE_LABELS: Record<AfterSaleType, string> = {
  size: '尺寸不合适',
  damaged: '商品破损或瑕疵',
  mismatch: '与描述不符',
  other: '其他问题',
}

export type AfterSaleStatus = 'pending' | 'resolved'

/**
 * 售后协商意向记录：提交后跳转客服会话，处理在线下完成。
 * 不产生退款/退货状态，也不改变订单状态。
 */
export interface AfterSaleRequest {
  id: string
  merchantId: string
  orderId: string
  userId: string
  type: AfterSaleType
  description: string
  media: ReviewMedia[]
  status: AfterSaleStatus
  createdAt: number
}

export interface PublicReview {
  id: string
  nickname: string
  rating: number
  content: string
  media: ReviewMedia[]
  createdAt: number
}

export interface ReviewPage {
  list: PublicReview[]
  total: number
  page: number
  hasMore: boolean
  average: number
  count: number
}

export interface PageQuery {
  page?: number
  pageSize?: number
}

export interface PagedResult<T> {
  list: T[]
  total: number
  page: number
  hasMore: boolean
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
  'tags',
  'price',
  'unit',
  'piecesPerSet',
  'sales',
  'onSale',
  'isAccessory',
] as const

export const SENSITIVE_KEYS = [
  'materials',
  'steps',
  'cost',
  'costPrice',
  'materialCost',
  'hours',
  'suggestedPrice',
] as const
