<template>
  <view class="home">
    <u-swiper v-if="banners.length > 0" :list="banners" height="300" radius="24" />

    <view class="section">
      <view class="section-title">按风格挑选</view>
      <view class="chips">
        <text v-for="style in STYLE_OPTIONS" :key="style" class="chip" @click="goList({ style })">
          {{ style }}
        </text>
      </view>
    </view>

    <view class="section">
      <view class="section-title">按甲型挑选</view>
      <view class="chips">
        <text v-for="shape in SHAPE_OPTIONS" :key="shape" class="chip" @click="goList({ shape })">
          {{ shape }}
        </text>
      </view>
    </view>

    <view class="section">
      <view class="section-title">店长推荐</view>
      <view v-if="loading" class="loading">加载中…</view>
      <u-empty v-else-if="recommend.length === 0" mode="list" text="暂无推荐商品" />
      <view v-else class="grid">
        <product-card
          v-for="item in recommend"
          :key="item.id"
          :product="item"
          @click="openDetail"
        />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { productApi } from '@/api/product'
import type { PublicProduct } from '@/api/contract'
import { SHAPE_OPTIONS, STYLE_OPTIONS } from '@/api/contract'
import ProductCard from '@/components/product-card.vue'
import { setStorage } from '@/utils/storage'

const products = ref<PublicProduct[]>([])
const loading = ref(true)

const banners = computed(() =>
  products.value.slice(0, 3).map((item) => ({ image: item.cover, title: item.name })),
)

const recommend = computed(() => products.value.slice(0, 6))

async function load(): Promise<void> {
  loading.value = true
  try {
    products.value = await productApi.list()
  } catch (error) {
    console.warn('[home] load failed', error)
  } finally {
    loading.value = false
  }
}

function goList(filter: { style?: string; shape?: string }): void {
  setStorage('product_filter', filter)
  uni.switchTab({ url: '/pages/product/list' })
}

function openDetail(product: PublicProduct): void {
  uni.navigateTo({ url: `/pages/product/detail?id=${product.id}` })
}

onShow(() => {
  void load()
})
</script>

<style lang="scss" scoped>
.home {
  min-height: 100vh;
  padding: $app-space-base;
  background-color: $app-color-bg;
}

.section {
  margin-top: $app-space-base;
}

.section-title {
  margin-bottom: $app-space-sm;
  font-size: $app-font-base;
  color: $app-color-text;
  font-weight: 600;
}

.chips {
  display: flex;
  flex-wrap: wrap;
}

.chip {
  margin: 0 $app-space-sm $app-space-sm 0;
  padding: 12rpx 24rpx;
  font-size: $app-font-sm;
  color: $app-color-text;
  background-color: #fff;
  border-radius: $app-radius-lg;
}

.loading {
  padding: $app-space-lg 0;
  text-align: center;
  font-size: $app-font-sm;
  color: $app-color-text-secondary;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $app-space-sm;
}
</style>
