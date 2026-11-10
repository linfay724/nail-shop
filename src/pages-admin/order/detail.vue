<template>
  <view class="admin-order admin-theme">
    <template v-if="order">
      <view class="block">
        <view class="row">
          <text class="no">{{ order.id }}</text>
          <text class="status">{{ ORDER_STATUS_LABELS[order.status] }}</text>
        </view>
        <text class="line">收货人：{{ order.addressSnapshot.receiver }} {{ order.addressSnapshot.phone }}</text>
        <text class="line">地址：{{ order.addressSnapshot.region.join('') }}{{ order.addressSnapshot.detail }}</text>
      </view>

      <view v-if="order.customNote" class="block highlight">
        <text class="block-title">定制备注（备料必看）</text>
        <text class="custom-note">{{ order.customNote }}</text>
      </view>

      <view class="block">
        <text class="block-title">商品</text>
        <view v-for="item in order.items" :key="item.skuId" class="item">
          <text class="item-name">{{ item.name }} {{ specOf(item) }}</text>
          <text class="item-meta">× {{ item.quantity }} · {{ formatPrice(item.price * item.quantity) }}</text>
        </view>
        <view class="amount-row">
          <text>商品小计</text>
          <text>{{ formatPrice(order.goodsAmount) }}</text>
        </view>
        <view class="amount-row">
          <text>运费</text>
          <text>{{ order.shippingFee === 0 ? '免运费' : formatPrice(order.shippingFee) }}</text>
        </view>
        <text class="amount">实付 {{ formatPrice(order.amount) }}</text>
      </view>

      <view v-if="order.status === 'pending_ship'" class="block">
        <text class="block-title">发货</text>
        <u-input v-model="company" placeholder="物流公司，如顺丰速运" custom-style="margin-bottom: 20rpx" />
        <u-input v-model="trackingNo" placeholder="运单号" />
        <u-button type="primary" custom-style="margin-top: 24rpx" :loading="shipping" @click="ship">
          确认发货
        </u-button>
      </view>

      <view v-if="order.logistics" class="block">
        <text class="block-title">物流</text>
        <text class="line">{{ order.logistics.company }} {{ order.logistics.no }}</text>
      </view>

      <view class="block">
        <text class="block-title">售后协商</text>
        <text v-if="afterSales.length === 0" class="line">暂无协商记录；线上退款/退货不在此处理。</text>
        <view v-for="record in afterSales" :key="record.id" class="after-sale">
          <view class="after-sale-head">
            <text class="after-sale-type">{{ AFTER_SALE_TYPE_LABELS[record.type] }}</text>
            <text class="after-sale-status" :class="{ resolved: record.status === 'resolved' }">
              {{ record.status === 'pending' ? '待处理' : '已处理' }}
            </text>
          </view>
          <text class="after-sale-desc">{{ record.description }}</text>
          <text class="after-sale-meta">
            {{ record.media.length }} 个凭证 · {{ formatTime(record.createdAt) }}
          </text>
          <text v-if="record.status === 'pending'" class="after-sale-action" @click="resolve(record)">
            标记已处理
          </text>
        </view>
      </view>
    </template>

    <view v-else class="hint">加载中…</view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { adminApi } from '@/api/admin'
import { toastError } from '@/api/transport'
import {
  AFTER_SALE_TYPE_LABELS,
  SHAPE_LABELS,
  SIZE_LABELS,
  type AfterSaleRequest,
  type OrderItem,
  type PublicOrder,
} from '@/api/contract'
import { ORDER_STATUS_LABELS } from '@/utils/constants'
import { useAdminGuard } from '@/utils/admin-guard'
import { formatPrice } from '@/utils/price'

const orderId = ref('')
const order = ref<PublicOrder | null>(null)
const afterSales = ref<AfterSaleRequest[]>([])
const company = ref('')
const trackingNo = ref('')
const shipping = ref(false)
let guarded = false

