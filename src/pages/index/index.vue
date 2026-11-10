<template>
  <view class="home">
    <view class="intro">
      <text class="kicker">PETIT NAIL STUDIO · 指尖美学</text>
      <text class="greeting">把精致，戴在指尖。</text>
      <text class="subtitle">为日常挑一份温柔的小心意</text>
    </view>

    <view class="hero" @click="openHero">
      <view class="hero-copy">
        <text class="hero-label">NEW COLLECTION</text>
        <text class="hero-title">春日轻法式</text>
        <text class="hero-desc">温柔配色 · 日常百搭</text>
        <text class="hero-link">发现本季新款 →</text>
      </view>
      <view class="hero-art">
        <view class="nail nail-1" />
        <view class="nail nail-2" />
        <view class="nail nail-3" />
        <view class="nail nail-4" />
        <view class="nail nail-5" />
      </view>
      <text class="hero-no">01 / 0{{ heroTotal }}</text>
    </view>

    <view class="section-head">
      <view class="section-copy">
        <text class="section-title">本周人气精选</text>
        <text class="section-sub">大家都喜欢的温柔款式</text>
      </view>
      <view class="more" @click="goList">
        <text class="more-text">全部款式</text>
        <text class="more-arrow">→</text>
      </view>
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

    <view class="service">
      <text class="service-title">一点点用心，让美更贴近日常</text>
      <view class="service-items">
        <text class="service-item"><text class="service-icon">✦</text>精致手作</text>
        <text class="service-item"><text class="service-icon">♡</text>温柔设计</text>
        <text class="service-item"><text class="service-icon">⌁</text>轻松佩戴</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { productApi } from '@/api/product'
import type { PublicProduct } from '@/api/contract'
import ProductCard from '@/components/product-card.vue'

const products = ref<PublicProduct[]>([])
const loading = ref(true)

const recommend = computed(() => products.value.slice(0, 6))
const heroTotal = computed(() => Math.max(3, Math.min(products.value.length, 9)))

async function load(): Promise<void> {
  loading.value = true
  try {
    const result = await productApi.list({ page: 1, pageSize: 6 })
    products.value = result.list
  } catch (error) {
    console.warn('[home] load failed', error)
  } finally {
    loading.value = false
  }
}

function goList(): void {
  uni.switchTab({ url: '/pages/product/list' })
}

function openDetail(product: PublicProduct): void {
  uni.navigateTo({ url: `/pages/product/detail?id=${product.id}` })
}

function openHero(): void {
  const first = recommend.value[0]
  if (first) {
    openDetail(first)
    return
  }
  goList()
}

onShow(() => {
  void load()
})
</script>

<style lang="scss" scoped>
.home {
  min-height: 100vh;
  padding: 24rpx 26rpx 32rpx;
}

.intro {
  padding: 2rpx 4rpx 22rpx;
}

.kicker {
  display: block;
  color: $app-color-primary-dark;
  font-size: 16rpx;
  letter-spacing: 3rpx;
  font-weight: 600;
}

.greeting {
  display: block;
  margin-top: 6rpx;
  font-family: $app-font-serif;
  font-size: 38rpx;
  line-height: 1.35;
  letter-spacing: 1rpx;
  color: $app-color-text;
}

.subtitle {
  display: block;
  margin-top: 6rpx;
  color: $app-color-text-muted;
  font-size: 20rpx;
  letter-spacing: 0.8rpx;
}

