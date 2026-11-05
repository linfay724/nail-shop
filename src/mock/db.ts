import { appConfig } from '@/config/env'
import type { Address, AdminProduct, CartLine, CraftArchive, Order } from '@/api/contract'
import { getStorage, setStorage } from '@/utils/storage'
import { seedAddresses, seedArchives, seedFavorites, seedOrders, seedProducts } from './seed'

export interface MockDb {
  products: AdminProduct[]
  archives: CraftArchive[]
  orders: Order[]
  addresses: Address[]
  favorites: string[]
  cart: CartLine[]
}

const DB_KEY = 'mock_db'

function createSeedDb(): MockDb {
  return {
    products: JSON.parse(JSON.stringify(seedProducts)) as AdminProduct[],
    archives: JSON.parse(JSON.stringify(seedArchives)) as CraftArchive[],
    orders: JSON.parse(JSON.stringify(seedOrders)) as Order[],
    addresses: JSON.parse(JSON.stringify(seedAddresses)) as Address[],
    favorites: [...seedFavorites],
    cart: [],
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