function specOf(item: OrderItem): string {
  if (item.isAccessory || !item.size || !item.shape) {
    return '工具包'
  }
  return `${SIZE_LABELS[item.size]} / ${SHAPE_LABELS[item.shape]}`
}

async function load(): Promise<void> {
  if (!guarded || !orderId.value) {
    return
  }
  try {
    const [detail, records] = await Promise.all([
      adminApi.getOrder(orderId.value),
      adminApi.listAfterSales(orderId.value),
    ])
    order.value = detail
    afterSales.value = records
  } catch (error) {
    toastError(error)
  }
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

async function resolve(record: AfterSaleRequest): Promise<void> {
  try {
    await adminApi.resolveAfterSale(record.id)
    afterSales.value = afterSales.value.map((item) =>
      item.id === record.id ? { ...item, status: 'resolved' } : item,
    )
    uni.showToast({ title: '已标记处理', icon: 'none' })
  } catch (error) {
    toastError(error)
  }
}

onLoad((options) => {
  guarded = useAdminGuard('order:read')
  orderId.value = options?.id ?? ''
  void load()
})

async function ship(): Promise<void> {
  if (!order.value) {
    return
  }
  if (!company.value.trim() || !trackingNo.value.trim()) {
    uni.showToast({ title: '请填写物流公司与运单号', icon: 'none' })
    return
  }

  shipping.value = true
  try {
    order.value = await adminApi.ship(order.value.id, company.value.trim(), trackingNo.value.trim())
    uni.showToast({ title: '已发货', icon: 'none' })
  } catch (error) {
    toastError(error)
  } finally {
    shipping.value = false
  }
}
</script>

<style lang="scss" scoped>
.admin-order {
  min-height: 100vh;
  padding: 28rpx;
  background-color: $app-color-admin-bg;
}

.block {
  margin-bottom: $app-space-base;
  padding: $app-space-base;
  background-color: #fff;
  border-radius: $app-radius-base;
}

.highlight {
  border: 2rpx solid $app-color-primary;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $app-space-xs;
}

.no {
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.status {
  font-size: $app-font-sm;
  color: $app-color-primary;
}

.line {
  display: block;
  margin-top: $app-space-xs;
  font-size: $app-font-sm;
  color: $app-color-text;
}

.custom-note {
  font-size: $app-font-sm;
  color: $app-color-text;
  line-height: 1.7;
}

.block-title {
  display: block;
  margin-bottom: $app-space-xs;
  font-size: $app-font-base;
  color: $app-color-text;
  font-weight: 600;
}

.item {
  display: flex;
  justify-content: space-between;
  margin-bottom: $app-space-xs;
}

.item-name {
  font-size: $app-font-sm;
  color: $app-color-text;
}

.item-meta {
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  margin-top: $app-space-xs;
  font-size: $app-font-sm;
  color: $app-color-text;
}

.amount {
  display: block;
  margin-top: $app-space-sm;
  font-size: $app-font-base;
  color: $app-color-primary;
  font-weight: 600;
}

.after-sale {
  margin-top: $app-space-sm;
  padding-top: $app-space-sm;
  border-top: 1rpx solid $app-color-border;
}

.after-sale-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.after-sale-type {
  font-size: $app-font-sm;
  color: $app-color-text;
  font-weight: 600;
}

.after-sale-status {
  font-size: $app-font-xs;
  color: $app-color-danger;
}

.resolved {
  color: $app-color-text-secondary;
}

.after-sale-desc {
  display: block;
  margin-top: $app-space-xs;
  font-size: $app-font-sm;
  color: $app-color-text;
  line-height: 1.6;
}

.after-sale-meta {
  display: block;
  margin-top: 4rpx;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.after-sale-action {
  display: inline-block;
  margin-top: $app-space-xs;
  font-size: $app-font-xs;
  color: $app-color-primary;
}

.hint {
  padding-top: 200rpx;
  text-align: center;
  color: $app-color-text-secondary;
}
</style>
