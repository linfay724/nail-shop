<template>
  <view class="product-edit">
    <view class="block">
      <text class="label">商品名称</text>
      <u-input v-model="form.name" placeholder="如：樱花奶咖" />
    </view>

    <view class="block">
      <text class="label">展示图链接</text>
      <u-input v-model="form.cover" placeholder="https://..." />
      <text class="label second">轮播图链接（每行一个）</text>
      <u-textarea v-model="form.imagesText" :maxlength="500" placeholder="https://..." />
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
      <text class="label second">甲型</text>
      <view class="chips">
        <text
          v-for="shape in SHAPE_OPTIONS"
          :key="shape"
          class="chip"
          :class="{ active: form.shape === shape }"
          @click="form.shape = shape"
        >
          {{ shape }}
        </text>
      </view>
    </view>

    <view class="block">
      <text class="label">售价（元）</text>
      <u-input v-model="form.priceYuan" type="digit" placeholder="如：68" />
    </view>

    <view class="block">
      <text class="label">规格与库存</text>
      <view v-for="(sku, index) in form.skus" :key="`${sku.size}-${sku.pieceCount}`" class="sku-row">
        <text class="sku-name">{{ sku.size }} · {{ sku.pieceCount }} 片</text>
        <view class="sku-field">
          <text class="sku-field-label">库存</text>
          <u-input v-model="sku.stockText" type="number" custom-style="width: 120rpx" />
        </view>
        <view class="sku-field">
          <text class="sku-field-label">加价（元）</text>
          <u-input v-model="sku.priceDeltaYuan" type="digit" custom-style="width: 120rpx" />
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
import { SHAPE_OPTIONS, STYLE_OPTIONS } from '@/api/contract'
import type { AdminProduct, ProductShape, ProductSku, ProductStyle } from '@/api/contract'
import { useAdminGuard } from '@/utils/admin-guard'

interface SkuForm {
  id: string
  size: string
  pieceCount: number
  stockText: string
  priceDeltaYuan: string
}

const form = reactive<{
  id: string
  name: string
  cover: string
  imagesText: string
  style: ProductStyle
  shape: ProductShape
  priceYuan: string
  skus: SkuForm[]
  createdAt: string
}>({
  id: '',
  name: '',
  cover: '',
  imagesText: '',
  style: '日式',
  shape: '方甲',
  priceYuan: '',
  skus: ['S', 'M', 'L'].flatMap((size) =>
    [10, 20].map((pieceCount) => ({
      id: '',
      size,
      pieceCount,
      stockText: '0',
      priceDeltaYuan: '0',
    })),
  ),
  createdAt: '',
})

const saving = ref(false)
let guarded = false

function toCents(yuan: string): number {
  const value = Number(yuan)
  return Number.isFinite(value) ? Math.round(value * 100) : 0
}

onLoad(async (options) => {
  guarded = useAdminGuard()
  const id = options?.id
  if (!guarded || !id) {
    return
  }

  try {
    const list = await adminApi.listProducts()
    const target = list.find((item) => item.id === id)
    if (!target) {
      return
    }
    form.id = target.id
    form.name = target.name
    form.cover = target.cover
    form.imagesText = target.images.join('\n')
    form.style = target.style
    form.shape = target.shape
    form.priceYuan = (target.price / 100).toFixed(2)
    form.createdAt = target.createdAt
    form.skus = target.skus.map((sku) => ({
      id: sku.id,
      size: sku.size,
      pieceCount: sku.pieceCount,
      stockText: String(sku.stock),
      priceDeltaYuan: ((sku.priceDelta ?? 0) / 100).toFixed(2),
    }))
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
  const skus: ProductSku[] = form.skus.map((sku) => {
    const stock = Number(sku.stockText)
    return {
      id: sku.id || `${form.id || 'new'}-${sku.size}-${sku.pieceCount}`,
      size: sku.size,
      pieceCount: sku.pieceCount,
      stock: Number.isFinite(stock) && stock >= 0 ? Math.floor(stock) : 0,
      priceDelta: toCents(sku.priceDeltaYuan),
    }
  })

  if (skus.some((sku) => !Number.isFinite(sku.stock) || sku.stock < 0)) {
    uni.showToast({ title: '库存必须为非负整数', icon: 'none' })
    return
  }

  const product: AdminProduct = {
    id: form.id,
    name: form.name.trim(),
    cover: form.cover || images[0] || '',
    images: images.length > 0 ? images : [form.cover].filter(Boolean),
    style: form.style,
    shape: form.shape,
    price: toCents(form.priceYuan),
    sales: 0,
    onSale: false,
    skus,
    createdAt: form.createdAt,
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
  padding: $app-space-base;
  background-color: $app-color-bg;
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
  background-color: #f5f5f5;
  border-radius: $app-radius-sm;
}

.active {
  color: #fff;
  background-color: $app-color-primary;
}

.sku-row {
  display: flex;
  align-items: center;
  margin-top: $app-space-xs;
}

.sku-name {
  width: 180rpx;
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
