import { appConfig } from '@/config/env'
import type {
  Address,
  AdminProduct,
  AfterSaleRequest,
  CartLine,
  CraftArchive,
  Order,
  QrCode,
  Review,
  ShippingConfig,
  StaffAccount,
} from '@/api/contract'
import { getStorage, setStorage } from '@/utils/storage'
import {
  seedAddresses,
  seedAfterSales,
  seedArchives,
  seedFavorites,
  seedOrders,
  seedProducts,
  seedQrCodes,
  seedReviews,
  seedShippingConfigs,
  seedStaffAccounts,
} from './seed'

export interface MockDb {
  products: AdminProduct[]
  archives: CraftArchive[]
  orders: Order[]
  addresses: Address[]
  /** 按 userId 维度存储，收藏随账号在服务端同步 */
  favorites: Record<string, string[]>
  cart: CartLine[]
  shippingConfigs: ShippingConfig[]
  staffAccounts: StaffAccount[]
  qrCodes: QrCode[]
  reviews: Review[]
  afterSales: AfterSaleRequest[]
}

/** 结构不兼容时直接重建 mock 种子（v3：移除订单备注、新增售后协商记录） */
const DB_KEY = 'mock_db_v3'

function createSeedDb(): MockDb {
  return {
    products: JSON.parse(JSON.stringify(seedProducts)) as AdminProduct[],
    archives: JSON.parse(JSON.stringify(seedArchives)) as CraftArchive[],
    orders: JSON.parse(JSON.stringify(seedOrders)) as Order[],
    addresses: JSON.parse(JSON.stringify(seedAddresses)) as Address[],
    favorites: JSON.parse(JSON.stringify(seedFavorites)) as Record<string, string[]>,
    cart: [],
    shippingConfigs: JSON.parse(JSON.stringify(seedShippingConfigs)) as ShippingConfig[],
    staffAccounts: JSON.parse(JSON.stringify(seedStaffAccounts)) as StaffAccount[],
    qrCodes: JSON.parse(JSON.stringify(seedQrCodes)) as QrCode[],
    reviews: JSON.parse(JSON.stringify(seedReviews)) as Review[],
    afterSales: JSON.parse(JSON.stringify(seedAfterSales)) as AfterSaleRequest[],
  }
}

let memoryDb: MockDb | null = null

export function loadDb(): MockDb {
  if (memoryDb) {
    return memoryDb
  }

  const cached = getStorage<MockDb | null>(DB_KEY, null)
  memoryDb = cached ?? createSeedDb()
  if (!cached) {
    saveDb(memoryDb)
  }

  if (expirePendingOrders(memoryDb)) {
    saveDb(memoryDb)
  }

  return memoryDb
}

/** 待付款订单超时自动取消，返回是否有变更 */
export function expirePendingOrders(db: MockDb): boolean {
  let changed = false
  const now = Date.now()

  db.orders.forEach((order) => {
    if (order.status === 'pending_pay' && now - order.timestamps.createdAt > appConfig.orderPayTimeout) {
      order.status = 'cancelled'
      order.timestamps.cancelledAt = now
      changed = true
    }
  })

  return changed
}

export function saveDb(db: MockDb): void {
  memoryDb = db
  setStorage(DB_KEY, db)
}

export function resetDb(): MockDb {
  memoryDb = createSeedDb()
  saveDb(memoryDb)
  return memoryDb
}

export function nextId(prefix: string): string {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')}`
}

export function shippingConfigOf(db: MockDb, merchantId: string): ShippingConfig {
  return (
    db.shippingConfigs.find((item) => item.merchantId === merchantId) ?? {
      merchantId,
      ...appConfig.fallbackShipping,
    }
  )
}
