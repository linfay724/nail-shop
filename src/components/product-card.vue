<template>
  <view class="product-card" @click="emit('click', product)">
    <image class="cover" :src="product.cover" mode="aspectFill" lazy-load />
    <view class="info">
      <text class="name">{{ product.name }}</text>
      <view class="meta">
        <price-tag :price="product.price" />
        <text class="sales">已售 {{ product.sales }}</text>
      </view>
      <view class="tags">
        <text class="tag">{{ product.style }}</text>
        <text class="tag">{{ product.shape }}</text>
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
  overflow: hidden;
  background-color: #fff;
  border-radius: $app-radius-lg;
  box-shadow: $app-shadow;
  transition: transform 0.2s ease;
}

.cover {
  width: 100%;
  height: 320rpx;
}

.info {
  padding: $app-space-sm;
}

.name {
  font-size: $app-font-base;
  color: $app-color-text;
}

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: $app-space-xs;
}

.sales {
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.tags {
  display: flex;
  margin-top: $app-space-xs;
}

.tag {
  margin-right: $app-space-xs;
  padding: 4rpx 16rpx;
  font-size: $app-font-xs;
  border-radius: $app-radius-pill;
}

/* 第一个标签粉色、第二个蓝色，交错点缀 */
.tag:first-of-type {
  color: $app-color-primary-dark;
  background-color: $app-color-primary-light;
}

.tag:nth-of-type(2) {
  color: $app-color-secondary-dark;
  background-color: $app-color-secondary-light;
}
</style>
