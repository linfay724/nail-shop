<template>
  <view class="product-list">
    <u-tabs :list="styleTabs" :current="styleIndex" @change="onStyleChange" />

    <view class="chips">
      <text class="chip" :class="{ active: shape === '' }" @click="selectShape('')">全部甲型</text>
      <text
        v-for="item in SHAPE_OPTIONS"
        :key="item"
        class="chip"
        :class="{ active: shape === item }"
        @click="selectShape(item)"
      >
        {{ item }}
      </text>
      <text class="clear" @click="clearFilters">清空筛选</text>
    </view>

    <view v-if="loading" class="hint">加载中…</view>
    <u-empty v-else-if="list.length === 0" mode="list" text="没有符合条件的商品" />
    <view v-else class="grid">
      <product-card v-for="item in list" :key="item.id" :product="item" @click="openDetail" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { productApi } from '@/api/product'
import { SHAPE_OPTIONS, STYLE_OPTIONS } from '@/api/contract'
import type { ProductShape, PublicProduct } from '@/api/contract'
import ProductCard from '@/components/product-card.vue'
import { getStorage, removeStorage, setStorage } from '@/utils/storage'

interface ProductFilter {
  style?: string
  shape?: string
}

const styleIndex = ref(0)
const shape = ref<ProductShape | ''>('')
const list = ref<PublicProduct[]>([])
const loading = ref(false)

const styleTabs = computed(() => [{ name: '全部' }, ...STYLE_OPTIONS.map((style) => ({ name: style }))])

async function load(): Promise<void> {
  loading.value = true
  try {
    const style = styleIndex.value === 0 ? undefined : STYLE_OPTIONS[styleIndex.value - 1]
    list.value = await productApi.list({ style, shape: shape.value || undefined })
  } catch (error) {
    console.warn('[product/list] load failed', error)
  } finally {
    loading.value = false
  }
}

function onStyleChange(index: number): void {
  styleIndex.value = index
  persistFilter()
  void load()
}

function selectShape(value: ProductShape | ''): void {
  shape.value = value
  persistFilter()
  void load()
}

function clearFilters(): void {
  styleIndex.value = 0
  shape.value = ''
  persistFilter()
  void load()
}

function persistFilter(): void {
  const filter: ProductFilter = {}
  if (styleIndex.value > 0) {
    filter.style = STYLE_OPTIONS[styleIndex.value - 1]
  }
  if (shape.value) {
    filter.shape = shape.value
  }
  setStorage('product_filter', filter)
}

function applyIncomingFilter(): void {
  const filter = getStorage<ProductFilter | null>('product_filter', null)
  if (!filter) {
    return
  }

  styleIndex.value = filter.style ? Math.max(0, STYLE_OPTIONS.indexOf(filter.style as never) + 1) : 0
  shape.value = (filter.shape as ProductShape | undefined) ?? ''
  removeStorage('product_filter')
}

function openDetail(product: PublicProduct): void {
  uni.navigateTo({ url: `/pages/product/detail?id=${product.id}` })
}

onShow(() => {
  applyIncomingFilter()
  void load()
})
</script>

<style lang="scss" scoped>
.product-list {
  min-height: 100vh;
  padding-bottom: $app-space-lg;
  background-color: $app-color-bg;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: $app-space-sm $app-space-base;
}

.chip {
  margin: 0 $app-space-xs $app-space-xs 0;
  padding: 8rpx 24rpx;
  font-size: $app-font-sm;
  color: $app-color-text;
  background-color: #fff;
  border-radius: $app-radius-pill;
  border: 2rpx solid $app-color-border;
}

.active {
  color: $app-color-primary-dark;
  background-color: $app-color-primary-light;
  border-color: #ffd9e8;
}

.clear {
  margin-left: auto;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.hint {
  padding: $app-space-lg 0;
  text-align: center;
  font-size: $app-font-sm;
  color: $app-color-text-secondary;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $app-space-sm;
  padding: 0 $app-space-base;
}
</style>
