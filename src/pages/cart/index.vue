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
          <text class="spec">{{ line.size }} · {{ line.pieceCount }} 片</text>
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

    <view v-if="cart.lines.length > 0" class="bottom-bar">
      <u-checkbox :model-value="cart.allSelected" @change="onToggleAll">全选</u-checkbox>
      <view class="summary">
        <text class="total">合计 {{ formatPrice(cart.totalAmount) }}</text>
        <text class="count">共 {{ cart.totalCount }} 件</text>
      </view>
      <u-button type="primary" :disabled="cart.selectedLines.length === 0" @click="checkout">
        去结算
      </u-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { useCartStore } from '@/stores/cart'
import { useSessionStore } from '@/stores/session'
import type { OrderItem } from '@/api/contract'
import PriceTag from '@/components/price-tag.vue'
import { formatPrice } from '@/utils/price'
import { setStorage } from '@/utils/storage'

const cart = useCartStore()
const session = useSessionStore()

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
    pieceCount: line.pieceCount,
    price: line.snapshot.price,
    quantity: line.quantity,
  }))

  setStorage('checkout_items', items)
  uni.navigateTo({ url: '/pages-user/checkout/index' })
}

onShow(() => {
  if (session.isLoggedIn) {
    void cart.load()
  }
})
</script>

<style lang="scss" scoped>
.cart {
  min-height: 100vh;
  padding: $app-space-base $app-space-base 200rpx;
  background-color: $app-color-bg;
}

.line {
  display: flex;
  align-items: flex-start;
  margin-bottom: $app-space-sm;
  padding: $app-space-sm;
  background-color: #fff;
  border-radius: $app-radius-lg;
  box-shadow: $app-shadow;
}

.invalid {
  opacity: 0.6;
}

.cover {
  width: 160rpx;
  height: 160rpx;
  margin: 0 $app-space-sm;
  border-radius: $app-radius-sm;
}

.info {
  flex: 1;
}

.name {
  font-size: $app-font-base;
  color: $app-color-text;
}

.spec {
  display: block;
  margin-top: $app-space-xs;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: $app-space-xs;
}

.invalid-tip {
  display: block;
  margin-top: $app-space-xs;
  font-size: $app-font-xs;
  color: #dd524d;
}

.remove {
  display: inline-block;
  margin-top: $app-space-xs;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: $app-space-sm $app-space-base;
  background-color: #fff;
}

.summary {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: $app-space-sm;
}

.total {
  font-size: $app-font-base;
  color: $app-color-primary;
  font-weight: 600;
}

.count {
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}
</style>
