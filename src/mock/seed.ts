import type { Address, AdminProduct, CraftArchive, Order, ProductSku, ProductShape, ProductStyle } from '@/api/contract'

function buildSkus(productId: string, basePrice: number): ProductSku[] {
  const sizes = ['S', 'M', 'L']

  return sizes.flatMap((size, sizeIndex) =>
    [10, 20].map((pieceCount, index) => ({
      id: `${productId}-${size}-${pieceCount}`,
      size,
      pieceCount,
      stock: sizeIndex === 2 && index === 1 ? 0 : 6 + sizeIndex * 4 + index * 3,
      priceDelta: pieceCount === 20 ? 1000 : basePrice > 8000 ? 500 : 0,
    })),
  )
}

function buildProduct(
  id: string,
  name: string,
  style: ProductStyle,
  shape: ProductShape,
  price: number,
  sales: number,
  onSale: boolean,
): AdminProduct {
  const cover = `https://picsum.photos/seed/${id}-cover/640/640`
  const images = [0, 1, 2].map((index) => `https://picsum.photos/seed/${id}-${index}/640/640`)

  return {
    id,
    name,
    cover,
    style,
    shape,
    price,
    sales,
    onSale,
    images,
    skus: buildSkus(id, price),
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
  }
}

export const seedProducts: AdminProduct[] = [
  buildProduct('p1', '樱花奶咖', '日式', '方甲', 6800, 128, true),
  buildProduct('p2', '奶油法式', '法式', '杏仁甲', 7800, 96, true),
  buildProduct('p3', '雾霾蓝碎钻', '甜美', '圆甲', 8800, 54, true),
  buildProduct('p4', '裸粉猫眼', '日式', '方甲', 5800, 212, true),
  buildProduct('p5', '复古小香', '复古', '芭蕾甲', 9800, 33, true),
  buildProduct('p6', '甜酷黑糖', '甜美', '杏仁甲', 6200, 41, true),
  buildProduct('p7', '珍珠芭蕾', '法式', '芭蕾甲', 8600, 18, false),
  buildProduct('p8', '焦糖格纹', '复古', '方甲', 7600, 7, false),
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
      { order: 1, description: '打磨甲面并挑选合适甲片', images: ['https://picsum.photos/seed/craft-p1-1/600/600'] },
      { order: 2, description: '两层奶咖色胶打底，逐层照灯', images: ['https://picsum.photos/seed/craft-p1-2/600/600'] },
      { order: 3, description: '贴樱花并封层收边', images: ['https://picsum.photos/seed/craft-p1-3/600/600'] },
    ],
    materialCost: 1200,
    otherCost: 800,
    updatedAt: '2026-10-21T09:00:00.000Z',
  },
  {
    productId: 'p2',
    materials: [
      { category: 'tip', name: '全贴甲片', spec: 'FR-01', amount: 10, unit: '片' },
      { category: 'gel', name: '奶白色胶', spec: '#F02', amount: 2, unit: 'g' },
    ],
    steps: [
      { order: 1, description: '甲片修型，做出法式微笑线', images: ['https://picsum.photos/seed/craft-p2-1/600/600'] },
      { order: 2, description: '白色胶描边并封层', images: ['https://picsum.photos/seed/craft-p2-2/600/600'] },
    ],
    materialCost: 1500,
    otherCost: 600,
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
      { order: 1, description: '底色两遍并照灯', images: ['https://picsum.photos/seed/craft-p3-1/600/600'] },
      { order: 2, description: '点缀碎钻并加固封层', images: ['https://picsum.photos/seed/craft-p3-2/600/600'] },
    ],
    materialCost: 2100,
    otherCost: 900,
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
    status: 'pending_pay',
    items: [
      {
        skuId: 'p1-M-10',
        productId: 'p1',
        name: '樱花奶咖',
        cover: 'https://picsum.photos/seed/p1-cover/640/640',
        size: 'M',
        pieceCount: 10,
        price: 6800,
        quantity: 1,
      },
    ],
    amount: 6800,
    addressSnapshot: seedAddresses[0],
    remark: '希望周四前发出',
    logistics: null,
    afterSale: null,
    timestamps: { createdAt: Date.now() - 10 * 60 * 1000 },
  },
  {
    id: 'o20261001002',
    status: 'pending_ship',
    items: [
      {
        skuId: 'p4-S-10',
        productId: 'p4',
        name: '裸粉猫眼',
        cover: 'https://picsum.photos/seed/p4-cover/640/640',
        size: 'S',
        pieceCount: 10,
        price: 5800,
        quantity: 2,
      },
    ],
    amount: 11600,
    addressSnapshot: seedAddresses[1],
    remark: '',
    logistics: null,
    afterSale: null,
    timestamps: { createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, paidAt: Date.now() - 2 * 24 * 60 * 60 * 1000 },
  },
  {
    id: 'o20261001003',
    status: 'pending_receive',
    items: [
      {
        skuId: 'p2-M-20',
        productId: 'p2',
        name: '奶油法式',
        cover: 'https://picsum.photos/seed/p2-cover/640/640',
        size: 'M',
        pieceCount: 20,
        price: 8800,
        quantity: 1,
      },
    ],
    amount: 8800,
    addressSnapshot: seedAddresses[0],
    remark: '',
    logistics: {
      company: '顺丰速运',
      no: 'SF1234567890',
      traces: [
        { time: '2026-11-03 10:20', text: '快件已从杭州发出' },
        { time: '2026-11-04 08:10', text: '快件到达上海转运中心' },
      ],
    },
    afterSale: null,
    timestamps: {
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      paidAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      shippedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    },
  },
  {
    id: 'o20261001004',
    status: 'completed',
    items: [
      {
        skuId: 'p5-L-10',
        productId: 'p5',
        name: '复古小香',
        cover: 'https://picsum.photos/seed/p5-cover/640/640',
        size: 'L',
        pieceCount: 10,
        price: 9800,
        quantity: 1,
      },
    ],
    amount: 9800,
    addressSnapshot: seedAddresses[0],
    remark: '',
    logistics: {
      company: '中通快递',
      no: 'ZT9988776655',
      traces: [
        { time: '2026-10-28 09:00', text: '快件已签收' },
        { time: '2026-10-27 18:00', text: '快件派送中' },
      ],
    },
    afterSale: null,
    timestamps: {
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      paidAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      shippedAt: Date.now() - 27 * 24 * 60 * 60 * 1000,
      completedAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
    },
  },
]

export const seedFavorites: string[] = ['p1', 'p3']
