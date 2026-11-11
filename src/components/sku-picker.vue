<template>
  <u-popup v-model="popupVisible" mode="bottom" :border-radius="24" @close="close">
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
            v-for="size in SIZE_OPTIONS"
            :key="size"
            class="chip"
            :class="{ active: selectedSize === size, disabled: !sizeAvailable(size) }"
            @click="pickSize(size)"
          >
            {{ SIZE_LABELS[size] }}
          </text>
        </view>
      </view>

      <view class="group">
        <text class="group-title">甲型</text>
        <view class="chips">
          <text
            v-for="shape in SHAPE_OPTIONS"
            :key="shape"
            class="chip"
            :class="{ active: selectedShape === shape, disabled: shapeState(shape) !== 'ok' }"
            @click="pickShape(shape)"
          >
            {{ SHAPE_LABELS[shape] }}
          </text>
        </view>
      </view>

      <view v-if="needsCustomNote" class="hint">选择「其他」需在下单页填写定制备注</view>

      <view class="group quantity">
        <text class="group-title">数量（副）</text>
        <u-number-box v-model="quantity" :min="1" :max="Math.max(selectedSku?.stock ?? 1, 1)" />
      </view>

      <view class="actions">
        <u-button type="primary" :disabled="!purchasable" custom-style="flex: 1" @click="confirm">
          确认
        </u-button>
      </view>
    </view>
  </u-popup>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  SHAPE_LABELS,
  SHAPE_OPTIONS,
  SIZE_LABELS,
  SIZE_OPTIONS,
  type ProductSku,
  type PublicProductDetail,
  type Shape,
  type Size,
} from '@/api/contract'
import PriceTag from '@/components/price-tag.vue'

const props = defineProps<{ show: boolean; product: PublicProductDetail | null }>()
const emit = defineEmits<{
  (event: 'update:show', value: boolean): void
  (event: 'confirm', payload: { sku: ProductSku; quantity: number }): void
}>()

/** uview-pro 的 u-popup 只响应 v-model（modelValue），这里桥接 show prop */
const popupVisible = computed({
  get: () => props.show,
  set: (value: boolean) => emit('update:show', value),
})

const selectedSize = ref<Size | null>(null)
const selectedShape = ref<Shape | null>(null)
const quantity = ref(1)

function skuOf(size: Size, shape: Shape): ProductSku | undefined {
  return props.product?.skus.find((sku) => sku.size === size && sku.shape === shape)
}

function sizeAvailable(size: Size): boolean {
  return (props.product?.skus ?? []).some((sku) => sku.size === size)
}

function shapeState(shape: Shape): 'ok' | 'missing' | 'soldout' {
  if (!selectedSize.value) {
    return 'missing'
  }
  const sku = skuOf(selectedSize.value, shape)
  if (!sku) {
    return 'missing'
  }
  return sku.stock > 0 ? 'ok' : 'soldout'
}

const selectedSku = computed<ProductSku | null>(() => {
  if (!selectedSize.value || !selectedShape.value) {
    return null
  }
  return skuOf(selectedSize.value, selectedShape.value) ?? null
})

const needsCustomNote = computed(
  () => selectedSize.value === 'OTHER' || selectedShape.value === 'OTHER',
)

const purchasable = computed(() => Boolean(selectedSku.value && selectedSku.value.stock > 0))
const currentPrice = computed(
  () => (props.product?.price ?? 0) + (selectedSku.value?.priceDiff ?? 0),
)
const stockText = computed(() => {
  if (!selectedSize.value) {
    return '请选择尺码'
  }
  if (!selectedShape.value) {
    return '请选择甲型'
  }
  if (!selectedSku.value) {
    return '该组合未提供'
  }
  if (selectedSku.value.stock <= 0) {
    return '该组合已售罄'
  }
  return `库存 ${selectedSku.value.stock} 副`
})

watch(
  () => props.show,
  (visible) => {
    if (visible) {
      selectedSize.value = null
      selectedShape.value = null
      quantity.value = 1
    }
  },
)

function pickSize(size: Size): void {
  if (!sizeAvailable(size)) {
    uni.showToast({ title: '该尺码未提供', icon: 'none' })
    return
  }
  selectedSize.value = size
  selectedShape.value = null
}

function pickShape(shape: Shape): void {
  const state = shapeState(shape)
  if (state === 'missing') {
    uni.showToast({ title: '该组合未提供', icon: 'none' })
    return
  }
  if (state === 'soldout') {
    uni.showToast({ title: '该组合已售罄', icon: 'none' })
    return
  }
  selectedShape.value = shape
}

function close(): void {
  emit('update:show', false)
}

function confirm(): void {
  if (!selectedSku.value) {
    uni.showToast({ title: '请先选择尺码与甲型', icon: 'none' })
    return
  }

  if (selectedSku.value.stock <= 0) {
    uni.showToast({ title: '该组合已售罄', icon: 'none' })
    return
  }

  emit('confirm', { sku: selectedSku.value, quantity: quantity.value })
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
  width: 120rpx;
  height: 120rpx;
  border-radius: 20rpx;
  background-color: $app-color-input-bg;
}

.head-info {
  display: flex;
  flex-direction: column;
  margin-left: 20rpx;
}

.stock {
  margin-top: 8rpx;
  font-size: 20rpx;
  color: $app-color-text-muted;
}

.group {
  margin-top: 24rpx;
}

.group-title {
  font-size: 22rpx;
  color: $app-color-text-secondary;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  margin-top: 10rpx;
}

.chip {
  margin: 0 12rpx 12rpx 0;
  padding: 10rpx 20rpx;
  font-size: 22rpx;
  color: $app-color-text-secondary;
  background-color: $app-color-white;
  border: 1rpx solid $app-color-border;
  border-radius: 20rpx;
}

.active {
  color: $app-color-primary-dark;
  background-color: $app-color-primary-light;
  border-color: $app-color-primary-hover;
}

.disabled {
  color: #c8bfbd;
  background-color: #f5f2f1;
  text-decoration: line-through;
}

/* 与原型 .note 一致 */
.hint {
  margin-top: 16rpx;
  padding: 18rpx;
  font-size: 20rpx;
  line-height: 1.5;
  color: $app-color-warning-text;
  background-color: $app-color-warning-bg-soft;
  border: 1rpx dashed $app-color-warning;
  border-radius: 20rpx;
}

.quantity {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.actions {
  display: flex;
  margin-top: 28rpx;
}
</style>
