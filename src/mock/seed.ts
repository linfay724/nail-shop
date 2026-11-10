import { appConfig, DEMO_ENTRY_CODES } from '@/config/env'
import type {
  Address,
  AdminProduct,
  AfterSaleRequest,
  CraftArchive,
  Order,
  ProductSku,
  ProductStyle,
  QrCode,
  Review,
  Shape,
  ShippingConfig,
  Size,
  StaffAccount,
} from '@/api/contract'

const MERCHANT = appConfig.defaultMerchantId

function combos(productId: string, price: number): ProductSku[] {
  const list: Array<{ size: Size; shape: Shape; stock: number; priceDiff: number }> = [
    { size: 'S', shape: 'SHORT_ROUND', stock: 8, priceDiff: 0 },
    { size: 'S', shape: 'MEDIUM', stock: 6, priceDiff: 0 },
    { size: 'M', shape: 'SHORT_ROUND', stock: 10, priceDiff: 0 },
    { size: 'M', shape: 'LONG_TAPER', stock: 4, priceDiff: 300 },
    { size: 'L', shape: 'MEDIUM', stock: 5, priceDiff: 500 },
    { size: 'OTHER', shape: 'OTHER', stock: 3, priceDiff: 800 },
  ]

  return list.map((item) => ({
    id: `${productId}-${item.size}-${item.shape}`,
    size: item.size,
    shape: item.shape,
    stock: price > 9000 && item.shape === 'MEDIUM' ? 0 : item.stock,
    priceDiff: item.priceDiff,
  }))
}

function buildProduct(
  id: string,
  name: string,
  style: ProductStyle,
  tags: string[],
  price: number,
  sales: number,
  onSale: boolean,
  video?: string,
): AdminProduct {
  const cover = `https://picsum.photos/seed/${id}-cover/640/640`
  const images = [0, 1, 2].map((index) => `https://picsum.photos/seed/${id}-${index}/640/640`)

  return {
    id,
    merchantId: MERCHANT,
    name,
    cover,
    images,
    video,
    style,
    tags,
    price,
    unit: '副',
    piecesPerSet: id === 'p4' ? 12 : 10,
    sales,
    onSale,
    isAccessory: false,
    skus: combos(id, price),
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
  }
}

export const seedProducts: AdminProduct[] = [
  buildProduct('p1', '樱花奶咖', '日式', ['樱花', '奶咖', '短圆', '热门'], 6800, 128, true, 'https://media.w3.org/2010/05/sintel/trailer.mp4'),
  buildProduct('p2', '奶油法式', '法式', ['法式', '奶白', '通勤'], 7800, 96, true),
  buildProduct('p3', '雾霾蓝碎钻', '甜美', ['碎钻', '雾霾蓝', '约会'], 8800, 54, true),
  buildProduct('p4', '裸粉猫眼', '日式', ['猫眼', '裸粉', '12 片'], 5800, 212, true),
  buildProduct('p5', '复古小香', '复古', ['小香', '复古', '长梯'], 9800, 33, true),
  buildProduct('p6', '甜酷黑糖', '甜美', ['黑糖', '甜酷'], 6200, 41, true),
  buildProduct('p7', '珍珠芭蕾', '法式', ['珍珠', '芭蕾'], 8600, 18, false),
  buildProduct('p8', '焦糖格纹', '复古', ['格纹', '焦糖'], 7600, 7, false),
  {
    id: 'p9',
    merchantId: MERCHANT,
    name: '穿戴甲工具包',
    cover: 'https://picsum.photos/seed/p9-cover/640/640',
    images: ['https://picsum.photos/seed/p9-cover/640/640'],
    style: '日式',
    tags: ['工具包', '配件'],
    price: 1800,
    unit: '副',
    piecesPerSet: 0,
    sales: 320,
    onSale: true,
    isAccessory: true,
    skus: [{ id: 'p9-ACC', size: 'M', shape: 'SHORT_ROUND', stock: 99, priceDiff: 0 }],
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
  },
]

