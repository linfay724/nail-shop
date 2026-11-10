<template>
  <view class="shipping-bar">
    <view class="row">
      <text class="label">商品小计</text>
      <price-tag :price="goodsAmount" />
    </view>
    <view class="row">
      <view class="label-group">
        <text class="label">运费</text>
        <text class="hint">{{ hint }}</text>
      </view>
      <text class="fee">{{ shippingFee === 0 ? '免运费' : formatPrice(shippingFee) }}</text>
    </view>
    <view class="row total">
      <text class="label">应付合计</text>
      <price-tag :price="goodsAmount + shippingFee" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ShippingConfig } from '@/api/contract'
import { calcShipping, describeShipping } from '@/utils/shipping'
import PriceTag from '@/components/price-tag.vue'

const props = defineProps<{ config: ShippingConfig; paidSets: number; goodsAmount: number }>()

const shippingFee = computed(() => calcShipping(props.config, props.paidSets))
const hint = computed(() => describeShipping(props.config, props.paidSets))

function formatPrice(value: number): string {
  return `¥${(value / 100).toFixed(2)}`
}
</script>

<style lang="scss" scoped>
.shipping-bar {
  padding: 0 20rpx;
  background-color: $app-color-white;
  border: 1rpx solid $app-color-border;
  border-radius: $app-radius-lg;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 0;
  border-bottom: 1rpx solid $app-color-border-soft;
}

.label-group {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 22rpx;
  color: $app-color-text-secondary;
}

.hint {
  margin-top: 4rpx;
  font-size: 18rpx;
  color: $app-color-text-muted;
}

.fee {
  font-size: 22rpx;
  color: $app-color-primary-dark;
}

.total {
  border-bottom: none;
}

.total .label {
  color: $app-color-text;
}
</style>
