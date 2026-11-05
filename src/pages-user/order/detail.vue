<template>
  <view class="order-detail">
    <template v-if="order">
      <view class="status-bar">
        <text class="status">{{ ORDER_STATUS_LABELS[order.status] }}</text>
        <text v-if="order.afterSale" class="aftersale-status">
          售后：{{ afterSaleLabel }}
        </text>
      </view>

      <view class="block">
        <text class="receiver">{{ order.addressSnapshot.receiver }} {{ order.addressSnapshot.phone }}</text>
        <text class="address">{{ order.addressSnapshot.region.join('') }}{{ order.addressSnapshot.detail }}</text>
      </view>

      <view class="block">
        <view v-for="item in order.items" :key="item.skuId" class="item">
          <image class="cover" :src="item.cover" mode="aspectFill" />
          <view class="item-info">
            <text class="name">{{ item.name }}</text>
            <text class="spec">{{ item.size }} · {{ item.pieceCount }} 片 × {{ item.quantity }}</text>
          </view>
          <text class="price">{{ formatPrice(item.price * item.quantity) }}</text>
        </view>
        <view class="amount-row">
          <text>实付金额</text>
          <text class="amount">{{ formatPrice(order.amount) }}</text>
        </view>
        <text v-if="order.remark" class="remark">备注：{{ order.remark }}</text>
      </view>

      <view v-if="order.logistics" class="block">
        <text class="block-title">物流信息</text>
        <text class="logistics-no">{{ order.logistics.company }} {{ order.logistics.no }}</text>
        <view v-for="trace in order.logistics.traces" :key="trace.time" class="trace">
          <text class="trace-text">{{ trace.text }}</text>
          <text class="trace-time">{{ trace.time }}</text>
        </view>
      </view>

      <view v-if="order.afterSale" class="block">
        <text class="block-title">售后信息</text>
        <text class="trace">类型：{{ order.afterSale.type === 'refund' ? '仅退款' : '退货退款' }}</text>
        <text class="trace">原因：{{ order.afterSale.reason }}</text>
        <text v-if="order.afterSale.rejectReason" class="trace">拒绝理由：{{ order.afterSale.rejectReason }}</text>
      </view>

      <view class="actions">
        <template v-if="order.status === 'pending_pay'">
          <u-button custom-style="flex: 1" @click="cancelOrder">取消订单</u-button>
          <u-button type="primary" custom-style="flex: 1; margin-left: 20rpx" @click="pay">继续支付</u-button>
        </template>
        <template v-else-if="order.status === 'pending_ship'">
          <u-button custom-style="flex: 1" @click="cancelOrder">取消订单</u-button>
        </template>
        <template v-else-if="order.status === 'pending_receive'">
          <u-button type="primary" custom-style="flex: 1" @click="confirmReceive">确认收货</u-button>
        </template>
        <template v-else>
          <u-button custom-style="flex: 1" @click="buyAgain">再次购买</u-button>
          <u-button
            v-if="!order.afterSale"
            type="primary"
            custom-style="flex: 1; margin-left: 20rpx"
            @click="applyAfterSale"
          >
            申请售后
          </u-button>
        </template>
      </view>
    </template>

    <view v-else class="loading">加载中…</view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { orderApi } from '@/api/order'
import { payOrder } from '@/api/payment'
import { toastError } from '@/api/transport'
import type { OrderItem, PublicOrder } from '@/api/contract'
import { ORDER_STATUS_LABELS } from '@/utils/constants'
import { formatPrice } from '@/utils/price'
import { setStorage } from '@/utils/storage'

const orderId = ref('')
const order = ref<PublicOrder | null>(null)

const afterSaleLabel = computed(() => {
  const status = order.value?.afterSale?.status
  if (status === 'approved') {
    return '已同意退款'
  }
  if (status === 'rejected') {
    return '已拒绝'
  }
  return '处理中'
})

async function load(): Promise<void> {
  if (!orderId.value) {
    return
  }
  try {
    order.value = await orderApi.detail(orderId.value)
  } catch (error) {
    toastError(error)
  }
}

