<template>
  <view class="home">
    <view class="hero">
      <view class="hero-bubble bubble-pink" />
      <view class="hero-bubble bubble-blue" />
      <view class="hero-text">
        <text class="hero-title">Hi~ 今天想换哪副指甲呀</text>
        <text class="hero-sub">手作穿戴甲 · 测量即合 · 现货直发</text>
      </view>
    </view>

    <view v-if="banners.length > 0" class="banner-wrap">
      <u-swiper :list="banners" height="300" radius="32" />
    </view>

    <view class="section">
      <view class="section-title">
        <text class="dot dot-pink" />
        按风格挑选
        <text class="dot dot-blue" />
      </view>
      <view class="chips">
        <text v-for="style in STYLE_OPTIONS" :key="style" class="chip chip-pink" @click="goList({ style })">
          {{ style }}
        </text>
      </view>
    </view>

    <view class="section">
      <view class="section-title">
        <text class="dot dot-blue" />
        按甲型挑选
        <text class="dot dot-pink" />
      </view>
      <view class="chips">
        <text v-for="shape in SHAPE_OPTIONS" :key="shape" class="chip chip-blue" @click="goList({ shape })">
          {{ shape }}
        </text>
      </view>
    </view>

    <view class="section">
      <view class="section-title">
        <text class="dot dot-pink" />
        店长推荐
      </view>
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
}

.hero {
  position: relative;
  overflow: hidden;
  margin-bottom: $app-space-base;
  padding: $app-space-lg $app-space-base;
  background: linear-gradient(120deg, #ffd9e8 0%, #ffeef5 45%, #dcefff 100%);
  border-radius: $app-radius-lg;
}

.hero-bubble {
  position: absolute;
  border-radius: 50%;
  opacity: 0.55;
}

.bubble-pink {
  top: -30rpx;
  right: -20rpx;
  width: 140rpx;
  height: 140rpx;
  background: #ffb7cf;
}

.bubble-blue {
  bottom: -40rpx;
  right: 120rpx;
  width: 100rpx;
  height: 100rpx;
  background: #a8d4f7;
}

.hero-text {
  position: relative;
  display: flex;
  flex-direction: column;
}

.hero-title {
  font-size: $app-font-lg;
  color: $app-color-text;
  font-weight: 700;
}

.hero-sub {
  margin-top: $app-space-xs;
  font-size: $app-font-sm;
  color: $app-color-text-secondary;
}

.banner-wrap {
  margin-bottom: $app-space-base;
}

.section {
  margin-top: $app-space-base;
}

.section-title {
  display: flex;
  align-items: center;
  margin-bottom: $app-space-sm;
  font-size: $app-font-base;
  color: $app-color-text;
  font-weight: 700;
}

.dot {
  width: 14rpx;
  height: 14rpx;
  margin: 0 $app-space-xs;
  border-radius: 50%;
}

.dot-pink {
  background-color: $app-color-primary;
}

.dot-blue {
  background-color: $app-color-secondary;
}

.chips {
  display: flex;
  flex-wrap: wrap;
}

.chip {
  margin: 0 $app-space-sm $app-space-sm 0;
  padding: 12rpx 28rpx;
  font-size: $app-font-sm;
  background-color: #fff;
  border-radius: $app-radius-pill;
}

.chip-pink {
  color: $app-color-primary-dark;
  border: 2rpx solid #ffd9e8;
}

.chip-blue {
  color: $app-color-secondary-dark;
  border: 2rpx solid #d5ebfc;
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
