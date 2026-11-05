import { appConfig } from '@/config/env'
import { assertNoSensitive, toAdminProduct, toCraftArchive, toPublicOrder, toPublicProduct, toPublicProductDetail } from '@/api/projections'
import type {
  Address,
  AdminProduct,
  AfterSaleType,
  CartLine,
  CraftArchive,
  Order,
  OrderItem,
  OrderStatus,
  PublicOrder,
  PublicProduct,
  PublicProductDetail,
  UserSession,
} from '@/api/contract'
import { loadDb, nextId, saveDb } from './db'

export interface MockContext {
  token?: string
  adminToken?: string
}

type Handler = (payload: Record<string, unknown>, ctx: MockContext) => unknown

const DAY = 24 * 60 * 60 * 1000

function fail(code: number, message: string): never {
  throw { code, message }
}

function now(): number {
  return Date.now()
}

function parseToken(token: string | undefined, prefix: 'user' | 'admin'): number | null {
  if (!token || !token.startsWith(`${prefix}-`)) {
    return null
  }

  const expiresAt = Number(token.slice(prefix.length + 1))
  if (!Number.isFinite(expiresAt) || expiresAt < now()) {
    return null
  }

  return expiresAt
}

function requireUser(ctx: MockContext): void {
  if (parseToken(ctx.token, 'user') === null) {
    fail(401, '登录已过期，请重新登录')
  }
}

function requireAdmin(ctx: MockContext): void {
  if (parseToken(ctx.adminToken, 'admin') === null) {
    fail(403, '无管理权限')
  }
}

function publicProducts(): PublicProduct[] {
  return loadDb()
    .products.filter((product) => product.onSale)
    .map((product) => toPublicProduct(product))
}

