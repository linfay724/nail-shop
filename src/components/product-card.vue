<template>
  <view class="product-card" @click="emit('click', product)">
    <image class="cover" :src="product.cover" mode="aspectFill" lazy-load />
    <view class="info">
      <text class="name">{{ product.name }}</text>
      <view class="tags">
        <text v-if="product.tags.length > 0" class="tag">{{ product.tags[0] }}</text>
        <text class="tag tag-gray">{{ product.style }}</text>
      </view>
      <view class="meta">
        <price-tag :price="product.price" :unit="product.isAccessory ? '/件' : '/副'" />
        <text class="sales">已售{{ product.sales }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { PublicProduct } from '@/api/contract'
import PriceTag from '@/components/price-tag.vue'

defineProps<{ product: PublicProduct }>()
const emit = defineEmits<{ (event: 'click', product: PublicProduct): void }>()
</script>

<style lang="scss" scoped>
.product-card {
  min-width: 0;
  overflow: hidden;
  background-color: $app-color-white;
  border: 1rpx solid $app-color-border;
  border-radius: 26rpx;
  box-shadow: $app-shadow;
}

.cover {
  width: 100%;
  height: 208rpx;
  background-color: $app-color-input-bg;
}

.info {
  padding: 16rpx 16rpx 18rpx;
}

.name {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 24rpx;
  font-weight: 600;
  color: $app-color-text;
}

.tags {
  display: flex;
  margin-top: 10rpx;
  white-space: nowrap;
}

.tag {
  margin-right: 6rpx;
  padding: 4rpx 12rpx;
  font-size: 16rpx;
  color: $app-color-primary-dark;
  background-color: $app-color-primary-light;
  border-radius: $app-radius-pill;
}

.tag-gray {
  color: $app-color-text-muted;
  background-color: #f4f1f0;
}

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12rpx;
}

.sales {
  font-size: 16rpx;
  color: $app-color-text-muted;
  white-space: nowrap;
}
</style>
