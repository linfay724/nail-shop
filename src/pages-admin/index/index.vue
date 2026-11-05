<template>
  <view class="workbench">
    <view class="header">
      <text class="title">管理工作台</text>
      <text class="sub">商品、档案与订单处理</text>
    </view>

    <u-cell-group>
      <u-cell-item title="商品管理" :arrow="true" @click="go('/pages-admin/product/list')" />
      <u-cell-item title="订单管理" :arrow="true" @click="go('/pages-admin/order/list')" />
    </u-cell-group>

    <u-button custom-style="margin-top: 48rpx" @click="logout">退出管理端</u-button>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { useAdminStore } from '@/stores/admin'
import { useAdminGuard } from '@/utils/admin-guard'

const admin = useAdminStore()

onLoad(() => {
  useAdminGuard()
})

function go(url: string): void {
  uni.navigateTo({ url })
}

function logout(): void {
  admin.logout()
  uni.reLaunch({ url: '/pages/index/index' })
}
</script>

<style lang="scss" scoped>
.workbench {
  min-height: 100vh;
  padding: $app-space-base;
  background-color: $app-color-bg;
}

.header {
  padding: $app-space-base 0 $app-space-lg;
}

.title {
  font-size: $app-font-xl;
  color: $app-color-text;
  font-weight: 600;
}

.sub {
  display: block;
  margin-top: $app-space-xs;
  font-size: $app-font-sm;
  color: $app-color-text-secondary;
}
</style>
