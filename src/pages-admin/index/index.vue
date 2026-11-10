<template>
  <view class="workbench admin-theme">
    <view class="role-banner">当前身份：{{ roleText }}（{{ admin.session?.name || '—' }}）</view>

    <view v-if="canReadOrders" class="stats">
      <view class="stat">
        <text class="stat-num">{{ stats.onSaleProducts }}</text>
        <text class="stat-label">在售商品</text>
      </view>
      <view class="stat">
        <text class="stat-num">{{ stats.pendingShip }}</text>
        <text class="stat-label">待发货</text>
      </view>
      <view class="stat">
        <text class="stat-num">{{ stats.pendingAfterSale }}</text>
        <text class="stat-label">待处理售后</text>
      </view>
    </view>

    <view v-if="entries.length > 0" class="card">
      <view v-for="entry in entries" :key="entry.title" class="cell" @click="go(entry.url)">
        <text class="cell-label">{{ entry.title }}</text>
        <text class="cell-value">{{ entry.label }} ›</text>
      </view>
    </view>

    <view v-else class="empty">当前账号暂无可访问的管理模块</view>

    <u-button custom-style="margin-top: 48rpx" @click="logout">退出管理端</u-button>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { adminApi, type AdminStats } from '@/api/admin'
import { toastError } from '@/api/transport'
import { useAdminStore } from '@/stores/admin'
import { useAdminGuard } from '@/utils/admin-guard'
import { ROLE_LABELS, type Permission } from '@/utils/permissions'

interface ModuleEntry {
  title: string
  label: string
  url: string
  permission: Permission
}

const MODULES: ModuleEntry[] = [
  { title: '商品管理', label: '商品编辑 / 上下架', url: '/pages-admin/product/list', permission: 'product:read' },
  { title: '制作档案', label: '资料列表', url: '/pages-admin/craft/list', permission: 'craft:read' },
  { title: '订单管理', label: '筛选、发货与定制备注', url: '/pages-admin/order/list', permission: 'order:read' },
  { title: '评价管理', label: '查看 / 隐藏 / 删除', url: '/pages-admin/review/rule?tab=review', permission: 'review:manage' },
  { title: '运费规则配置', label: '满副包邮 / 固定邮费', url: '/pages-admin/review/rule?tab=shipping', permission: 'shipping:manage' },
  { title: '账号管理', label: '发码 / 停用 / 重新生成码', url: '/pages-admin/staff/list', permission: 'staff:manage' },
]

const admin = useAdminStore()
const stats = ref<AdminStats>({ onSaleProducts: 0, pendingShip: 0, pendingAfterSale: 0 })

const entries = computed(() => MODULES.filter((item) => admin.can(item.permission)))
const roleText = computed(() => (admin.role ? ROLE_LABELS[admin.role] : ''))
const canReadOrders = computed(() => admin.can('order:read'))

async function loadStats(): Promise<void> {
  if (!canReadOrders.value) {
    return
  }
  try {
    stats.value = await adminApi.getStats()
  } catch (error) {
    toastError(error)
  }
}

onLoad(() => {
  useAdminGuard()
})

onShow(() => {
  void loadStats()
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
  padding: 28rpx;
  background-color: $app-color-admin-bg;
}

.role-banner {
  margin-bottom: 16rpx;
  padding: 14rpx 20rpx;
  font-size: 20rpx;
  color: $app-color-secondary-dark;
  background-color: $app-color-secondary-light;
  border-radius: 20rpx;
}

.stats {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.stat {
  flex: 1;
  padding: 20rpx 16rpx;
  text-align: center;
  background-color: $app-color-white;
  border: 1rpx solid $app-color-border;
  border-radius: 24rpx;
}

.stat-num {
  display: block;
  font-size: 32rpx;
  color: $app-color-text;
  font-weight: 700;
}

.stat-label {
  display: block;
  margin-top: 4rpx;
  font-size: 18rpx;
  color: $app-color-text-muted;
}

.card {
  margin-bottom: 20rpx;
  padding: 0 20rpx;
  background-color: $app-color-white;
  border: 1rpx solid $app-color-border;
  border-radius: $app-radius-lg;
}

.cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid $app-color-border-soft;
}

.cell:last-child {
  border-bottom: none;
}

.cell-label {
  font-size: 24rpx;
  color: $app-color-text;
}

.cell-value {
  font-size: 20rpx;
  color: $app-color-text-muted;
}

.empty {
  padding: $app-space-lg 0;
  text-align: center;
  font-size: 22rpx;
  color: $app-color-text-muted;
}
</style>
