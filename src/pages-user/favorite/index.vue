<template>
  <view class="favorite">
    <view v-if="favorite.list.length === 0 && !loading" class="empty">
      <u-empty mode="favor" text="还没有收藏商品" />
    </view>
    <view v-for="item in favorite.list" :key="item.id" class="item" @click="openDetail(item)">
      <image class="cover" :src="item.cover" mode="aspectFill" />
      <view class="info">
        <text class="name">{{ item.name }}</text>
        <text class="price">{{ formatPrice(item.price) }}</text>
        <text v-if="!item.onSale" class="offsale">已下架</text>
      </view>
      <u-button size="small" plain @click.stop="remove(item.id)">移除</u-button>
    </view>

    <view v-if="favorite.list.length > 0" class="footer">
      <text v-if="loading">加载中…</text>
      <text v-else-if="!favorite.hasMore">没有更多了</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onReachBottom, onShow } from '@dcloudio/uni-app'
import { toastError } from '@/api/transport'
import type { PublicProduct } from '@/api/contract'
import { formatPrice } from '@/utils/price'
import { useFavoriteStore } from '@/stores/favorite'

const favorite = useFavoriteStore()
const loading = ref(false)

async function load(reset = true): Promise<void> {
  loading.value = true
  try {
    await favorite.loadList(reset)
    if (reset) {
      await favorite.loadIds()
    }
  } catch (error) {
    toastError(error)
  } finally {
    loading.value = false
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
    await favorite.toggle(id)
    favorite.list = favorite.list.filter((item) => item.id !== id)
  } catch (error) {
    toastError(error)
  }
}

onShow(() => {
  void load(true)
})

onReachBottom(() => {
  if (favorite.hasMore && !loading.value) {
    void load(false)
  }
})
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
  margin-bottom: 20rpx;
  padding: 20rpx;
  background-color: $app-color-white;
  border: 1rpx solid $app-color-border;
  border-radius: $app-radius-lg;
  box-shadow: $app-shadow;
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
  font-size: 24rpx;
  font-weight: 600;
  color: $app-color-primary-dark;
}

.offsale {
  margin-top: $app-space-xs;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.footer {
  padding: $app-space-base 0;
  text-align: center;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}
</style>
