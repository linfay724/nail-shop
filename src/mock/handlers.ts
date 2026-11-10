import { appConfig } from '@/config/env'
import {
  assertNoSensitive,
  toAdminProduct,
  toArtistArchive,
  toOwnerArchive,
  toPublicOrder,
  toPublicProduct,
  toPublicProductDetail,
  toPublicReview,
} from '@/api/projections'
import type {
  Address,
  AdminProduct,
  AdminSession,
  AfterSaleRequest,
  AfterSaleType,
  ArtistCraftArchive,
  CartLine,
  CraftArchive,
  CraftProductSummary,
  Order,
  OrderItem,
  OrderStatus,
  PagedResult,
  PublicOrder,
  PublicProduct,
  PublicProductDetail,
  Review,
  ReviewMedia,
  ReviewPage,
  ShippingConfig,
  StaffAccount,
  UserSession,
} from '@/api/contract'
import { hasPermission, type Permission } from '@/utils/permissions'
import { calcShipping } from '@/utils/shipping'
import { loadDb, nextId, saveDb, shippingConfigOf, type MockDb } from './db'
import type { QrCode } from '@/api/contract'

export interface MockContext {
  token?: string
  adminToken?: string
}

type Handler = (payload: Record<string, unknown>, ctx: MockContext) => unknown

const DAY = 24 * 60 * 60 * 1000
const DEFAULT_USER = 'u1'

function fail(code: number, message: string): never {
  throw { code, message }
}

function now(): number {
  return Date.now()
}

function parseUserToken(token: string | undefined): number | null {
  if (!token || !token.startsWith('user-')) {
    return null
  }

  const expiresAt = Number(token.slice('user-'.length))
  if (!Number.isFinite(expiresAt) || expiresAt < now()) {
    return null
  }

  return expiresAt
}

function requireUser(ctx: MockContext): string {
  if (parseUserToken(ctx.token) === null) {
    fail(401, '登录已过期，请重新登录')
  }
  return DEFAULT_USER
}

interface AdminAuth {
  account: StaffAccount
  expiresAt: number
}

function parseAdminToken(token: string | undefined, db: MockDb): AdminAuth | null {
  if (!token || !token.startsWith('admin-')) {
    return null
  }

  const rest = token.slice('admin-'.length)
  const splitAt = rest.lastIndexOf('-')
  if (splitAt <= 0) {
    return null
  }

  const accountId = rest.slice(0, splitAt)
  const expiresAt = Number(rest.slice(splitAt + 1))
  if (!Number.isFinite(expiresAt) || expiresAt < now()) {
    return null
  }

  const account = db.staffAccounts.find((item) => item.accountId === accountId)
  if (!account || account.status !== 'active') {
    return null
  }

  return { account, expiresAt }
}

function requirePermission(ctx: MockContext, permission: Permission): AdminAuth {
  const db = loadDb()
  const auth = parseAdminToken(ctx.adminToken, db)
  if (!auth) {
    fail(403, '无管理权限')
  }
  if (!hasPermission(auth.account.role, permission)) {
    fail(403, '当前账号无该操作权限')
  }
  return auth
}

function toPage<T>(list: T[], page: number, pageSize: number): PagedResult<T> {
  const start = (page - 1) * pageSize
  const slice = list.slice(start, start + pageSize)
  return {
    list: slice,
    total: list.length,
    page,
    hasMore: start + slice.length < list.length,
  }
}

function readPage(payload: Record<string, unknown>): { page: number; pageSize: number } {
  const page = Math.max(1, Math.floor(Number(payload.page ?? 1)) || 1)
  const pageSize = Math.min(50, Math.max(1, Math.floor(Number(payload.pageSize ?? 10)) || 10))
  return { page, pageSize }
}

