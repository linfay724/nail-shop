<template>
  <view class="step-editor">
    <view class="top">
      <text class="order">第 {{ index + 1 }} 步</text>
      <view v-if="!readonly" class="ops">
        <text class="op" @click="emit('move-up', index)">上移</text>
        <text class="op" @click="emit('move-down', index)">下移</text>
        <text class="op danger" @click="emit('remove', index)">删除</text>
      </view>
    </view>

    <template v-if="readonly">
      <text class="title-text">{{ step.title || '未命名步骤' }}</text>
      <text class="desc-text">{{ step.desc }}</text>
      <view class="images">
        <image
          v-for="(image, imageIndex) in step.images"
          :key="image"
          class="image"
          :src="image"
          mode="aspectFill"
          @click="preview(imageIndex)"
        />
      </view>
      <text v-if="step.video" class="video-link" @click="playVideo">▶ 播放步骤视频</text>
    </template>

    <template v-else>
      <u-input
        :model-value="step.title"
        placeholder="步骤标题，如：两层打底"
        @update:model-value="(v) => patch({ title: v })"
      />
      <u-textarea
        class="desc"
        :model-value="step.desc"
        :maxlength="120"
        placeholder="描述这一步的操作要点"
        @update:model-value="(v) => patch({ desc: v })"
      />

      <view class="images">
        <view v-for="(image, imageIndex) in step.images" :key="image" class="image-wrap">
          <image class="image" :src="image" mode="aspectFill" @click="preview(imageIndex)" />
          <text class="remove-image" @click="removeImage(imageIndex)">×</text>
        </view>
        <view v-if="step.images.length < 9" class="add-image" @click="chooseImage">+ 图片</view>
      </view>

      <view class="video-row">
        <text class="video-link" @click="chooseVideo">
          {{ step.video ? '更换步骤视频' : '+ 添加步骤视频（1 个）' }}
        </text>
        <text v-if="step.video" class="danger" @click="patch({ video: undefined })">移除视频</text>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import type { CraftStep } from '@/api/contract'
import { uploadMedia } from '@/api/upload'

const props = withDefaults(defineProps<{ step: CraftStep; index: number; readonly?: boolean }>(), {
  readonly: false,
})
const emit = defineEmits<{
  (event: 'update:step', value: CraftStep): void
  (event: 'remove', index: number): void
  (event: 'move-up', index: number): void
  (event: 'move-down', index: number): void
}>()

function patch(partial: Partial<CraftStep>): void {
  emit('update:step', { ...props.step, ...partial })
}

async function chooseImage(): Promise<void> {
  try {
    const result = await new Promise<UniApp.ChooseMediaSuccessCallbackResult>((resolve, reject) => {
      uni.chooseMedia({
        count: 9,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: resolve,
        fail: reject,
      })
    })
    const urls = await Promise.all(
      result.tempFiles.map((file) => uploadMedia(file.tempFilePath, 'image')),
    )
    patch({ images: [...props.step.images, ...urls] })
  } catch (error) {
    console.warn('[step-editor] choose image canceled', error)
  }
}

async function chooseVideo(): Promise<void> {
  try {
    const result = await new Promise<UniApp.ChooseMediaSuccessCallbackResult>((resolve, reject) => {
      uni.chooseMedia({
        count: 1,
        mediaType: ['video'],
        sourceType: ['album', 'camera'],
        maxDuration: 60,
        success: resolve,
        fail: reject,
      })
    })
    const file = result.tempFiles[0]
    if (!file) {
      return
    }
    const url = await uploadMedia(file.tempFilePath, 'video')
    patch({ video: url })
  } catch (error) {
    console.warn('[step-editor] choose video canceled', error)
  }
}

function removeImage(index: number): void {
  patch({ images: props.step.images.filter((_image, imageIndex) => imageIndex !== index) })
}

function preview(index: number): void {
  uni.previewImage({ urls: props.step.images, current: props.step.images[index] })
}

function playVideo(): void {
  if (!props.step.video) {
    return
  }
  uni.navigateTo({ url: `/pages-user/media/video?url=${encodeURIComponent(props.step.video)}` })
}
</script>

<style lang="scss" scoped>
.step-editor {
  margin-bottom: $app-space-sm;
  padding: $app-space-sm;
  background-color: #fff;
  border-radius: $app-radius-base;
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $app-space-xs;
}

.order {
  font-size: $app-font-sm;
  color: $app-color-text;
  font-weight: 600;
}

.ops {
  display: flex;
}

.op {
  margin-left: $app-space-sm;
  font-size: $app-font-xs;
  color: $app-color-primary;
}

.danger {
  color: $app-color-danger;
}

.title-text {
  display: block;
  font-size: $app-font-sm;
  color: $app-color-text;
  font-weight: 600;
}

.desc-text {
  display: block;
  margin-top: $app-space-xs;
  font-size: $app-font-sm;
  color: $app-color-text-secondary;
  line-height: 1.7;
}

.desc {
  margin-top: $app-space-xs;
}

.images {
  display: flex;
  flex-wrap: wrap;
  margin-top: $app-space-xs;
}

.image-wrap {
  position: relative;
  margin-right: $app-space-xs;
}

.image {
  width: 140rpx;
  height: 140rpx;
  margin: 0 $app-space-xs $app-space-xs 0;
  border-radius: $app-radius-sm;
}

.remove-image {
  position: absolute;
  top: -10rpx;
  right: 6rpx;
  width: 32rpx;
  height: 32rpx;
  line-height: 30rpx;
  text-align: center;
  font-size: $app-font-xs;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
}

.add-image {
  width: 140rpx;
  height: 140rpx;
  line-height: 140rpx;
  text-align: center;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
  background-color: $app-color-input-bg;
  border-radius: $app-radius-sm;
}

.video-row {
  display: flex;
  align-items: center;
  margin-top: $app-space-xs;
}

.video-link {
  margin-right: $app-space-sm;
  font-size: $app-font-xs;
  color: $app-color-primary;
}
</style>
