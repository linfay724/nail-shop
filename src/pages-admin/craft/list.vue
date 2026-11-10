<template>
  <view class="craft-list admin-theme">
    <text class="intro">制作资料仅可查看，材料与步骤由店主维护</text>

    <input v-model="keyword" class="search" placeholder="搜索商品名称" />

    <view v-if="filtered.length === 0" class="hint">暂无制作资料</view>

    <view v-for="item in filtered" :key="item.productId" class="item" @click="open(item.productId)">
      <image class="cover" :src="item.cover" mode="aspectFill" />
      <view class="info">
        <text class="name">{{ item.name }}</text>
        <text class="meta">{{ item.hasArchive ? '已录入制作档案' : '暂无制作档案' }}</text>
      </view>
      <text class="arrow">›</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { adminApi } from '@/api/admin'
import { toastError } from '@/api/transport'
import type { CraftProductSummary } from '@/api/contract'
import { useAdminGuard } from '@/utils/admin-guard'

const list = ref<CraftProductSummary[]>([])
const keyword = ref('')
let guarded = false

const filtered = computed(() =>
  list.value.filter((item) => !keyword.value.trim() || item.name.includes(keyword.value.trim())),
)

onLoad(async () => {
  guarded = useAdminGuard('craft:read')
  if (!guarded) {
    return
  }

  try {
    list.value = await adminApi.listCraftSummaries()
  } catch (error) {
    toastError(error)
  }
})

function open(productId: string): void {
  uni.navigateTo({ url: `/pages-admin/craft/edit?productId=${productId}` })
}
</script>

<style lang="scss" scoped>
.craft-list {
  min-height: 100vh;
  padding: 28rpx;
  background-color: $app-color-admin-bg;
}

.intro {
  display: block;
  margin-bottom: $app-space-base;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.search {
  height: 72rpx;
  margin-bottom: 20rpx;
  padding: 0 22rpx;
  font-size: 22rpx;
  background-color: $app-color-white;
  border: 1rpx solid $app-color-border;
  border-radius: $app-radius-pill;
}

.hint {
  padding: $app-space-lg 0;
  text-align: center;
  font-size: 22rpx;
  color: $app-color-text-muted;
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
  width: 120rpx;
  height: 120rpx;
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

.meta {
  margin-top: $app-space-xs;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.arrow {
  font-size: $app-font-lg;
  color: $app-color-text-secondary;
}
</style>
