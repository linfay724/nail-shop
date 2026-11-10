<template>
  <view class="profile">
    <!-- 头像卡 -->
    <view class="card row" @click="handleLoginEntry">
      <image
        v-if="session.isLoggedIn && session.session?.avatar"
        class="avatar"
        :src="session.session.avatar"
        mode="aspectFill"
      />
      <view v-else class="avatar">
        <text>{{ session.isLoggedIn ? 'U' : '未' }}</text>
      </view>
      <view>
        <view class="name">{{ session.isLoggedIn ? session.session?.nickname : '微信用户' }}</view>
        <view class="muted">{{ session.isLoggedIn ? '欢迎回来' : '点击授权登录' }}</view>
      </view>
    </view>

    <!-- 订单 / 收藏 / 地址 -->
    <view class="card">
      <view class="cell" @click="goOrders">
        <text>我的订单</text>
        <text class="r">全部 ›</text>
      </view>
      <view class="cell" @click="goFavorite">
        <text>我的收藏</text>
        <text class="r">{{ favorite.ids.length }} 款 ›</text>
      </view>
      <view class="cell" @click="goAddress">
        <text>收货地址</text>
        <text class="r">›</text>
      </view>
    </view>

    <!-- 指引 / 协议 / 客服 -->
    <view class="card">
      <view class="cell" @click="goSizeGuide">
        <text>尺码测量指引</text>
        <text class="r">静态图文 ›</text>
      </view>
      <view class="cell" @click="goTerms">
        <text>用户协议</text>
        <text class="r">›</text>
      </view>
      <view class="cell" @click="goPrivacy">
        <text>隐私政策</text>
        <text class="r">›</text>
      </view>
      <button class="cell contact" open-type="contact">
        <text>联系客服</text>
        <text class="r">›</text>
      </button>
    </view>

    <!-- 管理端入口提示 -->
    <view class="card admin-card">
      <text class="muted">管理端入口：扫码进入（不在此暴露）</text>
    </view>

    <login-sheet />
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { useSessionStore } from '@/stores/session'
import { useFavoriteStore } from '@/stores/favorite'
import { requireAuth } from '@/utils/auth-guard'
import LoginSheet from '@/components/login-sheet.vue'

const session = useSessionStore()
const favorite = useFavoriteStore()

onShow(() => {
  if (session.isLoggedIn) {
    void favorite.loadIds()
  }
})

function handleLoginEntry(): void {
  if (!session.isLoggedIn) {
    requireAuth()
  }
}

function goOrders(): void {
  requireAuth(() => {
    uni.navigateTo({ url: '/pages/order/list' })
  })
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

function goTerms(): void {
  uni.navigateTo({ url: '/pages-user/legal/terms' })
}

function goPrivacy(): void {
  uni.navigateTo({ url: '/pages-user/legal/privacy' })
}
</script>

<style lang="scss" scoped>
.profile {
  min-height: 100vh;
  padding: 28rpx;
  background-color: $app-color-bg;
}

.card {
  margin-bottom: 20rpx;
  padding: 28rpx;
  background-color: $app-color-white;
  border: 1rpx solid $app-color-border;
  border-radius: $app-radius-lg;
  box-shadow: $app-shadow;
}

.row {
  display: flex;
  align-items: center;
}

/* 原型：34px 圆形头像，标签底色 + 莓果字 */
.avatar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 68rpx;
  height: 68rpx;
  margin-right: 20rpx;
  overflow: hidden;
  font-size: 22rpx;
  color: $app-color-primary-dark;
  background-color: $app-color-primary-light;
  border-radius: 50%;
}

.name {
  font-size: 26rpx;
  font-weight: 600;
  color: $app-color-text;
}

.muted {
  margin-top: 4rpx;
  font-size: 22rpx;
  color: $app-color-text-muted;
}

.cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 0;
  font-size: 24rpx;
  color: $app-color-text;
  border-bottom: 1rpx solid $app-color-border-soft;
}

.cell:last-child {
  border-bottom: none;
}

.r {
  font-size: 22rpx;
  color: $app-color-text-muted;
}

/* 联系客服保持 cell 形态（open-type 按钮需要重置默认样式） */
.contact {
  width: 100%;
  margin: 0;
  font-weight: 400;
  line-height: inherit;
  text-align: left;
  background-color: transparent;
  border-radius: 0;
}

.contact::after {
  border: none;
}

/* 管理端提示：虚线卡 */
.admin-card {
  padding: 24rpx;
  text-align: center;
  border: 1rpx dashed $app-color-border;
  box-shadow: none;
}
</style>
