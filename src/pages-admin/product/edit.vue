<template>
  <view class="product-edit admin-theme">
    <view class="block">
      <text class="label">商品名称</text>
      <u-input v-model="form.name" placeholder="如：樱花奶咖" />

      <text class="label second">标签（逗号分隔，用于搜索）</text>
      <u-input v-model="form.tagsText" placeholder="如：樱花,奶咖,短圆" />

      <view class="switch-row">
        <text class="label">工具包等配件（不参与包邮副数）</text>
        <u-switch v-model="form.isAccessory" size="20" />
      </view>
    </view>

    <view class="block">
      <text class="label">展示图链接</text>
      <u-input v-model="form.cover" placeholder="https://..." />
      <text class="label second">轮播图链接（每行一个）</text>
      <u-textarea v-model="form.imagesText" :maxlength="500" placeholder="https://..." />
      <text class="label second">商品视频（选填，最多 1 个）</text>
      <u-input v-model="form.video" placeholder="https://... .mp4" />
    </view>

    <view class="block">
      <text class="label">风格</text>
      <view class="chips">
        <text
          v-for="style in STYLE_OPTIONS"
          :key="style"
          class="chip"
          :class="{ active: form.style === style }"
          @click="form.style = style"
        >
          {{ style }}
        </text>
      </view>
    </view>

    <view class="block">
      <text class="label">售价（元）</text>
      <u-input v-model="form.priceYuan" type="digit" placeholder="如：68" />

      <text class="label second">每副片数</text>
      <view class="chips">
        <text
          v-for="count in [10, 12]"
          :key="count"
          class="chip"
          :class="{ active: form.piecesPerSet === count }"
          @click="form.piecesPerSet = count"
        >
          {{ count }} 片
        </text>
        <text
          class="chip"
          :class="{ active: form.piecesPerSet === 0 }"
          @click="form.piecesPerSet = 0"
        >
          未配置
        </text>
      </view>
    </view>

    <view class="block">
      <text class="label">尺码 × 甲型组合（勾选后可填库存与价差）</text>

      <view v-for="size in SIZE_OPTIONS" :key="size" class="size-group">
        <text class="size-label">{{ SIZE_LABELS[size] }}</text>
        <view class="chips">
          <text
            v-for="shape in SHAPE_OPTIONS"
            :key="shape"
            class="chip"
            :class="{ active: skuForm(size, shape).enabled }"
            @click="toggleSku(size, shape)"
          >
            {{ SHAPE_LABELS[shape] }}
          </text>
        </view>

        <view
          v-for="shape in enabledShapes(size)"
          :key="`${size}-${shape}-row`"
          class="sku-row"
        >
          <text class="sku-name">{{ SHAPE_LABELS[shape] }}</text>
          <view class="sku-field">
            <text class="sku-field-label">库存</text>
            <u-input
              v-model="skuForm(size, shape).stockText"
              type="number"
              custom-style="width: 120rpx"
            />
          </view>
          <view class="sku-field">
            <text class="sku-field-label">价差（元）</text>
            <u-input
              v-model="skuForm(size, shape).priceDiffYuan"
              type="digit"
              custom-style="width: 120rpx"
            />
          </view>
        </view>
      </view>
    </view>

    <u-button type="primary" :loading="saving" @click="submit">保存商品</u-button>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { adminApi } from '@/api/admin'
import { toastError } from '@/api/transport'
import {
  SHAPE_LABELS,
  SHAPE_OPTIONS,
  SIZE_LABELS,
  SIZE_OPTIONS,
  STYLE_OPTIONS,
  type AdminProduct,
  type ProductSku,
  type ProductStyle,
  type Shape,
  type Size,
} from '@/api/contract'
import { useAdminGuard } from '@/utils/admin-guard'

interface SkuForm {
  enabled: boolean
  stockText: string
  priceDiffYuan: string
}

const form = reactive<{
  id: string
  name: string
  cover: string
  imagesText: string
  video: string
  tagsText: string
  style: ProductStyle
  priceYuan: string
  piecesPerSet: number
  isAccessory: boolean
  sales: number
  onSale: boolean
  createdAt: string
}>({
  id: '',
  name: '',
  cover: '',
  imagesText: '',
  video: '',
  tagsText: '',
  style: '日式',
  priceYuan: '',
  piecesPerSet: 10,
  isAccessory: false,
  sales: 0,
  onSale: false,
  createdAt: '',
})

const skuMap = reactive<Record<string, SkuForm>>({})
SIZE_OPTIONS.forEach((size) => {
  SHAPE_OPTIONS.forEach((shape) => {
    skuMap[`${size}-${shape}`] = { enabled: false, stockText: '0', priceDiffYuan: '0' }
  })
})

const saving = ref(false)
let guarded = false

function skuForm(size: Size, shape: Shape): SkuForm {
  return skuMap[`${size}-${shape}`]
}

