<template>
  <view class="page">
    <view v-if="order" class="card">
      <image class="cover" :src="order.items[0]?.cover" mode="aspectFill" />
      <view class="info">
        <text class="name">{{ order.items[0]?.name }}</text>
        <text class="spec">{{ specText }}</text>
      </view>
    </view>

    <view class="card">
      <text class="section-title">评分</text>
      <view class="stars">
        <text
          v-for="star in 5"
          :key="star"
          class="star"
          :class="{ active: star <= rating }"
          @click="rating = star"
        >
          ★
        </text>
      </view>

      <textarea
        v-model="content"
        class="textarea"
        placeholder="说说这副甲片的颜色、贴合度和佩戴感受吧"
        maxlength="500"
      />
      <text class="counter">{{ content.length }}/500</text>

      <text class="section-title">图片或视频</text>
      <text class="tip">最多 9 张图片，或 1 个短视频</text>
      <media-uploader v-model="media" />
    </view>

    <view class="actions">
      <u-button type="primary" :loading="submitting" @click="submit">发布评价</u-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { orderApi } from '@/api/order'
import { reviewApi } from '@/api/review'
import { toastError } from '@/api/transport'
import { SHAPE_LABELS, SIZE_LABELS, type PublicOrder, type ReviewMedia } from '@/api/contract'
import MediaUploader from '@/components/media-uploader.vue'

const order = ref<PublicOrder | null>(null)
const rating = ref(5)
const content = ref('')
const media = ref<ReviewMedia[]>([])
const submitting = ref(false)

const specText = computed(() => {
  const item = order.value?.items[0]
  if (!item) {
    return ''
  }
  if (item.isAccessory || !item.size || !item.shape) {
    return item.unit
  }
  return `${SIZE_LABELS[item.size]} / ${SHAPE_LABELS[item.shape]}`
})

onLoad(async (options) => {
  const orderId = options?.orderId
  if (!orderId) {
    uni.showToast({ title: '缺少订单信息', icon: 'none' })
    uni.navigateBack()
    return
  }

  try {
    const detail = await orderApi.detail(orderId)
    if (detail.status !== 'completed' || detail.reviewed) {
      uni.showToast({ title: '该订单当前不可评价', icon: 'none' })
      uni.navigateBack()
      return
    }
    order.value = detail
  } catch (error) {
    toastError(error)
  }
})

async function submit(): Promise<void> {
  if (!order.value) {
    return
  }
  if (rating.value < 1) {
    uni.showToast({ title: '请选择评分', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    await reviewApi.create({
      orderId: order.value.id,
      rating: rating.value,
      content: content.value.trim(),
      media: media.value,
    })
    uni.showToast({ title: '评价已发布', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 600)
  } catch (error) {
    toastError(error)
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: $app-space-base;
  background-color: $app-color-bg;
}

.card {
  margin-bottom: $app-space-sm;
  padding: $app-space-base;
  background-color: #fff;
  border-radius: $app-radius-base;
}

.cover {
  width: 120rpx;
  height: 120rpx;
  border-radius: $app-radius-base;
}

.info {
  display: flex;
  flex-direction: column;
  margin-left: $app-space-sm;
}

.name {
  font-size: $app-font-base;
  color: $app-color-text;
}

.spec {
  margin-top: $app-space-xs;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.section-title {
  font-size: $app-font-sm;
  color: $app-color-text;
}

.stars {
  display: flex;
  margin: $app-space-xs 0 $app-space-sm;
}

.star {
  margin-right: 12rpx;
  font-size: 48rpx;
  color: $app-color-disabled-bg;
}

.star.active {
  color: #d6a34f;
}

.textarea {
  width: 100%;
  height: 200rpx;
  margin-top: $app-space-xs;
  padding: $app-space-sm;
  font-size: $app-font-sm;
  background-color: $app-color-input-bg;
  border-radius: $app-radius-base;
}

.counter {
  display: block;
  margin: $app-space-xs 0 $app-space-base;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
  text-align: right;
}

.tip {
  display: block;
  margin: $app-space-xs 0 $app-space-sm;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.actions {
  margin-top: $app-space-base;
}
</style>