export const seedArchives: CraftArchive[] = [
  {
    productId: 'p1',
    materials: [
      { category: 'tip', name: '半贴甲片', spec: 'MD-03', amount: 10, unit: '片' },
      { category: 'gel', name: '奶咖色胶', spec: '#A17', amount: 2, unit: 'g' },
      { category: 'ornament', name: '樱花贴纸', spec: 'KT-12', amount: 5, unit: '张' },
    ],
    steps: [
      {
        order: 1,
        title: '打磨与选片',
        desc: '打磨甲面并挑选与甲床贴合的甲片',
        images: ['https://picsum.photos/seed/craft-p1-1/600/600'],
      },
      {
        order: 2,
        title: '两层打底',
        desc: '两层奶咖色胶打底，逐层照灯 60 秒',
        images: [
          'https://picsum.photos/seed/craft-p1-2/600/600',
          'https://picsum.photos/seed/craft-p1-2b/600/600',
        ],
        video: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      },
      {
        order: 3,
        title: '贴花与封层',
        desc: '贴樱花并封层收边',
        images: ['https://picsum.photos/seed/craft-p1-3/600/600'],
      },
    ],
    cost: { materialCost: 1200, hours: 1.5, suggestedPrice: 7800 },
    updatedAt: '2026-10-21T09:00:00.000Z',
  },
  {
    productId: 'p2',
    materials: [
      { category: 'tip', name: '全贴甲片', spec: 'FR-01', amount: 10, unit: '片' },
      { category: 'gel', name: '奶白色胶', spec: '#F02', amount: 2, unit: 'g' },
    ],
    steps: [
      {
        order: 1,
        title: '修型与微笑线',
        desc: '甲片修型，做出法式微笑线',
        images: ['https://picsum.photos/seed/craft-p2-1/600/600'],
      },
      {
        order: 2,
        title: '描边封层',
        desc: '白色胶描边并封层',
        images: ['https://picsum.photos/seed/craft-p2-2/600/600'],
      },
    ],
    cost: { materialCost: 1500, hours: 1, suggestedPrice: 8800 },
    updatedAt: '2026-10-22T09:00:00.000Z',
  },
  {
    productId: 'p3',
    materials: [
      { category: 'tip', name: '半贴甲片', spec: 'MD-05', amount: 10, unit: '片' },
      { category: 'gel', name: '雾霾蓝胶', spec: '#B23', amount: 2, unit: 'g' },
      { category: 'ornament', name: '碎钻', spec: 'DZ-08', amount: 12, unit: '颗' },
    ],
    steps: [
      {
        order: 1,
        title: '底色两遍',
        desc: '底色两遍并照灯',
        images: ['https://picsum.photos/seed/craft-p3-1/600/600'],
      },
      {
        order: 2,
        title: '点钻加固',
        desc: '点缀碎钻并加固封层',
        images: ['https://picsum.photos/seed/craft-p3-2/600/600'],
      },
    ],
    cost: { materialCost: 2100, hours: 2, suggestedPrice: 10800 },
    updatedAt: '2026-10-23T09:00:00.000Z',
  },
]

export const seedAddresses: Address[] = [
  {
    id: 'a1',
    receiver: '林小满',
    phone: '13800001111',
    region: ['浙江省', '杭州市', '西湖区'],
    detail: '文三路 88 号 3 幢 501',
    isDefault: true,
  },
  {
    id: 'a2',
    receiver: '林小满',
    phone: '13800001111',
    region: ['上海市', '上海市', '徐汇区'],
    detail: '漕溪北路 200 号 9 楼',
    isDefault: false,
  },
]

export const seedOrders: Order[] = [
  {
    id: 'o20261001001',
    merchantId: MERCHANT,
    status: 'pending_pay',
    items: [
      {
        skuId: 'p1-M-SHORT_ROUND',
        productId: 'p1',
        name: '樱花奶咖',
        cover: 'https://picsum.photos/seed/p1-cover/640/640',
        size: 'M',
        shape: 'SHORT_ROUND',
        unit: '副',
        price: 6800,
        quantity: 1,
        isAccessory: false,
      },
    ],
    goodsAmount: 6800,
    shippingFee: 800,
    amount: 7600,
    addressSnapshot: seedAddresses[0],
    customNote: '',
    logistics: null,
    reviewed: false,
    timestamps: { createdAt: Date.now() - 10 * 60 * 1000 },
  },
  {
    id: 'o20261001002',
    merchantId: MERCHANT,
    status: 'pending_ship',
    items: [
      {
        skuId: 'p4-S-SHORT_ROUND',
        productId: 'p4',
        name: '裸粉猫眼',
        cover: 'https://picsum.photos/seed/p4-cover/640/640',
        size: 'S',
        shape: 'SHORT_ROUND',
        unit: '副',
        price: 5800,
        quantity: 2,
        isAccessory: false,
      },
      {
        skuId: 'p9-ACC',
        productId: 'p9',
        name: '穿戴甲工具包',
        cover: 'https://picsum.photos/seed/p9-cover/640/640',
        unit: '件',
        price: 1800,
        quantity: 1,
        isAccessory: true,
      },
    ],
    goodsAmount: 13400,
    shippingFee: 0,
    amount: 13400,
    addressSnapshot: seedAddresses[1],
    customNote: '',
    logistics: null,
    reviewed: false,
    timestamps: { createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, paidAt: Date.now() - 2 * 24 * 60 * 60 * 1000 },
  },
  {
    id: 'o20261001003',
    merchantId: MERCHANT,
    status: 'pending_receive',
    items: [
      {
        skuId: 'p2-M-MEDIUM',
        productId: 'p2',
        name: '奶油法式',
        cover: 'https://picsum.photos/seed/p2-cover/640/640',
        size: 'M',
        shape: 'MEDIUM',
        unit: '副',
        price: 7800,
        quantity: 1,
        isAccessory: false,
      },
    ],
    goodsAmount: 7800,
    shippingFee: 800,
    amount: 8600,
    addressSnapshot: seedAddresses[0],
    customNote: '甲床偏窄，麻烦修窄一点',
    logistics: {
      company: '顺丰速运',
      no: 'SF1234567890',
      traces: [
        { time: '2026-11-03 10:20', text: '快件已从杭州发出' },
        { time: '2026-11-04 08:10', text: '快件到达上海转运中心' },
      ],
    },
    reviewed: false,
    timestamps: {
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      paidAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      shippedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    },
  },
  {
    id: 'o20261001004',
    merchantId: MERCHANT,
    status: 'completed',
    items: [
      {
        skuId: 'p5-L-LONG_TAPER',
        productId: 'p5',
        name: '复古小香',
        cover: 'https://picsum.photos/seed/p5-cover/640/640',
        size: 'L',
        shape: 'LONG_TAPER',
        unit: '副',
        price: 9800,
        quantity: 1,
        isAccessory: false,
      },
    ],
    goodsAmount: 9800,
    shippingFee: 800,
    amount: 10600,
    addressSnapshot: seedAddresses[0],
    customNote: '',
    logistics: {
      company: '中通快递',
      no: 'ZT9988776655',
      traces: [
        { time: '2026-10-28 09:00', text: '快件已签收' },
        { time: '2026-10-27 18:00', text: '快件派送中' },
      ],
    },
    reviewed: false,
    timestamps: {
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      paidAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      shippedAt: Date.now() - 27 * 24 * 60 * 60 * 1000,
      completedAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
    },
  },
]

