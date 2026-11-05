<template>
  <view class="admin-order">
    <template v-if="order">
      <view class="block">
        <view class="row">
          <text class="no">{{ order.id }}</text>
          <text class="status">{{ ORDER_STATUS_LABELS[order.status] }}</text>
        </view>
        <text class="line">收货人：{{ order.addressSnapshot.receiver }} {{ order.addressSnapshot.phone }}</text>
        <text class="line">地址：{{ order.addressSnapshot.region.join('') }}{{ order.addressSnapshot.detail }}</text>
        <text v-if="order.remark" class="line">备注：{{ order.remark }}</text>
      </view>

      <view class="block">
        <text class="block-title">商品</text>
        <view v-for="item in order.items" :key="item.skuId" class="item">
          <text class="item-name">{{ item.name }} {{ item.size }} · {{ item.pieceCount }} 片</text>
          <text class="item-meta">× {{ item.quantity }} · {{ formatPrice(item.price * item.quantity) }}</text>
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

      <view v-if="order.afterSale" class="block">
        <text class="block-title">售后处理</text>
        <text class="line">类型：{{ order.afterSale.type === 'refund' ? '仅退款' : '退货退款' }}</text>
        <text class="line">原因：{{ order.afterSale.reason }}</text>
        <text class="line">状态：{{ order.afterSale.status }}</text>
        <template v-if="order.afterSale.status === 'pending'">
          <u-radio-group v-model="afterSaleDecision" custom-style="margin-top: 20rpx">
            <u-radio name="approve">同意退款</u-radio>
            <u-radio name="reject">拒绝申请</u-radio>
          </u-radio-group>
          <u-textarea
            v-if="afterSaleDecision === 'reject'"
            v-model="rejectReason"
            :maxlength="100"
            placeholder="请填写拒绝理由"
            custom-style="margin-top: 20rpx"
          />
          <u-button type="primary" custom-style="margin-top: 24rpx" :loading="handling" @click="handleAfterSale">
            提交处理
          </u-button>
        </template>
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
import type { PublicOrder } from '@/api/contract'
import { ORDER_STATUS_LABELS } from '@/utils/constants'
import { useAdminGuard } from '@/utils/admin-guard'
import { formatPrice } from '@/utils/price'

const orderId = ref('')
const order = ref<PublicOrder | null>(null)
const company = ref('')
const trackingNo = ref('')
const shipping = ref(false)
const handling = ref(false)
const afterSaleDecision = ref<'approve' | 'reject'>('approve')
const rejectReason = ref('')
let guarded = false

async function load(): Promise<void> {
  if (!guarded || !orderId.value) {
    return
  }
  try {
    order.value = await adminApi.getOrder(orderId.value)
  } catch (error) {
    toastError(error)
  }
}

onLoad((options) => {
  guarded = useAdminGuard()
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

async function handleAfterSale(): Promise<void> {
  if (!order.value) {
    return
  }
  if (afterSaleDecision.value === 'reject' && !rejectReason.value.trim()) {
    uni.showToast({ title: '请填写拒绝理由', icon: 'none' })
    return
  }

  handling.value = true
  try {
    order.value = await adminApi.handleAfterSale(
      order.value.id,
      afterSaleDecision.value === 'approve',
      rejectReason.value,
    )
    uni.showToast({ title: '已处理', icon: 'none' })
  } catch (error) {
    toastError(error)
  } finally {
    handling.value = false
  }
}
</script>

<style lang="scss" scoped>
.admin-order {
  min-height: 100vh;
  padding: $app-space-base;
  background-color: $app-color-bg;
}

.block {
  margin-bottom: $app-space-base;
  padding: $app-space-base;
  background-color: #fff;
  border-radius: $app-radius-base;
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

.amount {
  display: block;
  margin-top: $app-space-sm;
  font-size: $app-font-base;
  color: $app-color-primary;
  font-weight: 600;
}

.hint {
  padding-top: 200rpx;
  text-align: center;
  color: $app-color-text-secondary;
}
</style>
