<template>
  <view class="order-list">
    <view class="cat">
      <text
        v-for="(item, index) in tabs"
        :key="item.name"
        class="cat-item"
        :class="{ active: tabIndex === index }"
        @click="onTabChange(index)"
      >
        {{ item.name }}
      </text>
    </view>

    <view v-if="loading" class="hint">加载中…</view>
    <u-empty v-else-if="orders.length === 0" mode="order" text="暂无订单" />

    <view v-else class="list">
      <view v-for="order in orders" :key="order.id" class="order" @click="openDetail(order.id)">
        <view class="head">
          <text class="no">订单 {{ order.id }}</text>
          <text class="status" :class="{ gray: order.status === 'cancelled' }">
            {{ ORDER_STATUS_LABELS[order.status] }}
          </text>
        </view>
        <view class="items">
          <view v-for="item in order.items" :key="item.skuId" class="item">
            <image class="cover" :src="item.cover" mode="aspectFill" />
            <view class="item-info">
              <text class="name">{{ item.name }}</text>
              <text class="spec">{{ specOf(item) }} × {{ item.quantity }}</text>
            </view>
          </view>
        </view>
        <view class="foot">
          <text class="foot-label">含运费 {{ formatPrice(order.shippingFee) }}</text>
          <text class="amount">{{ formatPrice(order.amount) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { orderApi } from '@/api/order'
import { toastError } from '@/api/transport'
import { SHAPE_LABELS, SIZE_LABELS, type OrderItem, type PublicOrder } from '@/api/contract'
import { ORDER_STATUS_LABELS, ORDER_STATUS_TABS } from '@/utils/constants'
import { formatPrice } from '@/utils/price'
import { getStorage, removeStorage } from '@/utils/storage'

const tabs = ORDER_STATUS_TABS.map((item) => ({ name: item.name }))
const tabIndex = ref(0)
const orders = ref<PublicOrder[]>([])
const loading = ref(false)

function specOf(item: OrderItem): string {
  if (item.isAccessory || !item.size || !item.shape) {
    return '工具包'
  }
  return `${SIZE_LABELS[item.size]} / ${SHAPE_LABELS[item.shape]} · ${item.unit}`
}

async function load(): Promise<void> {
  loading.value = true
  try {
    orders.value = await orderApi.list(ORDER_STATUS_TABS[tabIndex.value].value)
  } catch (error) {
    toastError(error)
  } finally {
    loading.value = false
  }
}

function onTabChange(index: number): void {
  tabIndex.value = index
  void load()
}

function openDetail(id: string): void {
  uni.navigateTo({ url: `/pages-user/order/detail?id=${id}` })
}

onShow(() => {
  const incoming = getStorage<string | null>('order_filter', null)
  if (incoming) {
    const index = ORDER_STATUS_TABS.findIndex((item) => item.value === incoming)
    tabIndex.value = index >= 0 ? index : 0
    removeStorage('order_filter')
  }
  void load()
})
</script>

<style lang="scss" scoped>
.order-list {
  min-height: 100vh;
  padding-bottom: $app-space-lg;
  background-color: $app-color-bg;
}

.cat {
  display: flex;
  flex-wrap: nowrap;
  padding: 28rpx 28rpx 0;
}

.cat-item {
  flex: 0 0 auto;
  margin-right: 14rpx;
  padding: 10rpx 22rpx;
  font-size: 22rpx;
  color: $app-color-text-secondary;
  background-color: $app-color-white;
  border: 1rpx solid $app-color-border;
  border-radius: $app-radius-pill;
}

.active {
  color: $app-color-white;
  background-color: $app-color-primary-dark;
  border-color: $app-color-primary-dark;
}

.hint {
  padding: $app-space-lg 0;
  text-align: center;
  font-size: $app-font-sm;
  color: $app-color-text-muted;
}

.list {
  padding: 20rpx 28rpx;
}

.order {
  margin-bottom: 20rpx;
  padding: 20rpx;
  background-color: $app-color-white;
  border: 1rpx solid $app-color-border;
  border-radius: $app-radius-lg;
  box-shadow: $app-shadow;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.no {
  font-size: 24rpx;
  font-weight: 600;
  color: $app-color-text;
}

.status {
  padding: 4rpx 14rpx;
  font-size: 18rpx;
  color: $app-color-primary-dark;
  background-color: $app-color-primary-light;
  border-radius: $app-radius-pill;
}

.gray {
  color: $app-color-text-muted;
  background-color: #f4f1f0;
}

.items {
  margin: 16rpx 0;
}

.item {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.cover {
  width: 110rpx;
  height: 110rpx;
  border-radius: 20rpx;
  background-color: $app-color-input-bg;
}

.item-info {
  display: flex;
  flex-direction: column;
  margin-left: 16rpx;
}

.name {
  font-size: 24rpx;
  color: $app-color-text;
}

.spec {
  margin-top: 4rpx;
  font-size: 18rpx;
  color: $app-color-text-muted;
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12rpx;
  border-top: 1rpx solid $app-color-border-soft;
}

.foot-label {
  font-size: 18rpx;
  color: $app-color-text-muted;
}

.amount {
  font-size: 26rpx;
  color: $app-color-primary-dark;
  font-weight: 700;
}
</style>
