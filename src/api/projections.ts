import { PUBLIC_PRODUCT_FIELDS, SENSITIVE_KEYS } from './contract'
import type {
  AdminProduct,
  ArtistCraftArchive,
  CraftArchive,
  Order,
  PublicOrder,
  PublicProduct,
  PublicProductDetail,
  PublicReview,
  Review,
} from './contract'

type UnknownRecord = Record<string, unknown>

export function toPublicProduct(source: AdminProduct): PublicProduct {
  const picked = {} as PublicProduct
  PUBLIC_PRODUCT_FIELDS.forEach((field) => {
    picked[field] = source[field] as never
  })

  return { ...picked, tags: [...source.tags] }
}

export function toPublicProductDetail(source: AdminProduct): PublicProductDetail {
  return {
    ...toPublicProduct(source),
    images: [...source.images],
    video: source.video,
    skus: source.skus.map((sku) => ({ ...sku })),
  }
}

export function toPublicOrder(source: Order): PublicOrder {
  return {
    id: source.id,
    merchantId: source.merchantId,
    status: source.status,
    items: source.items.map((item) => ({ ...item })),
    goodsAmount: source.goodsAmount,
    shippingFee: source.shippingFee,
    amount: source.amount,
    addressSnapshot: { ...source.addressSnapshot, region: [...source.addressSnapshot.region] },
    customNote: source.customNote,
    logistics: source.logistics
      ? {
          ...source.logistics,
          traces: source.logistics.traces.map((trace) => ({ ...trace })),
        }
      : null,
    reviewed: source.reviewed,
    timestamps: { ...source.timestamps },
  }
}

export function toAdminProduct(source: AdminProduct): AdminProduct {
  return {
    ...toPublicProductDetail(source),
    merchantId: source.merchantId,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  }
}

/** 店主可见的完整档案，含成本与工时 */
export function toOwnerArchive(source: CraftArchive): CraftArchive {
  return {
    productId: source.productId,
    materials: source.materials.map((line) => ({ ...line })),
    steps: source.steps.map((step) => ({ ...step, images: [...step.images] })),
    cost: { ...source.cost },
    updatedAt: source.updatedAt,
  }
}

/** 美甲师可见的档案：只保留材料与步骤，返回类型中不存在成本字段 */
export function toArtistArchive(source: CraftArchive): ArtistCraftArchive {
  return {
    productId: source.productId,
    materials: source.materials.map((line) => ({ ...line })),
    steps: source.steps.map((step) => ({ ...step, images: [...step.images] })),
    updatedAt: source.updatedAt,
  }
}

export function toPublicReview(source: Review): PublicReview {
  return {
    id: source.id,
    nickname: source.nickname,
    rating: source.rating,
    content: source.content,
    media: source.media.map((item) => ({ ...item })),
    createdAt: source.createdAt,
  }
}

/** 递归断言对象中不存在敏感字段，命中即抛出 */
export function assertNoSensitive(value: unknown, path = 'root'): void {
  if (!value || typeof value !== 'object') {
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSensitive(item, `${path}[${index}]`))
    return
  }

  const record = value as UnknownRecord
  SENSITIVE_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      throw new Error(`[data-visibility] sensitive field "${key}" found at ${path}.${key}`)
    }
  })

  Object.entries(record).forEach(([key, child]) => assertNoSensitive(child, `${path}.${key}`))
}
