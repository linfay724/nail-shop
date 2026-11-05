<template>
  <view class="checkout">
    <view class="block">
      <view class="block-title">收货地址</view>
      <view v-if="addresses.length === 0" class="address-empty" @click="goAddress">
        <text>还没有收货地址，去添加 ›</text>
      </view>
      <view v-else class="address" @click="chooseAddress">
        <view class="address-main">
          <text class="receiver">{{ selectedAddress?.receiver }} {{ selectedAddress?.phone }}</text>
          <text class="detail">{{ selectedAddress?.region.join('') }}{{ selectedAddress?.detail }}</text>
        </view>
        <text class="switch">切换</text>
      </view>
    </view>

    <view class="block">
      <view class="block-title">商品清单</view>
      <view v-for="item in items" :key="item.skuId" class="item">
        <image class="cover" :src="item.cover" mode="aspectFill" />
        <view class="item-info">
          <text class="name">{{ item.name }}</text>
          <text class="spec">{{ item.size }} · {{ item.pieceCount }} 片 × {{ item.quantity }}</text>
        </view>
        <price-tag :price="item.price * item.quantity" />
      </view>
    </view>

    <view class="block">
      <view class="block-title">订单备注</view>
      <u-textarea v-model="remark" :maxlength="100" placeholder="选填，如指定发货时间" count />
    </view>

    <view class="bottom-bar">
      <text class="total">应付 {{ formatPrice(total) }}</text>
      <u-button type="primary" :loading="submitting" @click="submit">提交订单</u-button>
    </view>

    <u-popup
      :show="addressPickerVisible"
      mode="bottom"
      :border-radius="24"
      @close="addressPickerVisible = false"
    >
      <view class="picker">
        <view v-for="item in addresses" :key="item.id" class="picker-item" @click="selectAddress(item.id)">
          <text class="picker-name">{{ item.receiver }} {{ item.phone }}</text>
          <text class="picker-detail">{{ item.region.join('') }}{{ item.detail }}</text>
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { addressApi } from '@/api/address'
import { orderApi } from '@/api/order'
import { payOrder } from '@/api/payment'
import { toastError } from '@/api/transport'
import type { Address, OrderItem } from '@/api/contract'
import PriceTag from '@/components/price-tag.vue'
import { formatPrice } from '@/utils/price'
import { getStorage, removeStorage, setStorage } from '@/utils/storage'
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()

const items = ref<OrderItem[]>([])
const addresses = ref<Address[]>([])
const selectedAddressId = ref('')
const remark = ref('')
const submitting = ref(false)
const addressPickerVisible = ref(false)

const selectedAddress = computed(
  () => addresses.value.find((item) => item.id === selectedAddressId.value) ?? addresses.value[0] ?? null,
)
const total = computed(() => items.value.reduce((sum, item) => sum + item.price * item.quantity, 0))

async function loadAddresses(): Promise<void> {
  try {
    addresses.value = await addressApi.list()
    const preferred = addresses.value.find((item) => item.isDefault) ?? addresses.value[0]
    if (!selectedAddressId.value && preferred) {
      selectedAddressId.value = preferred.id
    }
  } catch (error) {
    toastError(error)
  }
}

onShow(() => {
  const stored = getStorage<OrderItem[]>('checkout_items', [])
  items.value = Array.isArray(stored) ? stored : []
  void loadAddresses()
})

function goAddress(): void {
  uni.navigateTo({ url: '/pages-user/address/edit' })
}

function chooseAddress(): void {
  if (addresses.value.length === 0) {
    goAddress()
    return
  }
  addressPickerVisible.value = true
}

function selectAddress(id: string): void {
  selectedAddressId.value = id
  addressPickerVisible.value = false
}

async function submit(): Promise<void> {
  if (!selectedAddress.value) {
    uni.showToast({ title: '请先添加收货地址', icon: 'none' })
    goAddress()
    return
  }
  if (items.value.length === 0) {
    uni.showToast({ title: '没有待结算商品', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    const order = await orderApi.create({
      items: items.value,
      addressId: selectedAddress.value.id,
      remark: remark.value,
    })

    items.value.forEach((item) => cart.remove(item.skuId))
    removeStorage('checkout_items')

    const result = await payOrder(order.id)
    if (!result.paid) {
      uni.showToast({ title: '已取消支付，可在订单中继续支付', icon: 'none' })
    }
    setStorage('last_order_id', order.id)
    uni.redirectTo({ url: `/pages-user/order/detail?id=${order.id}` })
  } catch (error) {
    toastError(error)
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.checkout {
  min-height: 100vh;
  padding: $app-space-base $app-space-base 200rpx;
  background-color: $app-color-bg;
}

.block {
  margin-bottom: $app-space-base;
  padding: $app-space-base;
  background-color: #fff;
  border-radius: $app-radius-base;
}

.block-title {
  margin-bottom: $app-space-sm;
  font-size: $app-font-base;
  color: $app-color-text;
  font-weight: 600;
}

.address-empty {
  font-size: $app-font-sm;
  color: $app-color-primary;
}

.address {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.address-main {
  display: flex;
  flex-direction: column;
}

.receiver {
  font-size: $app-font-base;
  color: $app-color-text;
}

.detail {
  margin-top: $app-space-xs;
  font-size: $app-font-sm;
  color: $app-color-text-secondary;
}

.switch {
  font-size: $app-font-sm;
  color: $app-color-primary;
}

.item {
  display: flex;
  align-items: center;
  margin-bottom: $app-space-sm;
}

.cover {
  width: 120rpx;
  height: 120rpx;
  border-radius: $app-radius-sm;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: $app-space-sm;
}

.name {
  font-size: $app-font-sm;
  color: $app-color-text;
}

.spec {
  margin-top: $app-space-xs;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $app-space-sm $app-space-base;
  background-color: #fff;
}

.total {
  font-size: $app-font-base;
  color: $app-color-primary;
  font-weight: 600;
}

.picker {
  padding: $app-space-base;
}

.picker-item {
  padding: $app-space-sm 0;
  border-bottom: 1rpx solid $app-color-border;
}

.picker-name {
  display: block;
  font-size: $app-font-base;
  color: $app-color-text;
}

.picker-detail {
  display: block;
  margin-top: $app-space-xs;
  font-size: $app-font-sm;
  color: $app-color-text-secondary;
}
</style>
