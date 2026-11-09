<template>
  <view class="profile">
    <view class="header" @click="handleLoginEntry">
      <image class="avatar" :src="session.session?.avatar || '/static/logo.png'" mode="aspectFill" />
      <view class="info">
        <text class="nickname">{{ session.isLoggedIn ? session.session?.nickname : '未登录' }}</text>
        <text class="tips">{{ session.isLoggedIn ? '欢迎回来' : '点击登录，同步订单与收藏' }}</text>
      </view>
    </view>

    <u-cell-group>
      <u-cell-item title="我的收藏" :arrow="true" @click="goFavorite" />
      <u-cell-item title="收货地址" :arrow="true" @click="goAddress" />
      <u-cell-item title="尺码测量指引" :arrow="true" @click="goSizeGuide" />
    </u-cell-group>

    <button class="contact" open-type="contact">联系客服</button>

    <text class="version" @longpress="handleVersionLongPress">v1.0.0</text>

    <login-sheet />
  </view>
</template>

<script setup lang="ts">
import { useSessionStore } from '@/stores/session'
import { useAdminStore } from '@/stores/admin'
import { requireAuth } from '@/utils/auth-guard'
import { ADMIN_AUTH_PAGE } from '@/utils/admin-guard'
import LoginSheet from '@/components/login-sheet.vue'

const session = useSessionStore()
const admin = useAdminStore()

function handleLoginEntry(): void {
  if (!session.isLoggedIn) {
    requireAuth()
  }
}

function goFavorite(): void {
  requireAuth(() => uni.navigateTo({ url: '/pages-user/favorite/index' }))
}

function goAddress(): void {
  requireAuth(() => uni.navigateTo({ url: '/pages-user/address/list' }))
}

function goSizeGuide(): void {
  uni.navigateTo({ url: '/pages-user/guide/size' })
}

function handleVersionLongPress(): void {
  if (admin.isLoggedIn) {
    uni.navigateTo({ url: '/pages-admin/index/index' })
    return
  }

  uni.navigateTo({ url: ADMIN_AUTH_PAGE })
}
</script>

<style lang="scss" scoped>
.profile {
  min-height: 100vh;
  padding: $app-space-base;
  background-color: $app-color-bg;
}

.header {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: $app-space-lg $app-space-base;
  background: linear-gradient(120deg, #ffd9e8 0%, #fff3f8 50%, #dcefff 100%);
  border-radius: $app-radius-lg;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border: 6rpx solid #ffffff;
  border-radius: 50%;
  background-color: #fff;
  box-shadow: $app-shadow;
}

.info {
  display: flex;
  flex-direction: column;
  margin-left: $app-space-base;
}

.nickname {
  font-size: $app-font-lg;
  color: $app-color-text;
  font-weight: 600;
}

.tips {
  margin-top: $app-space-xs;
  font-size: $app-font-sm;
  color: $app-color-text-secondary;
}

.contact {
  margin-top: $app-space-base;
  font-size: $app-font-base;
  line-height: 88rpx;
  border-radius: $app-radius-base;
  background-color: #fff;
  color: $app-color-text;
}

.version {
  display: block;
  margin-top: $app-space-lg;
  text-align: center;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}
</style>
