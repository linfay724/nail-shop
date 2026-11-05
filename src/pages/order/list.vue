<template>
  <view class="order-list">
    <u-tabs :list="tabs" :current="tabIndex" @change="onTabChange" />

    <view v-if="loading" class="hint">加载中…</view>
    <u-empty v-else-if="orders.length === 0" mode="order" text="暂无订单" />

    <view v-else class="list">
      <view v-for="order in orders" :key="order.id" class="order" @click="openDetail(order.id)">
        <view class="head">
          <text class="no">{{ order.id }}</text>
          <text class="status">{{ ORDER_STATUS_LABELS[order.status] }}</text>
        </view>
        <view class="items">
          <view v-for="item in order.items" :key="item.skuId" class="item">
            <image class="cover" :src="item.cover" mode="aspectFill" />
            <view class="item-info">
              <text class="name">{{ item.name }}</text>
              <text class="spec">{{ item.size }} · {{ item.pieceCount }} 片 × {{ item.quantity }}</text>
            </view>
          </view>
        </view>
        <view class="foot">
          <text class="amount">实付 {{ formatPrice(order.amount) }}</text>
          <text v-if="order.afterSale" class="aftersale">售后处理中</text>
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
import type { PublicOrder } from '@/api/contract'
import { ORDER_STATUS_LABELS, ORDER_STATUS_TABS } from '@/utils/constants'
import { formatPrice } from '@/utils/price'
import { getStorage, removeStorage } from '@/utils/storage'

const tabs = ORDER_STATUS_TABS.map((item) => ({ name: item.name }))
const tabIndex = ref(0)
const orders = ref<PublicOrder[]>([])
const loading = ref(false)

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

.hint {
  padding: $app-space-lg 0;
  text-align: center;
  font-size: $app-font-sm;
  color: $app-color-text-secondary;
}

.list {
  padding: $app-space-base;
}

.order {
  margin-bottom: $app-space-sm;
  padding: $app-space-sm;
  background-color: #fff;
  border-radius: $app-radius-base;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.no {
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.status {
  font-size: $app-font-sm;
  color: $app-color-primary;
}

.items {
  margin: $app-space-sm 0;
}

.item {
  display: flex;
  align-items: center;
  margin-bottom: $app-space-xs;
}

.cover {
  width: 110rpx;
  height: 110rpx;
  border-radius: $app-radius-sm;
}

.item-info {
  display: flex;
  flex-direction: column;
  margin-left: $app-space-sm;
}

.name {
  font-size: $app-font-sm;
  color: $app-color-text;
}

.spec {
  margin-top: 4rpx;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.amount {
  font-size: $app-font-base;
  color: $app-color-text;
}

.aftersale {
  font-size: $app-font-xs;
  color: #dd524d;
}
</style>
