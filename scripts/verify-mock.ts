/**
 * mock 数据层行为验证脚本（仅本地使用）
 * 运行：node_modules/.bin/esbuild scripts/verify-mock.ts --bundle --platform=node --format=cjs --outfile=.tmp/verify.cjs --alias:@=./src && node .tmp/verify.cjs
 */
const storage = new Map<string, unknown>()

const uniStub = {
  getStorageSync: (key: string) => (storage.has(key) ? JSON.stringify(storage.get(key)) : ''),
  setStorageSync: (key: string, value: unknown) => {
    storage.set(key, value)
  },
  removeStorageSync: (key: string) => {
    storage.delete(key)
  },
  showToast: () => undefined,
  showModal: () => undefined,
  setClipboardData: () => undefined,
  navigateTo: () => undefined,
  reLaunch: () => undefined,
  redirectTo: () => undefined,
  switchTab: () => undefined,
  addInterceptor: () => undefined,
  previewImage: () => undefined,
  chooseMedia: () => undefined,
  uploadFile: () => undefined,
  request: () => undefined,
  requestPayment: () => undefined,
  scanCode: () => undefined,
  openCustomerServiceChat: () => undefined,
}

;(globalThis as unknown as { uni: typeof uniStub }).uni = uniStub

import { handleMockRequest } from '@/mock/handlers'
import { resetDb } from '@/mock/db'
import { DEMO_ENTRY_CODES } from '@/config/env'
import type {
  AdminSession,
  CraftArchive,
  OrderItem,
  PagedResult,
  PublicOrder,
  PublicProduct,
  PublicProductDetail,
  ReviewPage,
  ShippingConfig,
  StaffAccount,
  StaffAccountView,
  UserSession,
} from '@/api/contract'

let passed = 0

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`断言失败：${message}`)
  }
  passed += 1
  console.log(`  ✓ ${message}`)
}

async function expectFail(promise: Promise<unknown>, code: number, message: string): Promise<void> {
  try {
    await promise
    throw new Error(`断言失败：${message}（未抛错）`)
  } catch (error) {
    const err = error as { code?: number }
    assert(err.code === code, `${message}（错误码 ${err.code}）`)
  }
}

const userToken = () =>
  handleMockRequest<UserSession>('user/login', { nickname: '小满' }).then((session) => session.token)

function orderItems(size: 'S' | 'M' | 'OTHER', quantity: number): OrderItem[] {
  return [
    {
      skuId: `p1-${size}-SHORT_ROUND`,
      productId: 'p1',
      name: '樱花奶咖',
      cover: '',
      size,
      shape: 'SHORT_ROUND',
      unit: '副',
      price: 6800,
      quantity,
      isAccessory: false,
    },
  ]
}