const handlers: Record<string, Handler> = {
  'user/login': (payload) => {
    const expiresAt = now() + 7 * DAY
    const session: UserSession = {
      token: `user-${expiresAt}`,
      expiresAt,
      userId: 'u1',
      nickname: typeof payload.nickname === 'string' && payload.nickname ? payload.nickname : '小满',
      avatar: 'https://picsum.photos/seed/avatar/200/200',
      phone: typeof payload.phone === 'string' ? payload.phone : '',
    }

    return session
  },
  'user/session': (_payload, ctx) => {
    const expiresAt = parseToken(ctx.token, 'user')
    if (expiresAt === null) {
      fail(401, '登录已过期，请重新登录')
    }

    const session: UserSession = {
      token: ctx.token as string,
      expiresAt,
      userId: 'u1',
      nickname: '小满',
      avatar: 'https://picsum.photos/seed/avatar/200/200',
      phone: '',
    }

    return session
  },
  'user/logout': () => ({ success: true }),

  'product/list': (payload) => {
    const style = payload.style as string | undefined
    const shape = payload.shape as string | undefined

    const list = publicProducts().filter((product) => {
      const styleMatched = !style || product.style === style
      const shapeMatched = !shape || product.shape === shape
      return styleMatched && shapeMatched
    })

    list.forEach((item) => assertNoSensitive(item, 'product/list'))
    return list
  },
  'product/detail': (payload) => {
    const product = loadDb().products.find((item) => item.id === payload.id)
    if (!product || !product.onSale) {
      fail(404, '商品不存在或已下架')
    }

    const projected = toPublicProductDetail(product)
    assertNoSensitive(projected, 'product/detail')
    return projected
  },

  'cart/list': (_payload, ctx) => {
    requireUser(ctx)
    return loadDb().cart.map((line) => ({ ...line, snapshot: { ...line.snapshot } }))
  },
  'cart/save': (payload, ctx) => {
    requireUser(ctx)
    const db = loadDb()
    db.cart = (payload.lines as CartLine[]) ?? []
    saveDb(db)
    return db.cart
  },

  'favorite/list': (_payload, ctx) => {
    requireUser(ctx)
    const db = loadDb()
    const favorites = db.products
      .filter((product) => db.favorites.includes(product.id))
      .map((product) => ({ ...toPublicProduct(product), onSale: product.onSale }))

    favorites.forEach((item) => assertNoSensitive(item, 'favorite/list'))
    return favorites
  },
  'favorite/toggle': (payload, ctx) => {
    requireUser(ctx)
    const db = loadDb()
    const productId = String(payload.productId)
    const exists = db.favorites.includes(productId)
    db.favorites = exists ? db.favorites.filter((id) => id !== productId) : [...db.favorites, productId]
    saveDb(db)

    return { favorite: !exists }
  },

  'address/list': (_payload, ctx) => {
    requireUser(ctx)
    return loadDb().addresses
  },
  'address/save': (payload, ctx) => {
    requireUser(ctx)
    const db = loadDb()
    const input = payload.address as Address
    const isFirst = db.addresses.length === 0

    if (input.isDefault || isFirst) {
      db.addresses = db.addresses.map((item) => ({ ...item, isDefault: false }))
    }

    if (input.id) {
      db.addresses = db.addresses.map((item) =>
        item.id === input.id ? { ...input, isDefault: input.isDefault || isFirst } : item,
      )
    } else {
      db.addresses = [...db.addresses, { ...input, id: nextId('a'), isDefault: input.isDefault || isFirst }]
    }

    if (!db.addresses.some((item) => item.isDefault) && db.addresses[0]) {
      db.addresses[0].isDefault = true
    }

    saveDb(db)
    return db.addresses
  },
  'address/remove': (payload, ctx) => {
    requireUser(ctx)
    const db = loadDb()
    const removed = db.addresses.find((item) => item.id === payload.id)
    db.addresses = db.addresses.filter((item) => item.id !== payload.id)

    if (removed?.isDefault && db.addresses[0]) {
      db.addresses[0].isDefault = true
    }

    saveDb(db)
    return db.addresses
  },

  'order/list': (payload, ctx) => {
    requireUser(ctx)
    const status = payload.status as OrderStatus | 'all' | undefined
    const list = loadDb()
      .orders.filter((order) => !status || status === 'all' || order.status === status)
      .sort((a, b) => b.timestamps.createdAt - a.timestamps.createdAt)
      .map((order) => toPublicOrder(order))

    list.forEach((item) => assertNoSensitive(item, 'order/list'))
    return list
  },
  'order/detail': (payload, ctx) => {
    requireUser(ctx)
    const order = loadDb().orders.find((item) => item.id === payload.id)
    if (!order) {
      fail(404, '订单不存在')
    }

    const projected: PublicOrder = toPublicOrder(order)
    assertNoSensitive(projected, 'order/detail')
    return projected
  },
  'order/create': (payload, ctx) => {
    requireUser(ctx)
    const db = loadDb()
    const items = payload.items as OrderItem[]
    const addressId = payload.addressId as string
    const address = db.addresses.find((item) => item.id === addressId)

    if (!items || items.length === 0) {
      fail(400, '订单商品不能为空')
    }
    if (!address) {
      fail(400, '请先添加收货地址')
    }

    const amount = items.reduce((total, item) => total + item.price * item.quantity, 0)
    const order: Order = {
      id: nextId('o'),
      status: 'pending_pay',
      items,
      amount,
      addressSnapshot: { ...address, region: [...address.region] },
      remark: String(payload.remark ?? ''),
      logistics: null,
      afterSale: null,
      timestamps: { createdAt: now() },
    }

    db.orders = [order, ...db.orders]
    db.cart = db.cart.filter((line) => !items.some((item) => item.skuId === line.skuId))
    saveDb(db)

    return toPublicOrder(order)
  },
  'order/pay': (payload, ctx) => {
    requireUser(ctx)
    const db = loadDb()
    const order = db.orders.find((item) => item.id === payload.id)
    if (!order) {
      fail(404, '订单不存在')
    }
    if (order.status !== 'pending_pay') {
      fail(400, '当前订单不可支付')
    }

    order.status = 'pending_ship'
    order.timestamps.paidAt = now()
    saveDb(db)

    return toPublicOrder(order)
  },
  'order/cancel': (payload, ctx) => {
    requireUser(ctx)
    const db = loadDb()
    const order = db.orders.find((item) => item.id === payload.id)
    if (!order) {
      fail(404, '订单不存在')
    }
    if (order.status !== 'pending_pay' && order.status !== 'pending_ship') {
      fail(400, '当前订单不可取消')
    }

    order.status = 'cancelled'
    order.timestamps.cancelledAt = now()
    saveDb(db)

    return toPublicOrder(order)
  },
  'order/confirm': (payload, ctx) => {
    requireUser(ctx)
    const db = loadDb()
    const order = db.orders.find((item) => item.id === payload.id)
    if (!order) {
      fail(404, '订单不存在')
    }
    if (order.status !== 'pending_receive') {
      fail(400, '当前订单不可确认收货')
    }

    order.status = 'completed'
    order.timestamps.completedAt = now()
    saveDb(db)

    return toPublicOrder(order)
  },
  'order/aftersale': (payload, ctx) => {
    requireUser(ctx)
    const db = loadDb()
    const order = db.orders.find((item) => item.id === payload.id)
    if (!order) {
      fail(404, '订单不存在')
    }
    if (order.afterSale && order.afterSale.status === 'pending') {
      fail(400, '售后正在处理中，请勿重复提交')
    }
    if (order.status !== 'completed' && order.status !== 'pending_receive') {
      fail(400, '当前订单不支持售后')
    }

    order.afterSale = {
      type: payload.type as AfterSaleType,
      reason: String(payload.reason ?? ''),
      description: String(payload.description ?? ''),
      status: 'pending',
      appliedAt: new Date().toISOString(),
    }
    saveDb(db)

    return toPublicOrder(order)
  },

  'admin/login': (payload) => {
    if (payload.passcode !== appConfig.adminPasscode) {
      fail(401, '管理口令不正确')
    }

    const expiresAt = now() + DAY
    return { token: `admin-${expiresAt}`, expiresAt }
  },
  'admin/product/list': (_payload, ctx) => {
    requireAdmin(ctx)
    return loadDb().products.map((product) => toAdminProduct(product))
  },
  'admin/product/save': (payload, ctx) => {
    requireAdmin(ctx)
    const db = loadDb()
    const input = payload.product as AdminProduct

    if (!input.name || !input.price) {
      fail(400, '商品名称与售价不能为空')
    }

    if (input.id) {
      db.products = db.products.map((item) =>
        item.id === input.id ? { ...item, ...input, updatedAt: new Date().toISOString() } : item,
      )
    } else {
      const id = nextId('p')
      db.products = [
        ...db.products,
        {
          ...input,
          id,
          onSale: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
    }

    saveDb(db)
    return db.products.map((product) => toAdminProduct(product))
  },
  'admin/product/toggle': (payload, ctx) => {
    requireAdmin(ctx)
    const db = loadDb()
    db.products = db.products.map((item) =>
      item.id === payload.id ? { ...item, onSale: Boolean(payload.onSale) } : item,
    )
    saveDb(db)

    return db.products.map((product) => toAdminProduct(product))
  },
  'admin/product/remove': (payload, ctx) => {
    requireAdmin(ctx)
    const db = loadDb()
    db.products = db.products.filter((item) => item.id !== payload.id)
    db.archives = db.archives.filter((item) => item.productId !== payload.id)
    saveDb(db)

    return { success: true }
  },
  'admin/craft/get': (payload, ctx) => {
    requireAdmin(ctx)
    const archive = loadDb().archives.find((item) => item.productId === payload.productId)

    return archive
      ? toCraftArchive(archive)
      : {
          productId: String(payload.productId),
          materials: [],
          steps: [],
          materialCost: 0,
          otherCost: 0,
          updatedAt: new Date().toISOString(),
        }
  },
  'admin/craft/save': (payload, ctx) => {
    requireAdmin(ctx)
    const db = loadDb()
    const archive = payload.archive as CraftArchive

    const invalidMaterial = archive.materials.some((line) => !line.name || !line.amount || line.amount < 0)
    const invalidStep = archive.steps.some((step) => !step.description || step.images.length === 0)
    if (invalidMaterial || invalidStep) {
      fail(400, '材料或步骤信息不完整')
    }
    if (archive.materialCost < 0 || archive.otherCost < 0) {
      fail(400, '成本不能为负数')
    }

    const next: CraftArchive = { ...archive, updatedAt: new Date().toISOString() }
    db.archives = db.archives.some((item) => item.productId === archive.productId)
      ? db.archives.map((item) => (item.productId === archive.productId ? next : item))
      : [...db.archives, next]
    saveDb(db)

    return toCraftArchive(next)
  },
  'admin/order/list': (payload, ctx) => {
    requireAdmin(ctx)
    const status = payload.status as OrderStatus | 'all' | undefined
    const keyword = String(payload.keyword ?? '')

    return loadDb()
      .orders.filter((order) => {
        const statusMatched = !status || status === 'all' || order.status === status
        const keywordMatched = !keyword || order.id.includes(keyword)
        return statusMatched && keywordMatched
      })
      .map((order) => toPublicOrder(order))
  },
  'admin/order/detail': (payload, ctx) => {
    requireAdmin(ctx)
    const order = loadDb().orders.find((item) => item.id === payload.id)
    if (!order) {
      fail(404, '订单不存在')
    }

    return toPublicOrder(order)
  },
  'admin/order/ship': (payload, ctx) => {
    requireAdmin(ctx)
    const db = loadDb()
    const order = db.orders.find((item) => item.id === payload.id)
    if (!order) {
      fail(404, '订单不存在')
    }
    if (order.status !== 'pending_ship') {
      fail(400, '当前订单不可发货')
    }

    const company = String(payload.company ?? '')
    const no = String(payload.no ?? '')
    if (!company || !no) {
      fail(400, '请填写物流公司与运单号')
    }

    order.status = 'pending_receive'
    order.timestamps.shippedAt = now()
    order.logistics = {
      company,
      no,
      traces: [{ time: new Date().toISOString().slice(0, 16).replace('T', ' '), text: '快件已揽收' }],
    }
    saveDb(db)

    return toPublicOrder(order)
  },
  'admin/order/aftersale': (payload, ctx) => {
    requireAdmin(ctx)
    const db = loadDb()
    const order = db.orders.find((item) => item.id === payload.id)
    if (!order || !order.afterSale) {
      fail(404, '售后申请不存在')
    }

    if (payload.approve) {
      order.afterSale.status = 'approved'
    } else {
      order.afterSale.status = 'rejected'
      order.afterSale.rejectReason = String(payload.rejectReason ?? '')
    }
    saveDb(db)

    return toPublicOrder(order)
  },
}

export const MOCK_DELAY = 200

export async function handleMockRequest<T>(
  path: string,
  payload: Record<string, unknown> = {},
  ctx: MockContext = {},
): Promise<T> {
  const handler = handlers[path]
  if (!handler) {
    throw { code: 404, message: `未实现的 mock 接口：${path}` }
  }

  const delay = MOCK_DELAY + Math.floor(Math.random() * 200)
  await new Promise((resolve) => setTimeout(resolve, delay))

  return handler(payload, ctx) as T
}
