<template>
  <view class="product-list">
    <view class="searchbar">
      <text class="search-icon">🔍</text>
      <input
        v-model="keyword"
        class="search-input"
        placeholder="搜索商品名称或标签"
        confirm-type="search"
        @confirm="onSearch"
      />
      <text class="search-btn" @click="onSearch">搜索</text>
    </view>

    <view class="cat">
      <text
        v-for="item in SORTS"
        :key="item.value"
        class="cat-item"
        :class="{ active: sort === item.value }"
        @click="selectSort(item.value)"
      >
        {{ item.name }}
      </text>
    </view>

    <view v-if="loading && list.length === 0" class="hint">加载中…</view>
    <u-empty v-else-if="list.length === 0" mode="list" text="没有符合条件的商品" />
    <view v-else class="list">
      <view v-for="item in list" :key="item.id" class="card" @click="openDetail(item)">
        <image class="thumb" :src="item.cover" mode="aspectFill" lazy-load />
        <view class="detail">
          <text class="name">{{ item.name }}</text>
          <view class="tags">
            <text class="tag">{{ item.style }}</text>
            <text v-if="item.tags.length > 0" class="tag tag-gray">{{ item.tags[0] }}</text>
          </view>
          <view class="meta">
            <price-tag :price="item.price" :unit="item.isAccessory ? '/件' : '/副'" />
            <text class="sales">已售{{ item.sales }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="list.length > 0" class="footer">
      <text v-if="loading">加载中…</text>
      <text v-else-if="!hasMore">— 上拉加载更多 · 分页 —</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onReachBottom, onShow } from '@dcloudio/uni-app'
import { productApi, type ProductSort } from '@/api/product'
import type { PublicProduct } from '@/api/contract'
import PriceTag from '@/components/price-tag.vue'

const SORTS: Array<{ name: string; value: ProductSort }> = [
  { name: '综合', value: 'default' },
  { name: '销量', value: 'sales' },
  { name: '上新', value: 'newest' },
  { name: '价格', value: 'price' },
]

const sort = ref<ProductSort>('default')
const keyword = ref('')
const list = ref<PublicProduct[]>([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(false)

async function load(reset = true): Promise<void> {
  loading.value = true
  try {
    const target = reset ? 1 : page.value + 1
    const result = await productApi.search({
      keyword: keyword.value.trim() || undefined,
      sort: sort.value,
      page: target,
      pageSize: 10,
    })
    list.value = reset ? result.list : [...list.value, ...result.list]
    page.value = result.page
    hasMore.value = result.hasMore
  } catch (error) {
    console.warn('[product/list] load failed', error)
  } finally {
    loading.value = false
  }
}

function selectSort(value: ProductSort): void {
  if (sort.value === value) {
    return
  }
  sort.value = value
  void load(true)
}

function onSearch(): void {
  void load(true)
}

function openDetail(product: PublicProduct): void {
  uni.navigateTo({ url: `/pages/product/detail?id=${product.id}` })
}

onShow(() => {
  void load(true)
})

onReachBottom(() => {
  if (hasMore.value && !loading.value) {
    void load(false)
  }
})
</script>

<style lang="scss" scoped>
.product-list {
  min-height: 100vh;
  padding: 28rpx;
  padding-bottom: $app-space-lg;
  background-color: $app-color-bg;
}

.searchbar {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  background-color: $app-color-white;
  border: 1rpx solid $app-color-border;
  border-radius: $app-radius-pill;
}

.search-icon {
  margin-right: 10rpx;
  font-size: 20rpx;
}

.search-input {
  flex: 1;
  font-size: $app-font-sm;
  color: $app-color-text;
}

.search-btn {
  margin-left: $app-space-sm;
  font-size: $app-font-xs;
  color: $app-color-primary-dark;
}

.cat {
  display: flex;
  flex-wrap: nowrap;
  margin-top: 16rpx;
  padding-bottom: 6rpx;
}

.cat-item {
  flex: 0 0 auto;
  margin-right: 14rpx;
  padding: 10rpx 22rpx;
  font-size: 22rpx;
  color: $app-color-text-secondary;
  background-color: $app-color-white;
  border: 1rpx solid $app-color-border;
  border-radius: $app-radius-pill;
}

.active {
  color: $app-color-white;
  background-color: $app-color-primary-dark;
  border-color: $app-color-primary-dark;
}

.hint {
  padding: $app-space-lg 0;
  text-align: center;
  font-size: $app-font-sm;
  color: $app-color-text-muted;
}

.list {
  margin-top: 20rpx;
}

.card {
  display: flex;
  margin-bottom: 16rpx;
  padding: 20rpx;
  background-color: $app-color-white;
  border: 1rpx solid $app-color-border;
  border-radius: $app-radius-lg;
  box-shadow: $app-shadow;
}

.thumb {
  flex: 0 0 auto;
  width: 120rpx;
  height: 120rpx;
  margin-right: 20rpx;
  border-radius: 20rpx;
  background-color: $app-color-input-bg;
}

.detail {
  flex: 1;
  min-width: 0;
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
  margin-top: 8rpx;
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
}

.footer {
  padding: 20rpx 0;
  text-align: center;
  font-size: 18rpx;
  color: $app-color-text-muted;
}
</style>
