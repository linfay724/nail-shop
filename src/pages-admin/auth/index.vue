<template>
  <view class="auth admin-theme">
    <text class="title">管理端入口</text>
    <text class="desc">请扫描店主发放的专属入口码，一人一码，停用后立即失效</text>

    <view class="scan" @click="scan">
      <text class="scan-icon">⌗</text>
      <text class="scan-text">扫码进入</text>
    </view>

    <view class="divider">或手动输入入口码</view>
    <u-input v-model="code" placeholder="请输入入口码" custom-style="margin: 24rpx 0" />
    <u-button type="primary" :loading="loading" @click="submit">进入管理端</u-button>

    <view v-if="mockMode" class="demo">
      <text class="demo-title">本地演示入口码</text>
      <view class="demo-actions">
        <u-button size="small" plain @click="resolveCode(DEMO_ENTRY_CODES.owner)">
          店主演示码
        </u-button>
        <u-button size="small" plain custom-style="margin-left: 20rpx" @click="resolveCode(DEMO_ENTRY_CODES.artist)">
          美甲师演示码
        </u-button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { appConfig, DEMO_ENTRY_CODES } from '@/config/env'
import { useAdminStore } from '@/stores/admin'
import { toastError } from '@/api/transport'

const admin = useAdminStore()
const code = ref('')
const loading = ref(false)
const mockMode = appConfig.mockMode

/** 统一 entry / scene 两种来源：小程序码的 scene 需要解码 */
function normalizeEntry(raw: string): string {
  if (!raw) {
    return ''
  }

  let value = raw
  try {
    value = decodeURIComponent(raw)
  } catch (error) {
    console.warn('[admin/auth] decode failed', error)
  }

  const matched = value.match(/(?:entry|scene)=([^&]+)/)
  if (matched) {
    try {
      return decodeURIComponent(matched[1]).trim()
    } catch (error) {
      return matched[1].trim()
    }
  }

  return value.trim()
}

async function resolveCode(entry: string): Promise<void> {
  const value = normalizeEntry(entry)
  if (!value) {
    uni.showToast({ title: '未识别到入口码', icon: 'none' })
    return
  }

  loading.value = true
  try {
    await admin.loginWithCode(value)
    uni.redirectTo({ url: '/pages-admin/index/index' })
  } catch (error) {
    toastError(error)
  } finally {
    loading.value = false
  }
}

function scan(): void {
  uni.scanCode({
    success: (result) => {
      const entry = normalizeEntry(result.path || result.result)
      void resolveCode(entry)
    },
    fail: () => {
      uni.showToast({ title: '扫码已取消', icon: 'none' })
    },
  })
}

function submit(): void {
  void resolveCode(code.value)
}

onLoad((options) => {
  const entry = options?.entry ?? options?.scene
  if (entry) {
    void resolveCode(entry)
  }
})
</script>

<style lang="scss" scoped>
.auth {
  min-height: 100vh;
  padding: 120rpx $app-space-lg;
  background-color: $app-color-admin-bg;
}

.title {
  display: block;
  font-size: 32rpx;
  color: $app-color-text;
  font-weight: 600;
}

.desc {
  display: block;
  margin-top: 12rpx;
  font-size: 20rpx;
  color: $app-color-text-muted;
  line-height: 1.6;
}

/* 原型里的虚线扫码区 */
.scan {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 240rpx;
  margin: 32rpx 0;
  background-color: $app-color-white;
  border: 3rpx dashed $app-color-secondary-dark;
  border-radius: $app-radius-lg;
}

.scan-icon {
  font-size: 64rpx;
  color: $app-color-secondary-dark;
}

.scan-text {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: $app-color-secondary-dark;
}

.divider {
  margin-bottom: 8rpx;
  font-size: 18rpx;
  color: $app-color-text-muted;
  text-align: center;
}

.demo {
  margin-top: 32rpx;
  padding: 20rpx;
  background-color: $app-color-white;
  border: 1rpx solid $app-color-border;
  border-radius: $app-radius-lg;
}

.demo-title {
  font-size: 20rpx;
  color: $app-color-text-muted;
}

.demo-actions {
  display: flex;
  margin-top: $app-space-sm;
}
</style>
