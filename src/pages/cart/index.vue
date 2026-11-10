<template>
  <view class="cart">
    <u-empty v-if="cart.lines.length === 0" mode="car" text="购物车还是空的" />

    <view v-else class="list">
      <view v-for="line in cart.lines" :key="line.skuId" class="line" :class="{ invalid: line.snapshot.stock <= 0 }">
        <u-checkbox
          :model-value="line.selected"
          :disabled="line.snapshot.stock <= 0"
          @change="() => cart.toggle(line.skuId)"
        />
        <image class="cover" :src="line.snapshot.cover" mode="aspectFill" />
        <view class="info">
          <text class="name">{{ line.snapshot.name }}</text>
          <text class="spec">{{ specOf(line) }}</text>
          <view class="price-row">
            <price-tag :price="line.snapshot.price" />
            <u-number-box
              v-if="line.snapshot.stock > 0"
              :model-value="line.quantity"
              :min="1"
              :max="line.snapshot.stock"
              @change="createNumberHandler(line.skuId)"
            />
          </view>
          <text v-if="line.snapshot.stock <= 0" class="invalid-tip">已失效（商品下架或售罄）</text>
          <text class="remove" @click="removeLine(line.skuId)">删除</text>
        </view>
      </view>
    </view>

    <view v-if="cart.lines.length > 0 && cart.paidSets > 0" class="shipping-tip">
      <text class="shipping-tip-text">已选商品共 {{ cart.paidSets }} 副，{{ shippingHint }}</text>
    </view>

    <view v-if="cart.lines.length > 0" class="bottom-bar">
      <u-checkbox :model-value="cart.allSelected" @change="onToggleAll">全选</u-checkbox>
      <view class="summary">
        <text class="total">合计 {{ formatPrice(cart.totalAmount) }}</text>
        <text class="count">共 {{ cart.paidSets }} 副</text>
      </view>
      <u-button type="primary" :disabled="cart.selectedLines.length === 0" @click="checkout">
        去结算
      </u-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useCartStore } from '@/stores/cart'
import { useSessionStore } from '@/stores/session'
import { useShippingStore } from '@/stores/shipping'
import { SHAPE_LABELS, SIZE_LABELS, type CartLine, type OrderItem } from '@/api/contract'
import PriceTag from '@/components/price-tag.vue'
import { formatPrice } from '@/utils/price'
import { setStorage } from '@/utils/storage'

const cart = useCartStore()
const session = useSessionStore()
const shipping = useShippingStore()

const shippingHint = computed(() => {
  const config = shipping.config
  if (cart.paidSets >= config.freeShippingThreshold) {
    return `满足满 ${config.freeShippingThreshold} 副包邮`
  }
  return `再买 ${config.freeShippingThreshold - cart.paidSets} 副包邮`
})

function specOf(line: CartLine): string {
  if (line.isAccessory || !line.size || !line.shape) {
    return '工具包 · 配件'
  }
  return `${SIZE_LABELS[line.size]} / ${SHAPE_LABELS[line.shape]} · ${line.snapshot.piecesPerSet} 片/副`
}

function onQuantityChange(skuId: string, value: number): void {
  const ok = cart.updateQuantity(skuId, value)
  if (!ok && value > 0) {
    uni.showToast({ title: '已达库存上限', icon: 'none' })
  }
}

function createNumberHandler(skuId: string) {
  return (payload: { value: number }): void => onQuantityChange(skuId, payload.value)
}

function onToggleAll(): void {
  cart.toggleAll(!cart.allSelected)
}

function removeLine(skuId: string): void {
  uni.showModal({
    title: '删除商品',
    content: '确定从购物车移除该规格吗？',
    success: (result) => {
      if (result.confirm) {
        cart.remove(skuId)
      }
    },
  })
}

function checkout(): void {
  const items: OrderItem[] = cart.selectedLines.map((line) => ({
    skuId: line.skuId,
    productId: line.productId,
    name: line.snapshot.name,
    cover: line.snapshot.cover,
    size: line.size,
    shape: line.shape,
    unit: line.snapshot.unit,
    price: line.snapshot.price,
    quantity: line.quantity,
    isAccessory: line.isAccessory,
  }))

  setStorage('checkout_items', items)
  uni.navigateTo({ url: '/pages-user/checkout/index' })
}

onShow(() => {
  cart.sanitize()
  void shipping.load()
  if (session.isLoggedIn) {
    void cart.load()
  }
})
</script>

<style lang="scss" scoped>
.cart {
  min-height: 100vh;
  padding: 28rpx 28rpx 200rpx;
  background-color: $app-color-bg;
}

.line {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20rpx;
  padding: 20rpx;
  background-color: $app-color-white;
  border: 1rpx solid $app-color-border;
  border-radius: $app-radius-lg;
  box-shadow: $app-shadow;
}

.invalid {
  opacity: 0.6;
}

.cover {
  width: 120rpx;
  height: 120rpx;
  margin: 0 20rpx;
  border-radius: 20rpx;
  background-color: $app-color-input-bg;
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 24rpx;
  font-weight: 600;
  color: $app-color-text;
}

.spec {
  display: block;
  margin-top: 6rpx;
  font-size: 20rpx;
  color: $app-color-text-muted;
}

.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12rpx;
}

.invalid-tip {
  display: block;
  margin-top: 6rpx;
  font-size: 18rpx;
  color: $app-color-danger;
}

.remove {
  display: inline-block;
  margin-top: 8rpx;
  font-size: 18rpx;
  color: $app-color-text-muted;
}

/* 与原型 .note 一致：奶黄底 + 虚线边框的提示条 */
.shipping-tip {
  margin-top: 4rpx;
  padding: 18rpx;
  background-color: $app-color-warning-bg-soft;
  border: 1rpx dashed $app-color-warning;
  border-radius: 20rpx;
}

.shipping-tip-text {
  font-size: 20rpx;
  color: $app-color-warning-text;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background-color: $app-color-white;
  border-top: 1rpx solid $app-color-border;
}

.summary {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: 20rpx;
}

.total {
  font-size: 26rpx;
  color: $app-color-primary-dark;
  font-weight: 700;
}

.count {
  font-size: 18rpx;
  color: $app-color-text-muted;
}
</style>