function toggleSku(size: Size, shape: Shape): void {
  const target = skuForm(size, shape)
  target.enabled = !target.enabled
}

function enabledShapes(size: Size): Shape[] {
  return SHAPE_OPTIONS.filter((shape) => skuForm(size, shape).enabled)
}

function toCents(yuan: string): number {
  const value = Number(yuan)
  return Number.isFinite(value) ? Math.round(value * 100) : 0
}

onLoad(async (options) => {
  guarded = useAdminGuard('product:write')
  const id = options?.id
  if (!guarded || !id) {
    return
  }

  try {
    const target = await adminApi.getProduct(id)
    form.id = target.id
    form.name = target.name
    form.cover = target.cover
    form.imagesText = target.images.join('\n')
    form.video = target.video ?? ''
    form.tagsText = target.tags.join(',')
    form.style = target.style
    form.priceYuan = (target.price / 100).toFixed(2)
    form.piecesPerSet = target.piecesPerSet
    form.isAccessory = target.isAccessory
    form.sales = target.sales
    form.onSale = target.onSale
    form.createdAt = target.createdAt

    target.skus.forEach((sku) => {
      const item = skuForm(sku.size, sku.shape)
      item.enabled = true
      item.stockText = String(sku.stock)
      item.priceDiffYuan = (sku.priceDiff / 100).toFixed(2)
    })
  } catch (error) {
    toastError(error)
  }
})

async function submit(): Promise<void> {
  if (!guarded) {
    return
  }
  if (!form.name.trim()) {
    uni.showToast({ title: '请填写商品名称', icon: 'none' })
    return
  }
  if (toCents(form.priceYuan) <= 0) {
    uni.showToast({ title: '请填写有效售价', icon: 'none' })
    return
  }

  const images = form.imagesText
    .split(/[\n,，]+/)
    .map((item) => item.trim())
    .filter(Boolean)

  const skus: ProductSku[] = []
  SIZE_OPTIONS.forEach((size) => {
    SHAPE_OPTIONS.forEach((shape) => {
      const item = skuForm(size, shape)
      if (!item.enabled) {
        return
      }
      const stock = Number(item.stockText)
      skus.push({
        id: `${form.id || 'new'}-${size}-${shape}`,
        size,
        shape,
        stock: Number.isFinite(stock) && stock >= 0 ? Math.floor(stock) : 0,
        priceDiff: toCents(item.priceDiffYuan),
      })
    })
  })

  if (skus.length === 0) {
    uni.showToast({ title: '至少配置一个规格组合', icon: 'none' })
    return
  }

  const product: AdminProduct = {
    id: form.id,
    merchantId: '',
    name: form.name.trim(),
    cover: form.cover || images[0] || '',
    images: images.length > 0 ? images : [form.cover].filter(Boolean),
    video: form.video.trim() || undefined,
    style: form.style,
    tags: form.tagsText
      .split(/[,，\s]+/)
      .map((item) => item.trim())
      .filter(Boolean),
    price: toCents(form.priceYuan),
    unit: '副',
    piecesPerSet: form.isAccessory ? 0 : form.piecesPerSet,
    sales: form.sales,
    onSale: form.onSale,
    isAccessory: form.isAccessory,
    skus,
    createdAt: form.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  saving.value = true
  try {
    await adminApi.saveProduct(product)
    uni.showToast({ title: '已保存', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 400)
  } catch (error) {
    toastError(error)
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.product-edit {
  min-height: 100vh;
  padding: 28rpx;
  background-color: $app-color-admin-bg;
}

.block {
  margin-bottom: $app-space-base;
  padding: $app-space-base;
  background-color: #fff;
  border-radius: $app-radius-base;
}

.label {
  display: block;
  margin-bottom: $app-space-xs;
  font-size: $app-font-sm;
  color: $app-color-text;
}

.second {
  margin-top: $app-space-sm;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: $app-space-sm;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: $app-space-xs;
}

.chip {
  margin: 0 $app-space-xs $app-space-xs 0;
  padding: 8rpx 20rpx;
  font-size: $app-font-sm;
  color: $app-color-text;
  background-color: $app-color-input-bg;
  border-radius: $app-radius-sm;
}

.active {
  color: #fff;
  background-color: $app-color-primary;
}

.size-group {
  margin-top: $app-space-sm;
  padding-top: $app-space-sm;
  border-top: 1rpx solid $app-color-border;
}

.size-label {
  font-size: $app-font-base;
  color: $app-color-text;
  font-weight: 600;
}

.sku-row {
  display: flex;
  align-items: center;
  margin-top: $app-space-xs;
}

.sku-name {
  width: 120rpx;
  font-size: $app-font-sm;
  color: $app-color-text;
}

.sku-field {
  display: flex;
  align-items: center;
  margin-right: $app-space-sm;
}

.sku-field-label {
  margin-right: $app-space-xs;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}
</style>
