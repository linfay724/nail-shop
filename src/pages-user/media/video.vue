<template>
  <view class="page">
    <video v-if="url" class="video" :src="url" :autoplay="true" controls object-fit="contain" />
    <view v-else class="empty">视频地址无效</view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const url = ref('')

onLoad((options) => {
  url.value = options?.url ? decodeURIComponent(options.url) : ''
})
</script>

<style lang="scss" scoped>
.page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #000;
}

.video {
  width: 100%;
  height: 60vh;
}

.empty {
  font-size: $app-font-sm;
  color: #fff;
}
</style>