.hero {
  position: relative;
  overflow: hidden;
  height: 284rpx;
  border-radius: 32rpx;
  background: linear-gradient(112deg, #f4e3e1 0%, #ebd5d7 53%, #dccbd9 100%);
  box-shadow: 0 10rpx 28rpx rgba(140, 59, 74, 0.09);
}

.hero-copy {
  position: relative;
  z-index: 2;
  padding: 34rpx 0 0 30rpx;
}

.hero-label {
  display: block;
  font-size: 14rpx;
  letter-spacing: 2.8rpx;
  color: #986b70;
  font-weight: 600;
}

.hero-title {
  display: block;
  margin-top: 10rpx;
  font-family: $app-font-serif;
  font-size: 40rpx;
  color: #633e47;
  letter-spacing: 2rpx;
}

.hero-desc {
  display: block;
  margin-top: 4rpx;
  font-size: 18rpx;
  color: #85666b;
}

.hero-link {
  display: inline-block;
  margin-top: 20rpx;
  padding: 8rpx 18rpx;
  border: 1rpx solid rgba(140, 59, 74, 0.28);
  border-radius: $app-radius-pill;
  color: #754650;
  font-size: 16rpx;
}

.hero-art {
  position: absolute;
  right: 2rpx;
  top: 0;
  width: 264rpx;
  height: 284rpx;
}

.hero-art::before {
  content: '';
  position: absolute;
  right: 8rpx;
  top: 32rpx;
  width: 224rpx;
  height: 224rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.28);
}

.hero-art::after {
  content: '';
  position: absolute;
  right: 48rpx;
  top: 72rpx;
  width: 144rpx;
  height: 144rpx;
  border-radius: 50%;
  border: 1rpx solid rgba(255, 255, 255, 0.5);
}

.nail {
  position: absolute;
  display: block;
  width: 30rpx;
  height: 86rpx;
  border-radius: 22rpx 22rpx 16rpx 16rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.82);
  background: linear-gradient(145deg, #fff9f3 0%, #e8c5c3 68%, #c98f98 100%);
  box-shadow: 4rpx 8rpx 14rpx rgba(103, 63, 70, 0.16);
}

.nail-1 {
  right: 158rpx;
  top: 94rpx;
  transform: rotate(-30deg);
}

.nail-2 {
  right: 114rpx;
  top: 66rpx;
  transform: rotate(-12deg);
}

.nail-3 {
  right: 70rpx;
  top: 74rpx;
  transform: rotate(5deg);
}

.nail-4 {
  right: 34rpx;
  top: 106rpx;
  transform: rotate(20deg);
}

.nail-5 {
  right: 86rpx;
  top: 150rpx;
  height: 70rpx;
  transform: rotate(3deg);
}

.hero-no {
  position: absolute;
  right: 24rpx;
  bottom: 16rpx;
  z-index: 2;
  color: rgba(99, 62, 71, 0.62);
  font-size: 14rpx;
  letter-spacing: 2rpx;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin: 30rpx 2rpx 16rpx;
}

.section-copy {
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 26rpx;
  font-weight: 600;
  color: $app-color-text;
}

.section-sub {
  margin-top: 4rpx;
  font-size: 20rpx;
  color: $app-color-text-muted;
}

.more {
  display: flex;
  align-items: flex-end;
  padding-bottom: 2rpx;
}

.more-text {
  color: $app-color-text-muted;
  font-size: 18rpx;
}

.more-arrow {
  margin-left: 4rpx;
  color: $app-color-primary-dark;
  font-size: 20rpx;
}

.loading {
  padding: $app-space-lg 0;
  text-align: center;
  font-size: $app-font-sm;
  color: $app-color-text-muted;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
}

.service {
  margin-top: 24rpx;
  padding: 18rpx 16rpx 16rpx;
  border: 1rpx solid $app-color-border;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.72);
  text-align: center;
}

.service-title {
  display: block;
  color: $app-color-text-secondary;
  font-family: $app-font-serif;
  font-size: 18rpx;
  letter-spacing: 0.8rpx;
}

.service-items {
  display: flex;
  justify-content: space-around;
  margin-top: 12rpx;
}

.service-item {
  color: $app-color-text-muted;
  font-size: 16rpx;
}

.service-icon {
  margin-right: 6rpx;
  color: $app-color-primary-hover;
  font-size: 20rpx;
}
</style>