function queryProducts(
  db: MockDb,
  payload: Record<string, unknown>,
  merchantId?: string,
): PagedResult<PublicProduct> {
  const keyword = String(payload.keyword ?? '').trim().toLowerCase()
  const sort = String(payload.sort ?? 'default')
  const { page, pageSize } = readPage(payload)

  const filtered = db.products
    // 工具包等配件同样上架可搜可购，加购后独立成行且不参与包邮副数
    .filter((product) => product.onSale)
    .filter((product) => !merchantId || product.merchantId === merchantId)
    .filter((product) => {
      if (!keyword) {
        return true
      }
      return (
        product.name.toLowerCase().includes(keyword) ||
        product.tags.some((tag) => tag.toLowerCase().includes(keyword))
      )
    })

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'sales':
        return b.sales - a.sales
      case 'newest':
        return b.createdAt.localeCompare(a.createdAt)
      case 'price':
        return a.price - b.price
      default:
        return 0
    }
  })

  const list = sorted.map((product) => toPublicProduct(product))
  list.forEach((item) => assertNoSensitive(item, 'product/query'))
  return toPage(list, page, pageSize)
}

function findOrder(db: MockDb, id: unknown): Order {
  const order = db.orders.find((item) => item.id === id)
  if (!order) {
    fail(404, '订单不存在')
  }
  return order
}

function buildAdminSession(account: StaffAccount, expiresAt: number): AdminSession {
  return {
    token: `admin-${account.accountId}-${expiresAt}`,
    expiresAt,
    accountId: account.accountId,
    name: account.name,
    role: account.role,
    merchantId: account.merchantId,
    qrCodeId: account.qrCodeId,
  }
}

function requireCustomNote(items: OrderItem[], customNote: string): void {
  const needsCustomNote = items.some((item) => item.size === 'OTHER' || item.shape === 'OTHER')
  if (needsCustomNote && !customNote.trim()) {
    fail(400, '请填写定制备注')
  }
}

/** 评价与售后凭证共用同一套媒体限制：最多 9 张图片或 1 个视频 */
function requireValidMedia(media: ReviewMedia[]): void {
  const imageCount = media.filter((item) => item.type === 'image').length
  const videoCount = media.filter((item) => item.type === 'video').length
  if (imageCount > 9 || videoCount > 1 || (imageCount > 0 && videoCount > 0)) {
    fail(400, '最多 9 张图片或 1 个视频')
  }
}

function reviewStats(db: MockDb, productId: string): { average: number; count: number } {
  const visible = db.reviews.filter((item) => item.productId === productId && item.visible)
  if (visible.length === 0) {
    return { average: 0, count: 0 }
  }
  const total = visible.reduce((sum, item) => sum + item.rating, 0)
  return { average: Math.round((total / visible.length) * 10) / 10, count: visible.length }
}

