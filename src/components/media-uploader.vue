<template>
  <view class="media-uploader">
    <view v-for="(item, index) in modelValue" :key="`${item.url}-${index}`" class="media-item">
      <image
        v-if="item.type === 'image'"
        class="thumb"
        :src="item.url"
        mode="aspectFill"
        @click="previewImage(index)"
      />
      <view v-else class="thumb video" @click="playVideo(item.url)">
        <text class="play">▶</text>
        <text class="video-label">视频</text>
      </view>
      <text class="remove" @click="removeAt(index)">×</text>
    </view>

    <view v-if="canAdd" class="add" @click="choose">
      <text class="plus">＋</text>
      <text class="add-label">{{ addLabel }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ReviewMedia } from '@/api/contract'
import { uploadMedia } from '@/api/upload'

const props = withDefaults(
  defineProps<{ modelValue: ReviewMedia[]; maxImages?: number }>(),
  { maxImages: 9 },
)
const emit = defineEmits<{ (event: 'update:modelValue', value: ReviewMedia[]): void }>()

const imageCount = computed(() => props.modelValue.filter((item) => item.type === 'image').length)
const hasVideo = computed(() => props.modelValue.some((item) => item.type === 'video'))
const canAdd = computed(() => !hasVideo.value && imageCount.value < props.maxImages)
const addLabel = computed(() => (imageCount.value > 0 ? '图片' : '图片/视频'))

function update(next: ReviewMedia[]): void {
  emit('update:modelValue', next)
}

function removeAt(index: number): void {
  update(props.modelValue.filter((_, i) => i !== index))
}

function previewImage(index: number): void {
  const images = props.modelValue.filter((item) => item.type === 'image').map((item) => item.url)
  const current = props.modelValue[index]?.url
  uni.previewImage({ urls: images, current })
}

function playVideo(url: string): void {
  uni.navigateTo({ url: `/pages-user/media/video?url=${encodeURIComponent(url)}` })
}

async function choose(): Promise<void> {
  try {
    const mediaType: Array<'image' | 'video'> = imageCount.value > 0 ? ['image'] : ['image', 'video']
    const result = await new Promise<UniApp.ChooseMediaSuccessCallbackResult>((resolve, reject) => {
      uni.chooseMedia({
        count: imageCount.value > 0 ? props.maxImages - imageCount.value : 1,
        mediaType,
        sourceType: ['album', 'camera'],
        success: resolve,
        fail: reject,
      })
    })

    const picked: ReviewMedia[] = []
    for (const file of result.tempFiles) {
      const type = file.fileType === 'video' ? 'video' : 'image'
      const url = await uploadMedia(file.tempFilePath, type)
      picked.push({ type, url })
      if (type === 'video') {
        break
      }
    }

    update([...props.modelValue, ...picked])
  } catch (error) {
    console.warn('[media] choose failed', error)
  }
}
</script>

<style lang="scss" scoped>
.media-uploader {
  display: flex;
  flex-wrap: wrap;
}

.media-item {
  position: relative;
  width: 180rpx;
  height: 180rpx;
  margin: 0 $app-space-xs $app-space-xs 0;
}

.thumb {
  width: 180rpx;
  height: 180rpx;
  border-radius: $app-radius-base;
  background-color: #f2f2f5;
}

.video {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.play {
  font-size: 40rpx;
  color: $app-color-primary;
}

.video-label {
  margin-top: 4rpx;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.remove {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  width: 36rpx;
  height: 36rpx;
  line-height: 32rpx;
  text-align: center;
  font-size: 28rpx;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
}

.add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 180rpx;
  height: 180rpx;
  border: 2rpx dashed $app-color-primary-hover;
  border-radius: $app-radius-base;
}

.plus {
  font-size: 40rpx;
  color: $app-color-text-secondary;
}

.add-label {
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}
</style>
