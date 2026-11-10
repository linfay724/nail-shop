<template>
  <view class="review-card">
    <view class="head">
      <text class="nickname">{{ review.nickname }}</text>
      <text class="rating">{{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}</text>
    </view>
    <text class="content">{{ review.content || '该用户未填写评价内容' }}</text>
    <view v-if="review.media.length > 0" class="media">
      <template v-for="(item, index) in review.media" :key="`${item.url}-${index}`">
        <image
          v-if="item.type === 'image'"
          class="media-thumb"
          :src="item.url"
          mode="aspectFill"
          @click="preview(index)"
        />
        <view v-else class="media-thumb video" @click="play(item.url)">
          <text class="play">▶</text>
        </view>
      </template>
    </view>
    <text class="time">{{ formatTime(review.createdAt) }}</text>
  </view>
</template>

<script setup lang="ts">
import type { PublicReview } from '@/api/contract'

const props = defineProps<{ review: PublicReview }>()

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function preview(index: number): void {
  const urls = props.review.media.filter((item) => item.type === 'image').map((item) => item.url)
  uni.previewImage({ urls, current: props.review.media[index]?.url })
}

function play(url: string): void {
  uni.navigateTo({ url: `/pages-user/media/video?url=${encodeURIComponent(url)}` })
}
</script>

<style lang="scss" scoped>
.review-card {
  padding: $app-space-sm 0;
  border-bottom: 2rpx solid #f2f2f5;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nickname {
  font-size: $app-font-sm;
  color: $app-color-text;
}

.rating {
  font-size: $app-font-sm;
  color: #d6a34f;
}

.content {
  display: block;
  margin-top: $app-space-xs;
  font-size: $app-font-sm;
  color: $app-color-text;
  line-height: 1.6;
}

.media {
  display: flex;
  flex-wrap: wrap;
  margin-top: $app-space-xs;
}

.media-thumb {
  width: 160rpx;
  height: 160rpx;
  margin: 0 $app-space-xs $app-space-xs 0;
  border-radius: $app-radius-base;
  background-color: #f2f2f5;
}

.video {
  display: flex;
  align-items: center;
  justify-content: center;
}

.play {
  font-size: 36rpx;
  color: $app-color-primary;
}

.time {
  display: block;
  margin-top: $app-space-xs;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}
</style>
