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
          <text class="spec">{{ specOf(item) }} × {{ item.quantity }}</text>
        </view>
        <price-tag :price="item.price * item.quantity" />
      </view>
    </view>

    <view v-if="needsCustomNote" class="block">
      <view class="block-title">定制备注（必填）</view>
      <textarea
        v-model="customNote"
        class="custom-note"
        maxlength="200"
        placeholder="所选尺码或甲型为「其他」，请补充甲床尺寸、期望甲型或参考图说明"
      />
      <text v-if="customNoteError" class="error">{{ customNoteError }}</text>
    </view>

    <shipping-bar :config="shipping.config" :paid-sets="paidSets" :goods-amount="goodsAmount" />

    <view class="tips">本店仅支持快递发货，运费按副数计算；售后请联系客服协商。</view>

    <view class="bottom-bar">
      <text class="total">应付 {{ formatPrice(total) }}</text>
      <u-button type="primary" :loading="submitting" @click="submit">提交订单</u-button>
    </view>

    <u-popup
      v-model="addressPickerVisible"
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
import {
  SHAPE_LABELS,
  SIZE_LABELS,
  type Address,
  type OrderItem,
} from '@/api/contract'
import PriceTag from '@/components/price-tag.vue'
import ShippingBar from '@/components/shipping-bar.vue'
import { formatPrice } from '@/utils/price'
import { calcShipping } from '@/utils/shipping'
import { getStorage, removeStorage, setStorage } from '@/utils/storage'
import { useCartStore } from '@/stores/cart'
import { useShippingStore } from '@/stores/shipping'

const cart = useCartStore()
const shipping = useShippingStore()

const items = ref<OrderItem[]>([])
const addresses = ref<Address[]>([])
const selectedAddressId = ref('')
const customNote = ref('')
const customNoteError = ref('')
const submitting = ref(false)
const addressPickerVisible = ref(false)

const selectedAddress = computed(
  () => addresses.value.find((item) => item.id === selectedAddressId.value) ?? addresses.value[0] ?? null,
)
const goodsAmount = computed(() =>
  items.value.reduce((sum, item) => sum + item.price * item.quantity, 0),
)
const paidSets = computed(() =>
  items.value.reduce((total, item) => (item.isAccessory ? total : total + item.quantity), 0),
)
const shippingFee = computed(() => calcShipping(shipping.config, paidSets.value))
const total = computed(() => goodsAmount.value + shippingFee.value)
const needsCustomNote = computed(() =>
  items.value.some((item) => item.size === 'OTHER' || item.shape === 'OTHER'),
)

function specOf(item: OrderItem): string {
  if (item.isAccessory || !item.size || !item.shape) {
    return '工具包'
  }
  return `${SIZE_LABELS[item.size]} / ${SHAPE_LABELS[item.shape]} · ${item.unit}`
}

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
  void shipping.load()
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
  if (needsCustomNote.value && !customNote.value.trim()) {
    customNoteError.value = '请填写定制备注，说明甲床尺寸或期望甲型'
    uni.showToast({ title: '请填写定制备注', icon: 'none' })
    return
  }
  customNoteError.value = ''

  submitting.value = true
  try {
    const order = await orderApi.create({
      items: items.value,
      addressId: selectedAddress.value.id,
      customNote: customNote.value.trim(),
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
  padding: 28rpx 28rpx 200rpx;
  background-color: $app-color-bg;
}

.block {
  margin-bottom: 20rpx;
  padding: 20rpx;
  background-color: $app-color-white;
  border: 1rpx solid $app-color-border;
  border-radius: $app-radius-lg;
}

.block-title {
  margin-bottom: 12rpx;
  font-size: 26rpx;
  color: $app-color-text;
  font-weight: 600;
}

.address-empty {
  font-size: 22rpx;
  color: $app-color-primary-dark;
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
  font-size: 24rpx;
  color: $app-color-text;
  font-weight: 600;
}

.detail {
  margin-top: 6rpx;
  font-size: 20rpx;
  color: $app-color-text-muted;
}

.switch {
  font-size: 20rpx;
  color: $app-color-primary-dark;
}

.item {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.cover {
  width: 120rpx;
  height: 120rpx;
  border-radius: 20rpx;
  background-color: $app-color-input-bg;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 16rpx;
}

.name {
  font-size: 24rpx;
  color: $app-color-text;
}

.spec {
  margin-top: 6rpx;
  font-size: 20rpx;
  color: $app-color-text-muted;
}

.custom-note {
  width: 100%;
  height: 160rpx;
  padding: 18rpx;
  font-size: 22rpx;
  color: $app-color-text;
  background-color: $app-color-input-bg;
  border: 1rpx solid $app-color-border;
  border-radius: 18rpx;
}

.error {
  display: block;
  margin-top: 8rpx;
  font-size: 18rpx;
  color: $app-color-danger;
}

.tips {
  margin-top: 16rpx;
  font-size: 18rpx;
  color: $app-color-text-muted;
  line-height: 1.6;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  background-color: $app-color-white;
  border-top: 1rpx solid $app-color-border;
}

.total {
  font-size: 26rpx;
  color: $app-color-primary-dark;
  font-weight: 700;
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
