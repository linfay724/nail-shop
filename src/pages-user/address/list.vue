<template>
  <view class="address-list">
    <view v-if="addresses.length === 0" class="empty">
      <u-empty mode="address" text="还没有收货地址" />
    </view>

    <view v-for="item in addresses" :key="item.id" class="item">
      <view class="row">
        <text class="receiver">{{ item.receiver }}</text>
        <text class="phone">{{ item.phone }}</text>
        <text v-if="item.isDefault" class="tag">默认</text>
      </view>
      <text class="detail">{{ item.region.join('') }}{{ item.detail }}</text>
      <view class="actions">
        <text class="action" @click="setDefault(item)">设为默认</text>
        <text class="action" @click="edit(item)">编辑</text>
        <text class="action danger" @click="remove(item)">删除</text>
      </view>
    </view>

    <u-button type="primary" custom-style="margin-top: 32rpx" @click="add">新增地址</u-button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { addressApi } from '@/api/address'
import { toastError } from '@/api/transport'
import type { Address } from '@/api/contract'

const addresses = ref<Address[]>([])

async function load(): Promise<void> {
  try {
    addresses.value = await addressApi.list()
  } catch (error) {
    toastError(error)
  }
}

async function setDefault(item: Address): Promise<void> {
  try {
    addresses.value = await addressApi.save({ ...item, isDefault: true })
  } catch (error) {
    toastError(error)
  }
}

function add(): void {
  uni.navigateTo({ url: '/pages-user/address/edit' })
}

function edit(item: Address): void {
  uni.navigateTo({ url: `/pages-user/address/edit?id=${item.id}` })
}

function remove(item: Address): void {
  uni.showModal({
    title: '删除地址',
    content: '确定删除该收货地址吗？',
    success: async (result) => {
      if (!result.confirm) {
        return
      }
      try {
        addresses.value = await addressApi.remove(item.id)
      } catch (error) {
        toastError(error)
      }
    },
  })
}

onShow(() => {
  void load()
})
</script>

<style lang="scss" scoped>
.address-list {
  min-height: 100vh;
  padding: $app-space-base;
  background-color: $app-color-bg;
}

.empty {
  padding-top: 160rpx;
}

.item {
  margin-bottom: $app-space-sm;
  padding: $app-space-sm;
  background-color: #fff;
  border-radius: $app-radius-base;
}

.row {
  display: flex;
  align-items: center;
}

.receiver {
  font-size: $app-font-base;
  color: $app-color-text;
  font-weight: 600;
}

.phone {
  margin-left: $app-space-sm;
  font-size: $app-font-sm;
  color: $app-color-text-secondary;
}

.tag {
  margin-left: $app-space-xs;
  padding: 0 12rpx;
  font-size: $app-font-xs;
  color: $app-color-primary;
  border: 1rpx solid $app-color-primary;
  border-radius: $app-radius-sm;
}

.detail {
  display: block;
  margin-top: $app-space-xs;
  font-size: $app-font-sm;
  color: $app-color-text;
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: $app-space-sm;
}

.action {
  margin-left: $app-space-base;
  font-size: $app-font-sm;
  color: $app-color-text-secondary;
}

.danger {
  color: #dd524d;
}
</style>
