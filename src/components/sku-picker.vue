<template>
  <u-popup :show="show" mode="bottom" :border-radius="24" @close="close">
    <view class="sku-picker">
      <view class="header">
        <image class="cover" :src="product?.cover" mode="aspectFill" />
        <view class="head-info">
          <price-tag :price="currentPrice" />
          <text class="stock">{{ stockText }}</text>
        </view>
      </view>

      <view class="group">
        <text class="group-title">尺码</text>
        <view class="chips">
          <text
            v-for="size in sizes"
            :key="size"
            class="chip"
            :class="{ active: selectedSize === size }"
            @click="selectedSize = size"
          >
            {{ size }}
          </text>
        </view>
      </view>

      <view class="group">
        <text class="group-title">甲片数量</text>
        <view class="chips">
          <text
            v-for="count in pieceCounts"
            :key="count"
            class="chip"
            :class="{ active: selectedPieceCount === count }"
            @click="selectedPieceCount = count"
          >
            {{ count }} 片
          </text>
        </view>
      </view>

      <view class="group quantity">
        <text class="group-title">数量</text>
        <u-number-box v-model="quantity" :min="1" :max="Math.max(selectedSku?.stock ?? 1, 1)" />
      </view>

      <text class="guide" @click="openGuide">如何测量尺码 ›</text>

      <view class="actions">
        <u-button :disabled="!purchasable" custom-style="flex: 1" @click="confirm('cart')">
          加入购物车
        </u-button>
        <u-button
          type="primary"
          :disabled="!purchasable"
          custom-style="flex: 1; margin-left: 20rpx"
          @click="confirm('buy')"
        >
          立即购买
        </u-button>
      </view>
    </view>
  </u-popup>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ProductSku, PublicProductDetail } from '@/api/contract'
import PriceTag from '@/components/price-tag.vue'

const props = defineProps<{ show: boolean; product: PublicProductDetail | null }>()
const emit = defineEmits<{
  (event: 'update:show', value: boolean): void
  (event: 'confirm', payload: { sku: ProductSku; quantity: number; mode: 'cart' | 'buy' }): void
}>()

const selectedSize = ref('')
const selectedPieceCount = ref(0)
const quantity = ref(1)

const sizes = computed(() => Array.from(new Set(props.product?.skus.map((sku) => sku.size) ?? [])))
const pieceCounts = computed(() =>
  Array.from(
    new Set(
      (props.product?.skus ?? [])
        .filter((sku) => !selectedSize.value || sku.size === selectedSize.value)
        .map((sku) => sku.pieceCount),
    ),
  ),
)

const selectedSku = computed<ProductSku | null>(() => {
  if (!props.product || !selectedSize.value || !selectedPieceCount.value) {
    return null
  }

  return (
    props.product.skus.find(
      (sku) => sku.size === selectedSize.value && sku.pieceCount === selectedPieceCount.value,
    ) ?? null
  )
})

const purchasable = computed(() => Boolean(selectedSku.value && selectedSku.value.stock > 0))
const currentPrice = computed(
  () => (props.product?.price ?? 0) + (selectedSku.value?.priceDelta ?? 0),
)
const stockText = computed(() => (selectedSku.value ? `库存 ${selectedSku.value.stock} 件` : '请选择规格'))

watch(
  () => props.show,
  (visible) => {
    if (visible) {
      selectedSize.value = ''
      selectedPieceCount.value = 0
      quantity.value = 1
    }
  },
)

watch(selectedSize, () => {
  selectedPieceCount.value = 0
})

function close(): void {
  emit('update:show', false)
}

function openGuide(): void {
  uni.navigateTo({ url: '/pages-user/guide/size' })
}

function confirm(mode: 'cart' | 'buy'): void {
  if (!selectedSku.value) {
    uni.showToast({ title: '请先选择规格', icon: 'none' })
    return
  }

  if (selectedSku.value.stock <= 0) {
    uni.showToast({ title: '该规格已售罄', icon: 'none' })
    return
  }

  emit('confirm', { sku: selectedSku.value, quantity: quantity.value, mode })
  emit('update:show', false)
}
</script>

<style lang="scss" scoped>
.sku-picker {
  padding: $app-space-base;
}

.header {
  display: flex;
  align-items: center;
}

.cover {
  width: 160rpx;
  height: 160rpx;
  border-radius: $app-radius-base;
}

.head-info {
  display: flex;
  flex-direction: column;
  margin-left: $app-space-sm;
}

.stock {
  margin-top: $app-space-xs;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.group {
  margin-top: $app-space-base;
}

.group-title {
  font-size: $app-font-sm;
  color: $app-color-text;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  margin-top: $app-space-xs;
}

.chip {
  margin: 0 $app-space-xs $app-space-xs 0;
  padding: 10rpx 28rpx;
  font-size: $app-font-sm;
  color: $app-color-text;
  background-color: #f7f6fb;
  border-radius: $app-radius-pill;
  border: 2rpx solid transparent;
}

.active {
  color: $app-color-primary-dark;
  background-color: $app-color-primary-light;
  border-color: #ffd9e8;
}

.quantity {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.guide {
  display: inline-block;
  margin-top: $app-space-sm;
  font-size: $app-font-sm;
  color: $app-color-primary;
}

.actions {
  display: flex;
  margin-top: $app-space-base;
}
</style>