const handlers: Record<string, Handler> = {
  'user/login': (payload) => {
    const expiresAt = now() + 7 * DAY
    const session: UserSession = {
      token: `user-${expiresAt}`,
      expiresAt,
      userId: DEFAULT_USER,
      nickname: typeof payload.nickname === 'string' && payload.nickname ? payload.nickname : '小满',
      avatar: 'https://picsum.photos/seed/avatar/200/200',
      phone: typeof payload.phone === 'string' ? payload.phone : '',
    }

    return session
  },
  'user/session': (_payload, ctx) => {
    const expiresAt = parseUserToken(ctx.token)
    if (expiresAt === null) {
      fail(401, '登录已过期，请重新登录')
    }

    const session: UserSession = {
      token: ctx.token as string,
      expiresAt,
      userId: DEFAULT_USER,
      nickname: '小满',
      avatar: 'https://picsum.photos/seed/avatar/200/200',
      phone: '',
    }

    return session
  },
  'user/logout': () => ({ success: true }),

  'product/list': (payload) => queryProducts(loadDb(), payload),
  'product/search': (payload) => queryProducts(loadDb(), payload),
  'product/accessory/list': () => {
    const list = loadDb()
      .products.filter((product) => product.onSale && product.isAccessory)
      .map((product) => toPublicProduct(product))
    list.forEach((item) => assertNoSensitive(item, 'product/accessory/list'))
    return list
  },
  'product/detail': (payload) => {
    const product = loadDb().products.find((item) => item.id === payload.id)
    if (!product || !product.onSale) {
      fail(404, '商品不存在或已下架')
    }

    const projected: PublicProductDetail = toPublicProductDetail(product)
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

  'favorite/list': (payload, ctx) => {
    const userId = requireUser(ctx)
    const db = loadDb()
    const ids = db.favorites[userId] ?? []
    const { page, pageSize } = readPage(payload)
    const list = ids
      .map((id) => db.products.find((product) => product.id === id))
      .filter((product): product is AdminProduct => Boolean(product))
      .map((product) => toPublicProduct(product))

    list.forEach((item) => assertNoSensitive(item, 'favorite/list'))
    return toPage(list, page, pageSize)
  },
  'favorite/ids': (_payload, ctx) => {
    const userId = requireUser(ctx)
    return loadDb().favorites[userId] ?? []
  },
  'favorite/toggle': (payload, ctx) => {
    const userId = requireUser(ctx)
    const db = loadDb()
    const productId = String(payload.productId)
    const current = db.favorites[userId] ?? []
    const exists = current.includes(productId)
    db.favorites[userId] = exists ? current.filter((id) => id !== productId) : [...current, productId]
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
    const order = findOrder(loadDb(), payload.id)

    const projected: PublicOrder = toPublicOrder(order)
    assertNoSensitive(projected, 'order/detail')
    return projected
  },
  'order/create': (payload, ctx) => {
    requireUser(ctx)
    const db = loadDb()
    const items = payload.items as OrderItem[]
    const address = db.addresses.find((item) => item.id === payload.addressId)

    if (!items || items.length === 0) {
      fail(400, '订单商品不能为空')
    }
    if (!address) {
      fail(400, '请先添加收货地址')
    }

    const customNote = String(payload.customNote ?? '')
    requireCustomNote(items, customNote)

    const goodsAmount = items.reduce((total, item) => total + item.price * item.quantity, 0)
    const paidSets = items.reduce((total, item) => (item.isAccessory ? total : total + item.quantity), 0)
    const config = shippingConfigOf(db, appConfig.defaultMerchantId)
    const shippingFee = calcShipping(config, paidSets)

    const order: Order = {
      id: nextId('o'),
      merchantId: appConfig.defaultMerchantId,
      status: 'pending_pay',
      items: items.map((item) => ({ ...item })),
      goodsAmount,
      shippingFee,
      amount: goodsAmount + shippingFee,
      addressSnapshot: { ...address, region: [...address.region] },
      customNote,
      logistics: null,
      reviewed: false,
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
    const order = findOrder(db, payload.id)
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
    const order = findOrder(db, payload.id)
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
    const order = findOrder(db, payload.id)
    if (order.status !== 'pending_receive') {
      fail(400, '当前订单不可确认收货')
    }

    order.status = 'completed'
    order.timestamps.completedAt = now()
    saveDb(db)

    return toPublicOrder(order)
  },

  'review/list': (payload) => {
    const db = loadDb()
    const productId = String(payload.productId)
    const { page, pageSize } = readPage(payload)
    const visible = db.reviews
      .filter((item) => item.productId === productId && item.visible)
      .sort((a, b) => b.createdAt - a.createdAt)
    const stats = reviewStats(db, productId)
    const paged = toPage(visible.map((item) => toPublicReview(item)), page, pageSize)

    const result: ReviewPage = {
      ...paged,
      average: stats.average,
      count: stats.count,
    }
    result.list.forEach((item) => assertNoSensitive(item, 'review/list'))
    return result
  },
  'review/create': (payload, ctx) => {
    const userId = requireUser(ctx)
    const db = loadDb()
    const order = findOrder(db, payload.orderId)
    if (order.status !== 'completed') {
      fail(400, '订单完成后才能评价')
    }
    if (order.reviewed) {
      fail(400, '该订单已评价')
    }

    const rating = Math.floor(Number(payload.rating))
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      fail(400, '请选择 1-5 星评分')
    }

    const media = (payload.media as ReviewMedia[] | undefined) ?? []
    requireValidMedia(media)

    const productId = order.items[0]?.productId
    if (!productId) {
      fail(400, '订单商品异常')
    }

    const review: Review = {
      id: nextId('r'),
      merchantId: order.merchantId,
      productId,
      orderId: order.id,
      userId,
      nickname: '小满',
      rating,
      content: String(payload.content ?? '').slice(0, 500),
      media,
      visible: true,
      createdAt: now(),
    }

    db.reviews = [review, ...db.reviews]
    order.reviewed = true
    saveDb(db)

    return toPublicReview(review)
  },

  'aftersale/create': (payload, ctx) => {
    const userId = requireUser(ctx)
    const db = loadDb()
    const order = findOrder(db, payload.orderId)
    const type = String(payload.type ?? '') as AfterSaleType
    if (!['size', 'damaged', 'mismatch', 'other'].includes(type)) {
      fail(400, '请选择问题类型')
    }

    const description = String(payload.description ?? '').trim()
    if (!description) {
      fail(400, '请填写问题描述')
    }

    const media = (payload.media as ReviewMedia[] | undefined) ?? []
    requireValidMedia(media)

    const record: AfterSaleRequest = {
      id: nextId('as'),
      merchantId: order.merchantId,
      orderId: order.id,
      userId,
      type,
      description: description.slice(0, 500),
      media,
      status: 'pending',
      createdAt: now(),
    }

    db.afterSales = [record, ...db.afterSales]
    // 仅记录协商意向，订单状态不因售后变化
    saveDb(db)
    return record
  },
  'aftersale/list': (payload, ctx) => {
    requireUser(ctx)
    const orderId = String(payload.orderId ?? '')
    return loadDb()
      .afterSales.filter((item) => !orderId || item.orderId === orderId)
      .sort((a, b) => b.createdAt - a.createdAt)
  },

  'shipping/config': () => {
    const db = loadDb()
    return shippingConfigOf(db, appConfig.defaultMerchantId)
  },

  'staff/resolve': (payload) => {
    const db = loadDb()
    const code = String(payload.code ?? '').trim()
    if (!code) {
      fail(400, '缺少入口码')
    }

    const qr = db.qrCodes.find((item) => item.code === code)
    if (!qr || qr.status !== 'active') {
      fail(401, '入口码已失效')
    }

    const account = db.staffAccounts.find((item) => item.accountId === qr.accountId)
    if (!account || account.status !== 'active') {
      fail(401, '账号已停用，入口码已失效')
    }

    return buildAdminSession(account, now() + DAY)
  },

  'admin/product/list': (payload, ctx) => {
    const auth = requirePermission(ctx, 'product:read')
    const db = loadDb()
    const keyword = String(payload.keyword ?? '').trim()
    const { page, pageSize } = readPage(payload)
    const list = db.products
      .filter((product) => product.merchantId === auth.account.merchantId)
      .filter((product) => !keyword || product.name.includes(keyword))
      .map((product) => toAdminProduct(product))

    return toPage(list, page, pageSize)
  },
  'admin/product/get': (payload, ctx) => {
    const auth = requirePermission(ctx, 'product:read')
    const product = loadDb().products.find(
      (item) => item.id === payload.id && item.merchantId === auth.account.merchantId,
    )
    if (!product) {
      fail(404, '商品不存在')
    }
    return toAdminProduct(product)
  },
  'admin/product/save': (payload, ctx) => {
    const auth = requirePermission(ctx, 'product:write')
    const db = loadDb()
    const input = payload.product as AdminProduct

    if (!input.name.trim()) {
      fail(400, '商品名称不能为空')
    }
    if (!Number.isFinite(input.price) || input.price <= 0) {
      fail(400, '售价必须大于 0')
    }
    if (!Number.isFinite(input.piecesPerSet) || input.piecesPerSet < 0) {
      fail(400, '每副片数必须为非负数')
    }
    if (!Array.isArray(input.skus) || input.skus.length === 0) {
      fail(400, '至少配置一个尺码与甲型组合')
    }

    const keys = input.skus.map((sku) => `${sku.size}-${sku.shape}`)
    if (new Set(keys).size !== keys.length) {
      fail(400, '存在重复的尺码与甲型组合')
    }
    if (input.skus.some((sku) => sku.stock < 0 || input.price + sku.priceDiff <= 0)) {
      fail(400, '库存不能为负，且组合价格必须大于 0')
    }

    if (input.id) {
      const exists = db.products.some(
        (item) => item.id === input.id && item.merchantId === auth.account.merchantId,
      )
      if (!exists) {
        fail(404, '商品不存在')
      }
      db.products = db.products.map((item) =>
        item.id === input.id
          ? { ...item, ...input, merchantId: auth.account.merchantId, updatedAt: new Date().toISOString() }
          : item,
      )
    } else {
      db.products = [
        ...db.products,
        {
          ...input,
          id: nextId('p'),
          merchantId: auth.account.merchantId,
          onSale: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
    }

    saveDb(db)
    return { success: true }
  },
  'admin/product/toggle': (payload, ctx) => {
    const auth = requirePermission(ctx, 'product:write')
    const db = loadDb()
    const target = db.products.find(
      (item) => item.id === payload.id && item.merchantId === auth.account.merchantId,
    )
    if (!target) {
      fail(404, '商品不存在')
    }
    target.onSale = Boolean(payload.onSale)
    saveDb(db)
    return toAdminProduct(target)
  },
  'admin/product/remove': (payload, ctx) => {
    const auth = requirePermission(ctx, 'product:write')
    const db = loadDb()
    const target = db.products.find(
      (item) => item.id === payload.id && item.merchantId === auth.account.merchantId,
    )
    if (!target) {
      fail(404, '商品不存在')
    }
    db.products = db.products.filter((item) => item.id !== payload.id)
    db.archives = db.archives.filter((item) => item.productId !== payload.id)
    saveDb(db)

    return { success: true }
  },

  'admin/craft/list': (_payload, ctx) => {
    const auth = requirePermission(ctx, 'craft:read')
    const db = loadDb()
    const list: CraftProductSummary[] = db.products
      .filter((product) => product.merchantId === auth.account.merchantId && !product.isAccessory)
      .map((product) => ({
        productId: product.id,
        name: product.name,
        cover: product.cover,
        hasArchive: db.archives.some((item) => item.productId === product.id),
      }))
    return list
  },
  'admin/craft/get': (payload, ctx) => {
    const auth = requirePermission(ctx, 'craft:read')
    const db = loadDb()
    const productId = String(payload.productId)
    const product = db.products.find(
      (item) => item.id === productId && item.merchantId === auth.account.merchantId,
    )
    if (!product) {
      fail(404, '商品不存在')
    }

    const archive: CraftArchive =
      db.archives.find((item) => item.productId === productId) ?? {
        productId,
        materials: [],
        steps: [],
        cost: { materialCost: 0, hours: 0, suggestedPrice: product.price },
        updatedAt: new Date().toISOString(),
      }

    return auth.account.role === 'owner' ? toOwnerArchive(archive) : toArtistArchive(archive)
  },
  'admin/craft/save': (payload, ctx) => {
    const auth = requirePermission(ctx, 'craft:write')
    const db = loadDb()
    const archive = payload.archive as CraftArchive

    if (!db.products.some((item) => item.id === archive.productId && item.merchantId === auth.account.merchantId)) {
      fail(404, '商品不存在')
    }

    const invalidMaterial = archive.materials.some((line) => !line.name || !line.amount || line.amount < 0)
    const invalidStep = archive.steps.some(
      (step) => !step.title || !step.desc || step.images.length === 0 || step.images.length > 9,
    )
    if (invalidMaterial || invalidStep) {
      fail(400, '材料或步骤信息不完整')
    }
    const { materialCost, hours, suggestedPrice } = archive.cost
    if (materialCost < 0 || hours < 0 || suggestedPrice < 0) {
      fail(400, '成本与工时不能为负数')
    }

    const next: CraftArchive = { ...archive, updatedAt: new Date().toISOString() }
    db.archives = db.archives.some((item) => item.productId === archive.productId)
      ? db.archives.map((item) => (item.productId === archive.productId ? next : item))
      : [...db.archives, next]
    saveDb(db)

    return toOwnerArchive(next)
  },

  'admin/order/list': (payload, ctx) => {
    const auth = requirePermission(ctx, 'order:read')
    const db = loadDb()
    const status = String(payload.status ?? 'all')
    const keyword = String(payload.keyword ?? '')
    /** 「售后」筛选按是否存在协商记录命中，而不是订单状态 */
    const afterSaleOrderIds = new Set(
      db.afterSales
        .filter((item) => item.merchantId === auth.account.merchantId)
        .map((item) => item.orderId),
    )

    return db.orders
      .filter((order) => order.merchantId === auth.account.merchantId)
      .filter((order) => {
        const statusMatched =
          status === 'all'
            ? true
            : status === 'aftersale'
              ? afterSaleOrderIds.has(order.id)
              : order.status === status
        const keywordMatched = !keyword || order.id.includes(keyword)
        return statusMatched && keywordMatched
      })
      .sort((a, b) => b.timestamps.createdAt - a.timestamps.createdAt)
      .map((order) => toPublicOrder(order))
  },
  'admin/stats': (_payload, ctx) => {
    const auth = requirePermission(ctx, 'order:read')
    const db = loadDb()

    return {
      onSaleProducts: db.products.filter(
        (product) => product.merchantId === auth.account.merchantId && product.onSale,
      ).length,
      pendingShip: db.orders.filter(
        (order) => order.merchantId === auth.account.merchantId && order.status === 'pending_ship',
      ).length,
      pendingAfterSale: db.afterSales.filter(
        (item) => item.merchantId === auth.account.merchantId && item.status === 'pending',
      ).length,
    }
  },
  'admin/aftersale/list': (payload, ctx) => {
    const auth = requirePermission(ctx, 'order:read')
    const orderId = String(payload.orderId ?? '')
    return loadDb()
      .afterSales.filter((item) => item.merchantId === auth.account.merchantId)
      .filter((item) => !orderId || item.orderId === orderId)
      .sort((a, b) => b.createdAt - a.createdAt)
  },
  'admin/aftersale/resolve': (payload, ctx) => {
    const auth = requirePermission(ctx, 'order:write')
    const db = loadDb()
    const record = db.afterSales.find(
      (item) => item.id === payload.id && item.merchantId === auth.account.merchantId,
    )
    if (!record) {
      fail(404, '协商记录不存在')
    }

    record.status = 'resolved'
    saveDb(db)
    return record
  },
  'admin/order/detail': (payload, ctx) => {
    const auth = requirePermission(ctx, 'order:read')
    const order = findOrder(loadDb(), payload.id)
    if (order.merchantId !== auth.account.merchantId) {
      fail(404, '订单不存在')
    }

    return toPublicOrder(order)
  },
  'admin/order/ship': (payload, ctx) => {
    const auth = requirePermission(ctx, 'order:write')
    const db = loadDb()
    const order = findOrder(db, payload.id)
    if (order.merchantId !== auth.account.merchantId) {
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

  'admin/review/list': (payload, ctx) => {
    const auth = requirePermission(ctx, 'review:manage')
    const db = loadDb()
    const productId = String(payload.productId ?? '')
    const list = db.reviews
      .filter((item) => item.merchantId === auth.account.merchantId)
      .filter((item) => !productId || item.productId === productId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((item) => ({ ...item, media: item.media.map((media) => ({ ...media })) }))

    return list
  },
  'admin/review/visible': (payload, ctx) => {
    const auth = requirePermission(ctx, 'review:manage')
    const db = loadDb()
    const review = db.reviews.find(
      (item) => item.id === payload.id && item.merchantId === auth.account.merchantId,
    )
    if (!review) {
      fail(404, '评价不存在')
    }
    review.visible = Boolean(payload.visible)
    saveDb(db)
    return { success: true }
  },
  'admin/review/remove': (payload, ctx) => {
    const auth = requirePermission(ctx, 'review:manage')
    const db = loadDb()
    const exists = db.reviews.some(
      (item) => item.id === payload.id && item.merchantId === auth.account.merchantId,
    )
    if (!exists) {
      fail(404, '评价不存在')
    }
    db.reviews = db.reviews.filter((item) => item.id !== payload.id)
    saveDb(db)
    return { success: true }
  },

  'admin/shipping/save': (payload, ctx) => {
    const auth = requirePermission(ctx, 'shipping:manage')
    const db = loadDb()
    const threshold = Math.floor(Number(payload.freeShippingThreshold))
    const flatFee = Math.round(Number(payload.flatFee))
    if (!Number.isFinite(threshold) || threshold < 1) {
      fail(400, '包邮副数必须为大于 0 的整数')
    }
    if (!Number.isFinite(flatFee) || flatFee < 0) {
      fail(400, '固定邮费不能为负数')
    }

    const next: ShippingConfig = {
      merchantId: auth.account.merchantId,
      freeShippingThreshold: threshold,
      flatFee,
    }
    db.shippingConfigs = db.shippingConfigs.some((item) => item.merchantId === next.merchantId)
      ? db.shippingConfigs.map((item) => (item.merchantId === next.merchantId ? next : item))
      : [...db.shippingConfigs, next]
    saveDb(db)

    return next
  },

  'admin/staff/list': (_payload, ctx) => {
    const auth = requirePermission(ctx, 'staff:manage')
    const db = loadDb()
    return db.staffAccounts
      .filter((item) => item.merchantId === auth.account.merchantId)
      .map((item) => ({
        ...item,
        qrCode: db.qrCodes.find((qr) => qr.code === item.qrCodeId) ?? null,
      }))
  },
  'admin/staff/status': (payload, ctx) => {
    const auth = requirePermission(ctx, 'staff:manage')
    const db = loadDb()
    const account = db.staffAccounts.find(
      (item) => item.accountId === payload.accountId && item.merchantId === auth.account.merchantId,
    )
    if (!account) {
      fail(404, '账号不存在')
    }
    if (account.role === 'owner') {
      fail(400, '店主账号不可停用')
    }

    const status = payload.status === 'disabled' ? 'disabled' : 'active'
    account.status = status

    const qr = db.qrCodes.find((item) => item.accountId === account.accountId)
    if (qr) {
      qr.status = status === 'active' ? 'active' : 'invalid'
    }

    if (status === 'active') {
      // 重新启用时生成新码，旧码保持失效
      const nextCode = `${account.qrCodeId}-${Date.now().toString().slice(-4)}`
      const old = db.qrCodes.find((item) => item.code === account.qrCodeId)
      if (old) {
        old.status = 'invalid'
      }
      const created: QrCode = {
        code: nextCode,
        accountId: account.accountId,
        merchantId: account.merchantId,
        status: 'active',
      }
      db.qrCodes = [...db.qrCodes, created]
      account.qrCodeId = nextCode
    }

    saveDb(db)
    return { success: true }
  },
  'admin/staff/regenerate': (payload, ctx) => {
    const auth = requirePermission(ctx, 'staff:manage')
    const db = loadDb()
    const account = db.staffAccounts.find(
      (item) => item.accountId === payload.accountId && item.merchantId === auth.account.merchantId,
    )
    if (!account) {
      fail(404, '账号不存在')
    }

    const old = db.qrCodes.find((item) => item.code === account.qrCodeId)
    if (old) {
      old.status = 'invalid'
    }
    const nextCode = `M${auth.account.merchantId.replace(/\D/g, '') || '1'}-${account.accountId}-${Date.now()
      .toString()
      .slice(-4)}`
    db.qrCodes = [
      ...db.qrCodes,
      { code: nextCode, accountId: account.accountId, merchantId: account.merchantId, status: 'active' },
    ]
    account.qrCodeId = nextCode
    saveDb(db)

    return { code: nextCode }
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
