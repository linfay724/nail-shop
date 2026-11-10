<template>
  <text class="price-tag" :class="`size-${size}`">
    {{ formatPrice(price) }}<text v-if="unit" class="unit">{{ unit }}</text>
  </text>
</template>

<script setup lang="ts">
import { formatPrice } from '@/utils/price'

withDefaults(defineProps<{ price: number; unit?: string; size?: 'sm' | 'md' | 'lg' }>(), {
  unit: '',
  size: 'md',
})
</script>

<style lang="scss" scoped>
.price-tag {
  color: $app-color-primary-dark;
  font-weight: 700;
  white-space: nowrap;
}

.size-sm {
  font-size: 22rpx;
}

.size-md {
  font-size: 26rpx;
}

.size-lg {
  font-size: 38rpx;
}

.unit {
  margin-left: 2rpx;
  font-size: 16rpx;
  font-weight: 400;
  color: $app-color-text-muted;
}

.size-lg .unit {
  font-size: 20rpx;
}
</style>
