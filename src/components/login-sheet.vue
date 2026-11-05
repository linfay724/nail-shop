<template>
  <u-popup :show="loginSheetVisible" mode="bottom" :border-radius="24" @close="handleClose">
    <view class="login-sheet">
      <image class="avatar" src="/static/logo.png" mode="aspectFill" />
      <text class="title">登录后可继续</text>
      <text class="desc">登录用于保存订单、收藏与收货地址，浏览商品无需登录</text>
      <u-button type="primary" :loading="loading" @click="handleLogin">微信一键登录</u-button>
      <!-- 真实模式替换为 <button open-type="getPhoneNumber"> 获取手机号 -->
      <u-button plain custom-style="margin-top: 20rpx" @click="handleClose">暂不登录</u-button>
    </view>
  </u-popup>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { clearPendingAction, loginSheetVisible, runPendingAction } from '@/utils/auth-guard'
import { useSessionStore } from '@/stores/session'
import { toastError } from '@/api/transport'

const session = useSessionStore()
const loading = ref(false)

async function handleLogin(): Promise<void> {
  loading.value = true
  try {
    await session.login()
    loginSheetVisible.value = false
    uni.showToast({ title: '登录成功', icon: 'none' })
    runPendingAction()
  } catch (error) {
    toastError(error)
  } finally {
    loading.value = false
  }
}

function handleClose(): void {
  loginSheetVisible.value = false
  clearPendingAction()
}
</script>

<style lang="scss" scoped>
.login-sheet {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $app-space-lg $app-space-base $app-space-lg;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin-bottom: $app-space-sm;
}

.title {
  font-size: $app-font-lg;
  color: $app-color-text;
  font-weight: 600;
}

.desc {
  font-size: $app-font-sm;
  color: $app-color-text-secondary;
  margin: $app-space-xs 0 $app-space-base;
  text-align: center;
}
</style>
