<template>
  <view class="admin-orders admin-theme">
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
      <text v-if="order.customNote" class="custom-note">含定制备注</text>
      <text v-if="afterSaleCount(order.id) > 0" class="aftersale-tag">
        售后协商 {{ afterSaleCount(order.id) }} 条
      </text>

      <view v-if="order.status === 'pending_ship'" class="ship-row">
        <text class="ship-link" @click.stop="openShip(order)">填物流单号</text>
      </view>
    </view>

    <u-popup :show="shipVisible" mode="bottom" :border-radius="24" @close="shipVisible = false">
      <view class="ship-form">
        <text class="ship-title">填写物流信息</text>
        <text class="ship-order">{{ shipOrderId }}</text>
        <u-input v-model="company" placeholder="物流公司，如顺丰速运" custom-style="margin-bottom: 20rpx" />
        <u-input v-model="trackingNo" placeholder="运单号" />
        <u-button type="primary" custom-style="margin-top: 24rpx" :loading="shipping" @click="submitShip">
          确认发货
        </u-button>
      </view>
    </u-popup>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { adminApi } from '@/api/admin'
import { toastError } from '@/api/transport'
import type { AfterSaleRequest, PublicOrder } from '@/api/contract'
import { ADMIN_ORDER_TABS, ORDER_STATUS_LABELS } from '@/utils/constants'
import { useAdminGuard } from '@/utils/admin-guard'
import { formatPrice } from '@/utils/price'

const tabs = ADMIN_ORDER_TABS.map((item) => ({ name: item.name }))
const tabIndex = ref(0)
const keyword = ref('')
const orders = ref<PublicOrder[]>([])
const afterSales = ref<AfterSaleRequest[]>([])

const shipVisible = ref(false)
const shipOrderId = ref('')
const company = ref('')
const trackingNo = ref('')
const shipping = ref(false)

const afterSaleCounts = computed(() => {
  const counts: Record<string, number> = {}
  afterSales.value.forEach((item) => {
    counts[item.orderId] = (counts[item.orderId] ?? 0) + 1
  })
  return counts
})

let guarded = false

function afterSaleCount(orderId: string): number {
  return afterSaleCounts.value[orderId] ?? 0
}

async function load(): Promise<void> {
  if (!guarded) {
    return
  }
  try {
    const [orderList, afterSaleList] = await Promise.all([
      adminApi.listOrders(ADMIN_ORDER_TABS[tabIndex.value].value, keyword.value),
      adminApi.listAfterSales(),
    ])
    orders.value = orderList
    afterSales.value = afterSaleList
  } catch (error) {
    toastError(error)
  }
}

onLoad(() => {
  guarded = useAdminGuard('order:read')
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

function openShip(order: PublicOrder): void {
  shipOrderId.value = order.id
  company.value = order.logistics?.company ?? ''
  trackingNo.value = order.logistics?.no ?? ''
  shipVisible.value = true
}

async function submitShip(): Promise<void> {
  if (!company.value.trim() || !trackingNo.value.trim()) {
    uni.showToast({ title: '请填写物流公司与运单号', icon: 'none' })
    return
  }

  shipping.value = true
  try {
    await adminApi.ship(shipOrderId.value, company.value.trim(), trackingNo.value.trim())
    uni.showToast({ title: '已发货', icon: 'none' })
    shipVisible.value = false
    await load()
  } catch (error) {
    toastError(error)
  } finally {
    shipping.value = false
  }
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
  background-color: $app-color-admin-bg;
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
  background-color: $app-color-secondary-dark;
  border-color: $app-color-secondary-dark;
}

.toolbar {
  padding: 16rpx 28rpx;
}

.hint {
  padding: $app-space-lg 0;
  text-align: center;
  font-size: 22rpx;
  color: $app-color-text-muted;
}

.order {
  margin: 0 28rpx 20rpx;
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
  font-size: 22rpx;
  color: $app-color-text-muted;
}

.status {
  padding: 4rpx 14rpx;
  font-size: 18rpx;
  color: $app-color-secondary-dark;
  background-color: $app-color-secondary-light;
  border-radius: $app-radius-pill;
}

.amount {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: $app-color-primary-dark;
  font-weight: 600;
}

.time {
  display: block;
  margin-top: 4rpx;
  font-size: 18rpx;
  color: $app-color-text-muted;
}

.custom-note {
  display: block;
  margin-top: 8rpx;
  font-size: 18rpx;
  color: $app-color-secondary-dark;
}

.aftersale-tag {
  display: block;
  margin-top: 8rpx;
  font-size: 18rpx;
  color: $app-color-danger;
}

.ship-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 12rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid $app-color-border-soft;
}

.ship-link {
  padding: 6rpx 18rpx;
  font-size: 18rpx;
  color: $app-color-secondary-dark;
  border: 1rpx solid $app-color-secondary-light;
  border-radius: $app-radius-pill;
}

.ship-form {
  padding: $app-space-base;
}

.ship-title {
  display: block;
  font-size: $app-font-base;
  color: $app-color-text;
  font-weight: 600;
}

.ship-order {
  display: block;
  margin: $app-space-xs 0 $app-space-sm;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}
</style>
