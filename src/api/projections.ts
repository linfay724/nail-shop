import { PUBLIC_PRODUCT_FIELDS, SENSITIVE_KEYS } from './contract'
import type {
  AdminProduct,
  CraftArchive,
  Order,
  PublicOrder,
  PublicProduct,
  PublicProductDetail,
} from './contract'

type UnknownRecord = Record<string, unknown>

export function toPublicProduct(source: AdminProduct): PublicProduct {
  const picked = {} as PublicProduct
  PUBLIC_PRODUCT_FIELDS.forEach((field) => {
    picked[field] = source[field] as never
  })

  return picked
}

export function toPublicProductDetail(source: AdminProduct): PublicProductDetail {
  return {
    ...toPublicProduct(source),
    images: [...source.images],
    skus: source.skus.map((sku) => ({ ...sku })),
  }
}

export function toPublicOrder(source: Order): PublicOrder {
  return {
    id: source.id,
    status: source.status,
    items: source.items.map((item) => ({ ...item })),
    amount: source.amount,
    addressSnapshot: { ...source.addressSnapshot, region: [...source.addressSnapshot.region] },
    remark: source.remark,
    logistics: source.logistics
      ? {
          ...source.logistics,
          traces: source.logistics.traces.map((trace) => ({ ...trace })),
        }
      : null,
    afterSale: source.afterSale ? { ...source.afterSale } : null,
    timestamps: { ...source.timestamps },
  }
}

export function toAdminProduct(source: AdminProduct): AdminProduct {
  return {
    ...toPublicProductDetail(source),
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  }
}

export function toCraftArchive(source: CraftArchive): CraftArchive {
  return {
    productId: source.productId,
    materials: source.materials.map((line) => ({ ...line })),
    steps: source.steps.map((step) => ({ ...step, images: [...step.images] })),
    materialCost: source.materialCost,
    otherCost: source.otherCost,
    updatedAt: source.updatedAt,
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