async function main(): Promise<void> {
  resetDb()
  const token = await userToken()
  const ctx = { token }

  console.log('15.1 公开响应不含档案字段')
  const detail = await handleMockRequest<PublicProductDetail>('product/detail', { id: 'p1' }, ctx)
  const detailKeys = Object.keys(detail)
  assert(
    !['materials', 'steps', 'cost', 'materialCost', 'hours'].some((key) => detailKeys.includes(key)),
    '商品详情无档案/成本字段',
  )
  const searched = await handleMockRequest<PagedResult<PublicProduct>>('product/search', { keyword: '' }, ctx)
  assert(searched.list.every((item) => !('materials' in item) && !('steps' in item)), '搜索列表无档案字段')

  console.log('15.8 名称/标签搜索与分页')
  const byName = await handleMockRequest<PagedResult<PublicProduct>>('product/search', { keyword: '樱花' }, ctx)
  assert(byName.total >= 1 && byName.list[0]?.name.includes('樱花'), '按名称命中')
  const byTag = await handleMockRequest<PagedResult<PublicProduct>>('product/search', { keyword: '猫眼' }, ctx)
  assert(byTag.list.some((item) => item.id === 'p4'), '按标签命中')
  const paged = await handleMockRequest<PagedResult<PublicProduct>>(
    'product/search',
    { page: 1, pageSize: 2 },
    ctx,
  )
  assert(paged.list.length === 2 && paged.total > 2 && paged.hasMore, '分页返回 total/hasMore')
  const pinyin = await handleMockRequest<PagedResult<PublicProduct>>('product/search', { keyword: 'yinghua' }, ctx)
  assert(pinyin.total === 0, '拼音不做扩展匹配')

  console.log('15.4 「其他」需定制备注')
  const addressId = 'a1'
  await expectFail(
    handleMockRequest('order/create', { items: orderItems('OTHER', 1), addressId, remark: '' }, ctx),
    400,
    '含「其他」尺码未填备注被拒',
  )
  const shapeOther: OrderItem[] = [
    {
      skuId: 'p1-M-OTHER',
      productId: 'p1',
      name: '樱花奶咖',
      cover: '',
      size: 'M',
      shape: 'OTHER',
      unit: '副',
      price: 7200,
      quantity: 1,
      isAccessory: false,
    },
  ]
  await expectFail(
    handleMockRequest('order/create', { items: shapeOther, addressId, remark: '' }, ctx),
    400,
    '甲型为「其他」未填备注被拒',
  )
  const bothOther: OrderItem[] = [
    { ...shapeOther[0], skuId: 'p1-OTHER-OTHER', size: 'OTHER', shape: 'OTHER' },
  ]
  await expectFail(
    handleMockRequest('order/create', { items: bothOther, addressId, remark: '' }, ctx),
    400,
    '尺码与甲型同为「其他」未填备注被拒',
  )
  const withNote = await handleMockRequest<PublicOrder>(
    'order/create',
    { items: orderItems('OTHER', 1), addressId, remark: '', customNote: '甲床偏窄' },
    ctx,
  )
  assert(withNote.customNote === '甲床偏窄' && withNote.status === 'pending_pay', '填写备注后可下单')

  console.log('15.5 运费按副数计算')
  const oneSet = await handleMockRequest<PublicOrder>(
    'order/create',
    { items: orderItems('S', 1), addressId, remark: '' },
    ctx,
  )
  assert(oneSet.shippingFee === 800 && oneSet.amount === 7600, '1 副收固定邮费 8 元')
  const twoSets = await handleMockRequest<PublicOrder>(
    'order/create',
    { items: orderItems('S', 2), addressId, remark: '' },
    ctx,
  )
  assert(twoSets.shippingFee === 0 && twoSets.amount === 13600, '2 副免邮')
  const withAccessory = await handleMockRequest<PublicOrder>(
    'order/create',
    {
      items: [
        ...orderItems('S', 1),
        {
          skuId: 'p9-ACC',
          productId: 'p9',
          name: '穿戴甲工具包',
          cover: '',
          unit: '件',
          price: 1800,
          quantity: 1,
          isAccessory: true,
        },
      ],
      addressId,
      remark: '',
    },
    ctx,
  )
  assert(withAccessory.shippingFee === 800, '工具包不计入包邮副数')
  const config = await handleMockRequest<ShippingConfig>('shipping/config', {}, ctx)
  assert(config.freeShippingThreshold === 2 && config.flatFee === 800, '运费配置来自店主设置')

  console.log('15.2 / 约束：美甲师只读、越权被拒')
  const artist = await handleMockRequest<AdminSession>('staff/resolve', { code: DEMO_ENTRY_CODES.artist })
  assert(artist.role === 'artist' && artist.merchantId === 'm1', '美甲师扫码得到 artist 会话')
  const artistCtx = { token, adminToken: artist.token }
  const artistArchive = await handleMockRequest<Record<string, unknown>>(
    'admin/craft/get',
    { productId: 'p1' },
    artistCtx,
  )
  assert(Array.isArray(artistArchive.steps) && Object.keys(artistArchive).includes('materials'), '美甲师可读材料与步骤')
  assert(!Object.keys(artistArchive).includes('cost'), '美甲师档案无 cost 字段')
  await expectFail(
    handleMockRequest('admin/product/toggle', { id: 'p1', onSale: false }, artistCtx),
    403,
    '美甲师调用上下架被拒',
  )
  await expectFail(
    handleMockRequest('admin/product/save', { product: detail }, artistCtx),
    403,
    '美甲师调用保存商品（改价）被拒',
  )
  await expectFail(
    handleMockRequest('admin/order/ship', { id: 'o20261001002', company: 'SF', no: '1' }, artistCtx),
    403,
    '美甲师发货被拒',
  )

  const owner = await handleMockRequest<AdminSession>('staff/resolve', { code: DEMO_ENTRY_CODES.owner })
  const ownerCtx = { token, adminToken: owner.token }
  const ownerArchive = await handleMockRequest<CraftArchive>('admin/craft/get', { productId: 'p1' }, ownerCtx)
  assert(ownerArchive.cost.materialCost > 0, '店主档案包含成本')

  console.log('15.3 发码与停用')
  const created = await handleMockRequest<StaffAccount>('admin/staff/create', { name: '测试美甲师' }, ownerCtx)
  const firstCode = created.qrCodeId
  const createdSession = await handleMockRequest<AdminSession>('staff/resolve', { code: firstCode })
  assert(createdSession.role === 'artist', '新账号入口码可进入')

  await handleMockRequest('admin/staff/status', { accountId: created.accountId, status: 'disabled' }, ownerCtx)
  await expectFail(handleMockRequest('staff/resolve', { code: firstCode }), 401, '停用后该码校验失败')
  await expectFail(
    handleMockRequest('admin/craft/get', { productId: 'p1' }, { adminToken: createdSession.token }),
    403,
    '停用后已有会话被拒',
  )

  await handleMockRequest('admin/staff/status', { accountId: created.accountId, status: 'active' }, ownerCtx)
  const accounts = await handleMockRequest<StaffAccountView[]>('admin/staff/list', {}, ownerCtx)
  const refreshed = accounts.find((item) => item.accountId === created.accountId)
  assert(Boolean(refreshed) && refreshed!.qrCodeId !== firstCode, '重新启用生成新码')
  await expectFail(handleMockRequest('staff/resolve', { code: firstCode }), 401, '旧码保持失效')
  const newSession = await handleMockRequest<AdminSession>('staff/resolve', { code: refreshed!.qrCodeId })
  assert(newSession.accountId === created.accountId, '新码可进入')

  console.log('15.7 评价隐藏')
  const visibleBefore = await handleMockRequest<ReviewPage>('review/list', { productId: 'p1' }, ctx)
  assert(visibleBefore.count === 2, '用户端只看到 2 条可见评价')
  await handleMockRequest('admin/review/visible', { id: 'r1', visible: false }, ownerCtx)
  const afterHide = await handleMockRequest<ReviewPage>('review/list', { productId: 'p1' }, ctx)
  assert(afterHide.count === 1 && !afterHide.list.some((item) => item.id === 'r1'), '隐藏后用户端不再展示')
  await handleMockRequest('admin/review/visible', { id: 'r1', visible: true }, ownerCtx)
  const afterRestore = await handleMockRequest<ReviewPage>('review/list', { productId: 'p1' }, ctx)
  assert(afterRestore.count === 2, '恢复后重新展示')

  console.log('15.6 收藏服务端同步')
  const favAfter = await handleMockRequest<{ favorite: boolean }>('favorite/toggle', { productId: 'p2' }, ctx)
  assert(favAfter.favorite, '收藏写入服务端')
  const ids = await handleMockRequest<string[]>('favorite/ids', {}, ctx)
  assert(ids.includes('p2'), '换设备后按账号可读到同一份收藏')
  const favList = await handleMockRequest<PagedResult<PublicProduct>>('favorite/list', { page: 1 }, ctx)
  assert(favList.list.some((item) => item.id === 'p2'), '收藏列表包含新收藏')

  console.log('15.2 主体隔离')
  const otherOwner = await handleMockRequest<AdminSession>('staff/resolve', { code: 'M2-OWNER' })
  const otherProducts = await handleMockRequest<PagedResult<PublicProduct>>(
    'admin/product/list',
    {},
    { adminToken: otherOwner.token },
  )
  assert(otherProducts.total === 0, '跨主体读不到对方商品')

  console.log(`\n全部通过：${passed} 项断言`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
