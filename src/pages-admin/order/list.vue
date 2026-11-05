<template>
  <view class="admin-orders">
    <u-tabs :list="tabs" :current="tabIndex" @change="onTabChange" />
    <view class="toolbar">
      <u-search v-model="keyword" placeholder="搜索订单号" :show-action="false" @search="load" @custom="load" />
    </view>

    <view v-if="orders.length === 0" class="hint">暂无订单</view>

    <view v-for="order in orders" :key="order.id" class="order" @click="open(order.id)">
      <view class="head">
        <text class="no">{{ order.id }}</text>
        <text class="status">{{ ORDER_STATUS_LABELS[order.status] }}</text>
      </view>
      <text class="amount">实付 {{ formatPrice(order.amount) }}</text>
      <text class="time">{{ formatTime(order.timestamps.createdAt) }}</text>
      <text v-if="order.afterSale" class="aftersale">售后：{{ order.afterSale.status }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { adminApi } from '@/api/admin'
import { toastError } from '@/api/transport'
import type { PublicOrder } from '@/api/contract'
import { ORDER_STATUS_LABELS, ORDER_STATUS_TABS } from '@/utils/constants'
import { useAdminGuard } from '@/utils/admin-guard'
import { formatPrice } from '@/utils/price'

const tabs = ORDER_STATUS_TABS.map((item) => ({ name: item.name }))
const tabIndex = ref(0)
const keyword = ref('')
const orders = ref<PublicOrder[]>([])
let guarded = false

async function load(): Promise<void> {
  if (!guarded) {
    return
  }
  try {
    orders.value = await adminApi.listOrders(ORDER_STATUS_TABS[tabIndex.value].value, keyword.value)
  } catch (error) {
    toastError(error)
  }
}

onLoad(() => {
  guarded = useAdminGuard()
})

onShow(() => {
  void load()
})

function onTabChange(index: number): void {
  tabIndex.value = index
  void load()
}

function open(id: string): void {
  uni.navigateTo({ url: `/pages-admin/order/detail?id=${id}` })
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
</script>

<style lang="scss" scoped>
.admin-orders {
  min-height: 100vh;
  padding-bottom: $app-space-lg;
  background-color: $app-color-bg;
}

.toolbar {
  padding: $app-space-sm $app-space-base;
}

.hint {
  padding: $app-space-lg 0;
  text-align: center;
  font-size: $app-font-sm;
  color: $app-color-text-secondary;
}

.order {
  margin: 0 $app-space-base $app-space-sm;
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

.amount {
  display: block;
  margin-top: $app-space-xs;
  font-size: $app-font-base;
  color: $app-color-text;
}

.time {
  display: block;
  margin-top: 4rpx;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.aftersale {
  display: block;
  margin-top: $app-space-xs;
  font-size: $app-font-xs;
  color: #dd524d;
}
</style>