export const seedReviews: Review[] = [
  {
    id: 'r1',
    merchantId: MERCHANT,
    productId: 'p1',
    orderId: 'o20261001004',
    userId: 'u2',
    nickname: '小鹿',
    rating: 5,
    content: '甲片很薄很贴，颜色比图片还温柔，戴了两周没掉。',
    media: [{ type: 'image', url: 'https://picsum.photos/seed/review-r1/500/500' }],
    visible: true,
    createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'r2',
    merchantId: MERCHANT,
    productId: 'p1',
    orderId: 'o20261001003',
    userId: 'u3',
    nickname: '阿桃',
    rating: 4,
    content: '手残党也能贴好，送的果冻胶很够用。',
    media: [],
    visible: true,
    createdAt: Date.now() - 9 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'r3',
    merchantId: MERCHANT,
    productId: 'p1',
    orderId: 'o20261001002',
    userId: 'u4',
    nickname: '匿名用户',
    rating: 1,
    content: '这条评价已被店主隐藏，用于验证隐藏后用户端不再展示。',
    media: [],
    visible: false,
    createdAt: Date.now() - 12 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'r4',
    merchantId: MERCHANT,
    productId: 'p3',
    orderId: 'o20261001001',
    userId: 'u5',
    nickname: '蓝蓝',
    rating: 5,
    content: '碎钻闪得很高级，录了视频给你们看。',
    media: [{ type: 'video', url: 'https://media.w3.org/2010/05/sintel/trailer.mp4' }],
    visible: true,
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
  },
]

export const seedAfterSales: AfterSaleRequest[] = [
  {
    id: 'as1',
    merchantId: MERCHANT,
    orderId: 'o20261001003',
    userId: 'u1',
    type: 'size',
    description: 'M 码偏大，想换 S 码，已拍甲床照片',
    media: [{ type: 'image', url: 'https://picsum.photos/seed/aftersale-as1/500/500' }],
    status: 'pending',
    createdAt: Date.now() - 12 * 60 * 60 * 1000,
  },
  {
    id: 'as2',
    merchantId: MERCHANT,
    orderId: 'o20261001004',
    userId: 'u1',
    type: 'other',
    description: '咨询补胶水的购买方式，已在客服沟通完毕',
    media: [],
    status: 'resolved',
    createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
  },
]

export const seedStaffAccounts: StaffAccount[] = [
  {
    accountId: 'acc-owner',
    name: '店主小满',
    role: 'owner',
    merchantId: MERCHANT,
    qrCodeId: DEMO_ENTRY_CODES.owner,
    status: 'active',
  },
  {
    accountId: 'acc-artist',
    name: '美甲师阿岚',
    role: 'artist',
    merchantId: MERCHANT,
    qrCodeId: DEMO_ENTRY_CODES.artist,
    status: 'active',
  },
  {
    accountId: 'acc-owner-m2',
    name: '另一主体店主',
    role: 'owner',
    merchantId: 'm2',
    qrCodeId: 'M2-OWNER',
    status: 'active',
  },
]

export const seedQrCodes: QrCode[] = seedStaffAccounts.map((account) => ({
  code: account.qrCodeId,
  accountId: account.accountId,
  merchantId: account.merchantId,
  status: 'active',
}))

export const seedShippingConfigs: ShippingConfig[] = [
  { merchantId: MERCHANT, freeShippingThreshold: 2, flatFee: 800 },
  { merchantId: 'm2', freeShippingThreshold: 3, flatFee: 1000 },
]

export const seedFavorites: Record<string, string[]> = {
  u1: ['p1', 'p3'],
}
