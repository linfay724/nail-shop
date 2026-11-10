<template>
  <view class="admin-products admin-theme">
    <view class="toolbar">
      <input v-model="keyword" class="search" placeholder="搜索商品名称" confirm-type="search" @confirm="reload" />
      <u-button type="primary" size="small" custom-style="margin-left: 20rpx" @click="create">
        新增
      </u-button>
    </view>

    <view v-if="products.length === 0 && !loading" class="hint">暂无商品</view>

    <view v-for="item in products" :key="item.id" class="item">
      <image class="cover" :src="item.cover" mode="aspectFill" />
      <view class="info">
        <text class="name">{{ item.name }}</text>
        <text class="meta">{{ item.style }} · {{ formatPrice(item.price) }} · {{ item.skus.length }} 个组合</text>
        <view class="row">
          <u-switch :model-value="item.onSale" size="20" @change="createToggle(item.id)" />
          <text class="switch-label">{{ item.onSale ? '已上架' : '已下架' }}</text>
        </view>
      </view>
      <view class="actions">
        <text class="action" @click="edit(item.id)">编辑</text>
        <text class="action" @click="openCraft(item.id)">档案</text>
        <text class="action danger" @click="remove(item)">删除</text>
      </view>
    </view>

    <view v-if="products.length > 0" class="footer">
      <text v-if="loading">加载中…</text>
      <text v-else-if="!hasMore">没有更多了</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onReachBottom, onShow } from '@dcloudio/uni-app'
import { adminApi } from '@/api/admin'
import { toastError } from '@/api/transport'
import type { AdminProduct } from '@/api/contract'
import { useAdminGuard } from '@/utils/admin-guard'
import { formatPrice } from '@/utils/price'

const products = ref<AdminProduct[]>([])
const keyword = ref('')
const page = ref(1)
const hasMore = ref(false)
const loading = ref(false)
let guarded = false

async function load(reset = true): Promise<void> {
  if (!guarded) {
    return
  }

  loading.value = true
  try {
    const target = reset ? 1 : page.value + 1
    const result = await adminApi.listProducts(keyword.value.trim(), target)
    products.value = reset ? result.list : [...products.value, ...result.list]
    page.value = result.page
    hasMore.value = result.hasMore
  } catch (error) {
    toastError(error)
  } finally {
    loading.value = false
  }
}

function reload(): void {
  void load(true)
}

onLoad(() => {
  guarded = useAdminGuard('product:read')
})

onShow(() => {
  void load(true)
})

onReachBottom(() => {
  if (hasMore.value && !loading.value) {
    void load(false)
  }
})

function createToggle(id: string) {
  return (value: boolean): void => {
    void toggle(id, value)
  }
}

async function toggle(id: string, onSale: boolean): Promise<void> {
  try {
    const updated = await adminApi.toggleProduct(id, onSale)
    products.value = products.value.map((item) => (item.id === id ? updated : item))
  } catch (error) {
    toastError(error)
  }
}

function create(): void {
  uni.navigateTo({ url: '/pages-admin/product/edit' })
}

function edit(id: string): void {
  uni.navigateTo({ url: `/pages-admin/product/edit?id=${id}` })
}

function openCraft(id: string): void {
  uni.navigateTo({ url: `/pages-admin/craft/edit?productId=${id}` })
}

function remove(item: AdminProduct): void {
  uni.showModal({
    title: '删除商品',
    content: `删除「${item.name}」将同时删除其制作档案，确定继续？`,
    success: async (result) => {
      if (!result.confirm) {
        return
      }
      try {
        await adminApi.removeProduct(item.id)
        products.value = products.value.filter((product) => product.id !== item.id)
      } catch (error) {
        toastError(error)
      }
    },
  })
}
</script>

<style lang="scss" scoped>
.admin-products {
  min-height: 100vh;
  padding: 28rpx;
  background-color: $app-color-admin-bg;
}

.toolbar {
  display: flex;
  align-items: center;
  margin-bottom: $app-space-base;
}

.search {
  flex: 1;
  height: 72rpx;
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
  align-items: flex-start;
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
  margin-left: $app-space-sm;
}

.name {
  font-size: $app-font-base;
  color: $app-color-text;
}

.meta {
  display: block;
  margin-top: $app-space-xs;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.row {
  display: flex;
  align-items: center;
  margin-top: $app-space-xs;
}

.switch-label {
  margin-left: $app-space-xs;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.actions {
  display: flex;
  flex-direction: column;
}

.action {
  margin-bottom: $app-space-xs;
  font-size: $app-font-xs;
  color: $app-color-primary;
  text-align: right;
}

.danger {
  color: $app-color-danger;
}

.footer {
  padding: $app-space-base 0;
  text-align: center;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}
</style>