onLoad((options) => {
  orderId.value = options?.id ?? ''
})

onShow(() => {
  void load()
})

async function pay(): Promise<void> {
  if (!order.value) {
    return
  }
  try {
    const result = await payOrder(order.value.id)
    if (!result.paid) {
      uni.showToast({ title: '已取消支付', icon: 'none' })
      return
    }
    await load()
  } catch (error) {
    toastError(error)
  }
}

function cancelOrder(): void {
  if (!order.value) {
    return
  }
  uni.showModal({
    title: '取消订单',
    content: '确定取消该订单吗？',
    success: async (result) => {
      if (!result.confirm) {
        return
      }
      try {
        await orderApi.cancel(order.value!.id)
        await load()
      } catch (error) {
        toastError(error)
      }
    },
  })
}

async function confirmReceive(): Promise<void> {
  if (!order.value) {
    return
  }
  try {
    await orderApi.confirm(order.value.id)
    uni.showToast({ title: '已确认收货', icon: 'none' })
    await load()
  } catch (error) {
    toastError(error)
  }
}

function buyAgain(): void {
  if (!order.value) {
    return
  }

  const items: OrderItem[] = order.value.items.map((item) => ({ ...item }))
  setStorage('checkout_items', items)
  uni.navigateTo({ url: '/pages-user/checkout/index' })
}

function applyAfterSale(): void {
  if (!order.value) {
    return
  }
  uni.navigateTo({ url: `/pages-user/aftersale/apply?id=${order.value.id}` })
}
</script>

<style lang="scss" scoped>
.order-detail {
  min-height: 100vh;
  padding: $app-space-base;
  padding-bottom: 200rpx;
  background-color: $app-color-bg;
}

.status-bar {
  padding: $app-space-base;
  margin-bottom: $app-space-base;
  background: linear-gradient(135deg, #f7ece8, #fff);
  border-radius: $app-radius-base;
}

.status {
  font-size: $app-font-lg;
  color: $app-color-text;
  font-weight: 600;
}

.aftersale-status {
  display: block;
  margin-top: $app-space-xs;
  font-size: $app-font-sm;
  color: #dd524d;
}

.block {
  margin-bottom: $app-space-base;
  padding: $app-space-base;
  background-color: #fff;
  border-radius: $app-radius-base;
}

.receiver {
  font-size: $app-font-base;
  color: $app-color-text;
}

.address {
  display: block;
  margin-top: $app-space-xs;
  font-size: $app-font-sm;
  color: $app-color-text-secondary;
}

.item {
  display: flex;
  align-items: center;
  margin-bottom: $app-space-sm;
}

.cover {
  width: 120rpx;
  height: 120rpx;
  border-radius: $app-radius-sm;
}

.item-info {
  flex: 1;
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

.price {
  font-size: $app-font-sm;
  color: $app-color-text;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  padding-top: $app-space-sm;
  border-top: 1rpx solid $app-color-border;
  font-size: $app-font-sm;
  color: $app-color-text;
}

.amount {
  color: $app-color-primary;
  font-weight: 600;
}

.remark {
  display: block;
  margin-top: $app-space-sm;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.block-title {
  display: block;
  margin-bottom: $app-space-xs;
  font-size: $app-font-base;
  color: $app-color-text;
  font-weight: 600;
}

.logistics-no {
  display: block;
  margin-bottom: $app-space-xs;
  font-size: $app-font-sm;
  color: $app-color-text-secondary;
}

.trace {
  display: block;
  margin-bottom: $app-space-xs;
  font-size: $app-font-sm;
  color: $app-color-text;
}

.trace-text {
  display: block;
  font-size: $app-font-sm;
  color: $app-color-text;
}

.trace-time {
  display: block;
  margin-top: 4rpx;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  padding: $app-space-sm $app-space-base;
  background-color: #fff;
}

.loading {
  padding-top: 200rpx;
  text-align: center;
  color: $app-color-text-secondary;
}
</style>
