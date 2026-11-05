<template>
  <view class="favorite">
    <view v-if="list.length === 0" class="empty">
      <u-empty mode="favor" text="还没有收藏商品" />
    </view>
    <view v-for="item in list" :key="item.id" class="item" @click="openDetail(item)">
      <image class="cover" :src="item.cover" mode="aspectFill" />
      <view class="info">
        <text class="name">{{ item.name }}</text>
        <text class="price">{{ formatPrice(item.price) }}</text>
        <text v-if="!item.onSale" class="offsale">已下架</text>
      </view>
      <u-button size="small" plain @click.stop="remove(item.id)">移除</u-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { favoriteApi } from '@/api/favorite'
import { toastError } from '@/api/transport'
import type { PublicProduct } from '@/api/contract'
import { formatPrice } from '@/utils/price'

const list = ref<PublicProduct[]>([])

async function load(): Promise<void> {
  try {
    list.value = await favoriteApi.list()
  } catch (error) {
    toastError(error)
  }
}

function openDetail(item: PublicProduct): void {
  if (!item.onSale) {
    uni.showToast({ title: '该商品已下架', icon: 'none' })
    return
  }
  uni.navigateTo({ url: `/pages/product/detail?id=${item.id}` })
}

async function remove(id: string): Promise<void> {
  try {
    await favoriteApi.toggle(id)
    list.value = list.value.filter((item) => item.id !== id)
  } catch (error) {
    toastError(error)
  }
}

void load()
</script>

<style lang="scss" scoped>
.favorite {
  min-height: 100vh;
  padding: $app-space-base;
  background-color: $app-color-bg;
}

.empty {
  padding-top: 200rpx;
}

.item {
  display: flex;
  align-items: center;
  margin-bottom: $app-space-sm;
  padding: $app-space-sm;
  background-color: #fff;
  border-radius: $app-radius-base;
}

.cover {
  width: 140rpx;
  height: 140rpx;
  border-radius: $app-radius-sm;
}

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: $app-space-sm;
}

.name {
  font-size: $app-font-base;
  color: $app-color-text;
}

.price {
  margin-top: $app-space-xs;
  font-size: $app-font-base;
  color: $app-color-primary;
}

.offsale {
  margin-top: $app-space-xs;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}
</style>
