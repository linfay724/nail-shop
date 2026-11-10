<template>
  <view class="order-detail">
    <template v-if="order">
      <view class="status-bar">
        <text class="status">{{ ORDER_STATUS_LABELS[order.status] }}</text>
        <text v-if="order.logistics" class="status-sub">{{ order.logistics.company }} {{ order.logistics.no }}</text>
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
            <text class="spec">{{ specOf(item) }} × {{ item.quantity }}</text>
          </view>
          <text class="price">{{ formatPrice(item.price * item.quantity) }}</text>
        </view>

        <view class="amount-row">
          <text>商品小计</text>
          <text>{{ formatPrice(order.goodsAmount) }}</text>
        </view>
        <view class="amount-row">
          <text>运费</text>
          <text>{{ order.shippingFee === 0 ? '免运费' : formatPrice(order.shippingFee) }}</text>
        </view>
        <view class="amount-row total">
          <text>实付金额</text>
          <text class="amount">{{ formatPrice(order.amount) }}</text>
        </view>
      </view>

      <view v-if="order.customNote" class="block">
        <text class="block-title">定制备注</text>
        <text class="custom-note">{{ order.customNote }}</text>
      </view>

      <view v-if="order.logistics" class="block">
        <text class="block-title">物流信息</text>
        <text class="logistics-no">{{ order.logistics.company }} {{ order.logistics.no }}</text>
        <view v-for="trace in order.logistics.traces" :key="trace.time" class="trace">
          <text class="trace-text">{{ trace.text }}</text>
          <text class="trace-time">{{ trace.time }}</text>
        </view>
      </view>

      <view
        v-if="order.status !== 'pending_pay' && order.status !== 'cancelled'"
        class="block link"
        @click="applyAfterSale"
      >
        <view class="link-main">
          <text class="link-title">申请售后 / 联系客服协商</text>
          <text class="link-tip">提交问题描述与凭证后跳转客服会话，退款退货不在此处理</text>
        </view>
        <text class="link-arrow">›</text>
      </view>

      <view class="actions">
        <template v-if="order.status === 'pending_pay'">
          <u-button custom-style="flex: 1" @click="cancelOrder">取消订单</u-button>
          <u-button type="primary" custom-style="flex: 1; margin-left: 20rpx" @click="pay">继续支付</u-button>
        </template>
        <template v-else-if="order.status === 'pending_ship'">
          <u-button custom-style="flex: 1" @click="cancelOrder">取消订单</u-button>
          <u-button type="primary" custom-style="flex: 1; margin-left: 20rpx" @click="contactService">
            联系客服
          </u-button>
        </template>
        <template v-else-if="order.status === 'pending_receive'">
          <u-button custom-style="flex: 1" @click="contactService">联系客服</u-button>
          <u-button type="primary" custom-style="flex: 1; margin-left: 20rpx" @click="confirmReceive">
            确认收货
          </u-button>
        </template>
        <template v-else-if="order.status === 'completed'">
          <u-button custom-style="flex: 1" @click="buyAgain">再次购买</u-button>
          <u-button v-if="order.reviewed" custom-style="flex: 1; margin-left: 20rpx" @click="contactService">
            联系客服
          </u-button>
          <u-button
            v-else
            type="primary"
            custom-style="flex: 1; margin-left: 20rpx"
            @click="writeReview"
          >
            发表评价
          </u-button>
        </template>
        <template v-else>
          <u-button custom-style="flex: 1" @click="buyAgain">再次购买</u-button>
          <u-button type="primary" custom-style="flex: 1; margin-left: 20rpx" @click="contactService">
            联系客服
          </u-button>
        </template>
      </view>
    </template>

    <view v-else class="loading">加载中…</view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { orderApi } from '@/api/order'
import { payOrder } from '@/api/payment'
import { toastError } from '@/api/transport'
import {
  SHAPE_LABELS,
  SIZE_LABELS,
  type OrderItem,
  type PublicOrder,
} from '@/api/contract'
import { ORDER_STATUS_LABELS } from '@/utils/constants'
import { formatPrice } from '@/utils/price'
import { setStorage } from '@/utils/storage'

const orderId = ref('')
const order = ref<PublicOrder | null>(null)

function specOf(item: OrderItem): string {
  if (item.isAccessory || !item.size || !item.shape) {
    return '工具包 · 配件'
  }
  return `${SIZE_LABELS[item.size]} / ${SHAPE_LABELS[item.shape]} · ${item.unit}`
}

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

function writeReview(): void {
  if (!order.value) {
    return
  }
  uni.navigateTo({ url: `/pages-user/review/edit?orderId=${order.value.id}` })
}

function applyAfterSale(): void {
  if (!order.value) {
    return
  }
  uni.navigateTo({ url: `/pages-user/aftersale/apply?orderId=${order.value.id}` })
}

/** 售后统一走人工协商：优先打开微信客服会话，失败时给出可复制的客服信息 */
function contactService(): void {
  if (!order.value) {
    return
  }

  const orderNo = order.value.id
  const chat = (uni as unknown as {
    openCustomerServiceChat?: (options: {
      extInfo: { url: string; title?: string }
      corpId: string
      fail?: () => void
    }) => void
  }).openCustomerServiceChat

  if (chat) {
    chat({
      extInfo: { url: `https://work.weixin.qq.com/kfid/order-${orderNo}`, title: `订单 ${orderNo}` },
      corpId: '',
      fail: () => fallbackContact(orderNo),
    })
    return
  }

  fallbackContact(orderNo)
}

function fallbackContact(orderNo: string): void {
  uni.showModal({
    title: '联系客服',
    content: `客服微信：nailcare-store\n请备注订单号 ${orderNo}`,
    confirmText: '复制微信号',
    success: (result) => {
      if (result.confirm) {
        uni.setClipboardData({ data: 'nailcare-store' })
      }
    },
  })
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
  margin-bottom: 20rpx;
  padding: 20rpx;
  background-color: $app-color-success-bg;
  border-radius: $app-radius-lg;
}

.status {
  font-size: 26rpx;
  color: $app-color-primary-dark;
  font-weight: 600;
}

.status-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 20rpx;
  color: $app-color-text-muted;
}

.block {
  margin-bottom: 20rpx;
  padding: 20rpx;
  background-color: $app-color-white;
  border: 1rpx solid $app-color-border;
  border-radius: $app-radius-lg;
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
  padding-top: $app-space-xs;
  font-size: $app-font-sm;
  color: $app-color-text;
}

.total {
  margin-top: $app-space-xs;
  padding-top: $app-space-sm;
  border-top: 1rpx solid $app-color-border;
}

.amount {
  color: $app-color-primary-dark;
  font-weight: 700;
}

.link {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.link-main {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.link-title {
  font-size: $app-font-base;
  color: $app-color-text;
  font-weight: 600;
}

.link-tip {
  margin-top: $app-space-xs;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
  line-height: 1.5;
}

.link-arrow {
  margin-left: $app-space-sm;
  font-size: $app-font-lg;
  color: $app-color-text-secondary;
}

.block-title {
  display: block;
  margin-bottom: $app-space-xs;
  font-size: $app-font-base;
  color: $app-color-text;
  font-weight: 600;
}

.custom-note {
  font-size: $app-font-sm;
  color: $app-color-text;
  line-height: 1.6;
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
  padding: 20rpx 24rpx;
  background-color: $app-color-white;
  border-top: 1rpx solid $app-color-border;
}

.loading {
  padding-top: 200rpx;
  text-align: center;
  color: $app-color-text-secondary;
}
</style>
