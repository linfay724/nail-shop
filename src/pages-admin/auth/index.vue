<template>
  <view class="auth">
    <text class="title">管理端鉴权</text>
    <text class="desc">仅店主可用，请输入管理口令</text>
    <u-input v-model="passcode" password placeholder="请输入管理口令" custom-style="margin: 32rpx 0" />
    <u-button type="primary" :loading="loading" @click="submit">进入管理端</u-button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { toastError } from '@/api/transport'

const admin = useAdminStore()
const passcode = ref('')
const loading = ref(false)

async function submit(): Promise<void> {
  if (!passcode.value) {
    uni.showToast({ title: '请输入管理口令', icon: 'none' })
    return
  }

  loading.value = true
  try {
    await admin.login(passcode.value)
    uni.redirectTo({ url: '/pages-admin/index/index' })
  } catch (error) {
    toastError(error)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.auth {
  min-height: 100vh;
  padding: 120rpx $app-space-lg;
  background-color: $app-color-bg;
}

.title {
  font-size: $app-font-xl;
  color: $app-color-text;
  font-weight: 600;
}

.desc {
  display: block;
  margin-top: $app-space-sm;
  font-size: $app-font-sm;
  color: $app-color-text-secondary;
}
</style>
