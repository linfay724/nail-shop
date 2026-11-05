<template>
  <view class="step-editor">
    <view class="top">
      <text class="order">第 {{ index + 1 }} 步</text>
      <view class="ops">
        <text class="op" @click="emit('move-up', index)">上移</text>
        <text class="op" @click="emit('move-down', index)">下移</text>
        <text class="op danger" @click="emit('remove', index)">删除</text>
      </view>
    </view>

    <u-textarea
      :model-value="step.description"
      :maxlength="120"
      placeholder="描述这一步的操作要点"
      @update:model-value="(v) => patch({ description: v })"
    />

    <view class="images">
      <view v-for="(image, imageIndex) in step.images" :key="image" class="image-wrap">
        <image class="image" :src="image" mode="aspectFill" @click="preview(imageIndex)" />
        <text class="remove-image" @click="removeImage(imageIndex)">×</text>
      </view>
      <view class="add-image" @click="chooseImage">+ 图片</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { CraftStep } from '@/api/contract'

const props = defineProps<{ step: CraftStep; index: number }>()
const emit = defineEmits<{
  (event: 'update:step', value: CraftStep): void
  (event: 'remove', index: number): void
  (event: 'move-up', index: number): void
  (event: 'move-down', index: number): void
}>()

function patch(partial: Partial<CraftStep>): void {
  emit('update:step', { ...props.step, ...partial })
}

function chooseImage(): void {
  uni.chooseMedia({
    count: 3,
    mediaType: ['image'],
    sourceType: ['album', 'camera'],
    success: (result) => {
      const paths = result.tempFiles.map((file) => file.tempFilePath)
      patch({ images: [...props.step.images, ...paths] })
    },
    fail: (error) => console.warn('[step-editor] choose image canceled', error),
  })
}

function removeImage(index: number): void {
  patch({ images: props.step.images.filter((_image, imageIndex) => imageIndex !== index) })
}

function preview(index: number): void {
  uni.previewImage({ urls: props.step.images, current: props.step.images[index] })
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
  color: #dd524d;
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
  border-radius: $app-radius-sm;
}

.remove-image {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
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
  background-color: #f5f5f5;
  border-radius: $app-radius-sm;
}
</style>
