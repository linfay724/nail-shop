<template>
  <view class="admin-products">
    <view class="toolbar">
      <u-search v-model="keyword" placeholder="搜索商品名称" :show-action="false" />
      <u-button type="primary" size="small" custom-style="margin-left: 20rpx" @click="create">
        新增
      </u-button>
    </view>

    <view v-if="filtered.length === 0" class="hint">暂无商品</view>

    <view v-for="item in filtered" :key="item.id" class="item">
      <image class="cover" :src="item.cover" mode="aspectFill" />
      <view class="info">
        <text class="name">{{ item.name }}</text>
        <text class="meta">{{ item.style }} · {{ item.shape }} · {{ formatPrice(item.price) }}</text>
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
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { adminApi } from '@/api/admin'
import { toastError } from '@/api/transport'
import type { AdminProduct } from '@/api/contract'
import { useAdminGuard } from '@/utils/admin-guard'
import { formatPrice } from '@/utils/price'

const products = ref<AdminProduct[]>([])
const keyword = ref('')
let guarded = false

const filtered = computed(() =>
  products.value.filter((item) => !keyword.value || item.name.includes(keyword.value)),
)

async function load(): Promise<void> {
  if (!guarded) {
    return
  }
  try {
    products.value = await adminApi.listProducts()
  } catch (error) {
    toastError(error)
  }
}

onLoad(() => {
  guarded = useAdminGuard()
})

onShow(() => {
  void load()
})

function createToggle(id: string) {
  return (value: boolean): void => {
    void toggle(id, value)
  }
}

async function toggle(id: string, onSale: boolean): Promise<void> {
  try {
    products.value = await adminApi.toggleProduct(id, onSale)
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
  padding: $app-space-base;
  background-color: $app-color-bg;
}

.toolbar {
  display: flex;
  align-items: center;
  margin-bottom: $app-space-base;
}

.hint {
  padding: $app-space-lg 0;
  text-align: center;
  font-size: $app-font-sm;
  color: $app-color-text-secondary;
}

.item {
  display: flex;
  align-items: flex-start;
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
  color: #dd524d;
}
</style>
