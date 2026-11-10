<template>
  <view class="staff admin-theme">
    <view class="notice">账号由服务端开通，管理端仅可查看、停用/启用与重新生成入口码。</view>

    <view v-if="accounts.length === 0" class="hint">暂无账号</view>

    <view v-for="item in accounts" :key="item.accountId" class="item">
      <view class="head">
        <text class="name">{{ item.name }}</text>
        <text class="role">{{ ROLE_LABELS[item.role] }}</text>
        <text class="status" :class="{ disabled: item.status === 'disabled' }">
          {{ item.status === 'active' ? '启用中' : '已停用' }}
        </text>
      </view>

      <view class="code-row">
        <text class="code-label">入口码</text>
        <text class="code">{{ item.qrCodeId }}</text>
        <text class="copy" @click="copy(item.qrCodeId)">复制</text>
      </view>

      <view class="actions">
        <text class="action" @click="regenerate(item)">重新生成码</text>
        <text
          v-if="item.role !== 'owner'"
          class="action"
          :class="{ danger: item.status === 'active' }"
          @click="toggleStatus(item)"
        >
          {{ item.status === 'active' ? '停用' : '启用' }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { staffApi } from '@/api/staff'
import { toastError } from '@/api/transport'
import type { StaffAccountView } from '@/api/contract'
import { useAdminGuard } from '@/utils/admin-guard'
import { ROLE_LABELS } from '@/utils/permissions'

const accounts = ref<StaffAccountView[]>([])
let guarded = false

async function load(): Promise<void> {
  if (!guarded) {
    return
  }
  try {
    accounts.value = await staffApi.list()
  } catch (error) {
    toastError(error)
  }
}

function copy(code: string): void {
  uni.setClipboardData({ data: code })
}

function toggleStatus(item: StaffAccountView): void {
  const next = item.status === 'active' ? 'disabled' : 'active'
  uni.showModal({
    title: next === 'disabled' ? '停用账号' : '启用账号',
    content:
      next === 'disabled'
        ? '停用后该账号的入口码立即失效，已登录的会话也会被拒绝。'
        : '启用后会生成新的入口码，旧码保持失效。',
    success: async (result) => {
      if (!result.confirm) {
        return
      }
      try {
        await staffApi.setStatus(item.accountId, next)
        await load()
      } catch (error) {
        toastError(error)
      }
    },
  })
}

function regenerate(item: StaffAccountView): void {
  uni.showModal({
    title: '重新生成入口码',
    content: '旧入口码将立即失效，需要把新码重新发给对方。',
    success: async (result) => {
      if (!result.confirm) {
        return
      }
      try {
        await staffApi.regenerate(item.accountId)
        await load()
      } catch (error) {
        toastError(error)
      }
    },
  })
}

onLoad(() => {
  guarded = useAdminGuard('staff:manage')
  void load()
})
</script>

<style lang="scss" scoped>
.staff {
  min-height: 100vh;
  padding: 28rpx;
  background-color: $app-color-admin-bg;
}

.notice {
  margin-bottom: 20rpx;
  padding: 14rpx 18rpx;
  font-size: 20rpx;
  line-height: 1.6;
  color: $app-color-secondary-dark;
  background-color: $app-color-secondary-light;
  border-radius: 20rpx;
}

.hint {
  padding: $app-space-lg 0;
  text-align: center;
  font-size: 22rpx;
  color: $app-color-text-muted;
}

.item {
  margin-bottom: 20rpx;
  padding: 20rpx;
  background-color: $app-color-white;
  border: 1rpx solid $app-color-border;
  border-radius: $app-radius-lg;
  box-shadow: $app-shadow;
}

.head {
  display: flex;
  align-items: center;
}

.name {
  font-size: 26rpx;
  font-weight: 600;
  color: $app-color-text;
}

.role {
  margin-left: 10rpx;
  padding: 2rpx 14rpx;
  font-size: 18rpx;
  color: $app-color-secondary-dark;
  background-color: $app-color-secondary-light;
  border-radius: $app-radius-pill;
}

.status {
  margin-left: auto;
  padding: 2rpx 14rpx;
  font-size: 18rpx;
  color: $app-color-success;
  background-color: $app-color-success-bg;
  border-radius: $app-radius-pill;
}

.disabled {
  color: $app-color-text-muted;
  background-color: #f4f1f0;
}

.code-row {
  display: flex;
  align-items: center;
  margin-top: 12rpx;
}

.code-label {
  font-size: 18rpx;
  color: $app-color-text-muted;
}

.code {
  flex: 1;
  margin-left: 10rpx;
  font-size: 22rpx;
  color: $app-color-text;
}

.copy {
  padding: 4rpx 14rpx;
  font-size: 18rpx;
  color: $app-color-secondary-dark;
  border: 1rpx solid $app-color-secondary-light;
  border-radius: $app-radius-pill;
}

.actions {
  display: flex;
  margin-top: 16rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid $app-color-border-soft;
}

.action {
  margin-right: 16rpx;
  font-size: 18rpx;
  color: $app-color-secondary-dark;
}

.danger {
  color: $app-color-danger;
}
</style>
