<template>
  <view class="reviews-page">
    <view class="summary">
      <text class="score">{{ averageText }}</text>
      <text class="count">共 {{ count }} 条评价</text>
    </view>

    <view v-if="loading && list.length === 0" class="hint">加载中…</view>
    <u-empty v-else-if="list.length === 0" mode="list" text="暂无评价" />
    <template v-else>
      <view class="list">
        <review-card v-for="review in list" :key="review.id" :review="review" />
      </view>

      <view v-if="list.length > 0" class="footer">
        <text v-if="loading">加载中…</text>
        <text v-else-if="!hasMore">— 没有更多评价了 —</text>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onReachBottom } from '@dcloudio/uni-app'
import { reviewApi } from '@/api/review'
import type { PublicReview } from '@/api/contract'
import ReviewCard from '@/components/review-card.vue'

const productId = ref('')
const list = ref<PublicReview[]>([])
const count = ref(0)
const average = ref(0)
const page = ref(1)
const hasMore = ref(false)
const loading = ref(false)

const averageText = computed(() => (count.value > 0 ? `${average.value} 分` : '暂无评分'))

async function load(reset = false): Promise<void> {
  if (!productId.value || loading.value) {
    return
  }

  loading.value = true
  try {
    const target = reset ? 1 : page.value + 1
    const result = await reviewApi.listByProduct(productId.value, target)
    list.value = reset ? result.list : [...list.value, ...result.list]
    count.value = result.count
    average.value = result.average
    page.value = result.page
    hasMore.value = result.hasMore
  } catch (error) {
    console.warn('[product/reviews] load failed', error)
  } finally {
    loading.value = false
  }
}

onLoad((options) => {
  const id = options?.id
  if (!id) {
    return
  }
  productId.value = id
  void load(true)
})

onReachBottom(() => {
  if (hasMore.value) {
    void load(false)
  }
})
</script>

<style lang="scss" scoped>
.reviews-page {
  min-height: 100vh;
  padding: 28rpx;
  padding-bottom: $app-space-lg;
  background-color: $app-color-bg;
}

.summary {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 24rpx;
  background-color: $app-color-white;
  border: 1rpx solid $app-color-border;
  border-radius: $app-radius-lg;
  box-shadow: $app-shadow;
}

.score {
  font-size: 40rpx;
  font-weight: 700;
  color: #d6a34f;
}

.count {
  font-size: 22rpx;
  color: $app-color-text-muted;
}

.list {
  margin-top: 20rpx;
  padding: 10rpx 24rpx;
  background-color: $app-color-white;
  border: 1rpx solid $app-color-border;
  border-radius: $app-radius-lg;
  box-shadow: $app-shadow;
}

.hint {
  padding: $app-space-lg 0;
  text-align: center;
  font-size: $app-font-sm;
  color: $app-color-text-muted;
}

.footer {
  padding: 24rpx 0;
  text-align: center;
  font-size: 20rpx;
  color: $app-color-text-muted;
}
</style>
