<template>
  <view class="rule admin-theme">
    <u-tabs :list="tabs" :current="tabIndex" @change="onTabChange" />

    <view v-show="tab === 'review'" class="section">
      <view class="filters">
        <text class="chip" :class="{ active: productId === '' }" @click="selectProduct('')">全部商品</text>
        <text
          v-for="product in products"
          :key="product.id"
          class="chip"
          :class="{ active: productId === product.id }"
          @click="selectProduct(product.id)"
        >
          {{ product.name }}
        </text>
      </view>

      <view v-if="reviews.length === 0" class="hint">暂无评价</view>

      <view v-for="item in reviews" :key="item.id" class="item">
        <view class="head">
          <text class="nickname">{{ item.nickname }}</text>
          <text class="rating">{{ '★'.repeat(item.rating) }}</text>
          <text class="visible" :class="{ hidden: !item.visible }">
            {{ item.visible ? '展示中' : '已隐藏' }}
          </text>
        </view>
        <text class="content">{{ item.content || '（无文字内容）' }}</text>
        <text class="meta">订单号 {{ item.orderId }} · {{ item.media.length }} 个媒体</text>
        <view class="actions">
          <text class="action" @click="toggleVisible(item)">{{ item.visible ? '隐藏' : '恢复展示' }}</text>
          <text class="action danger" @click="remove(item)">删除</text>
        </view>
      </view>
    </view>

    <view v-show="tab === 'shipping'" class="section">
      <view class="block">
        <text class="label">包邮所需副数</text>
        <u-input v-model="thresholdText" type="number" placeholder="默认 2 副" />
        <text class="hint-text">只统计穿戴甲的副数，工具包等配件不计入</text>

        <text class="label second">固定邮费（元）</text>
        <u-input v-model="flatFeeYuan" type="digit" placeholder="未满包邮副数时收取" />
      </view>

      <view class="preview">
        <text class="preview-line">1 副：{{ preview(1) }}</text>
        <text class="preview-line">{{ thresholdText || 2 }} 副及以上：免运费</text>
      </view>

      <u-button type="primary" :loading="saving" @click="saveShipping">保存配置</u-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { adminApi } from '@/api/admin'
import { shippingApi } from '@/api/shipping'
import { toastError } from '@/api/transport'
import type { AdminProduct, Review } from '@/api/contract'
import { useAdminGuard } from '@/utils/admin-guard'
import { useShippingStore } from '@/stores/shipping'

type RuleTab = 'review' | 'shipping'

const tabs = [{ name: '评价管理' }, { name: '运费规则' }]
const tab = ref<RuleTab>('review')
const tabIndex = ref(0)

const reviews = ref<Review[]>([])
const products = ref<AdminProduct[]>([])
const productId = ref('')

const shipping = useShippingStore()
const thresholdText = ref('2')
const flatFeeYuan = ref('8')
const saving = ref(false)

let guarded = false

async function loadReviews(): Promise<void> {
  if (!guarded) {
    return
  }
  try {
    reviews.value = await adminApi.listReviews(productId.value)
  } catch (error) {
    toastError(error)
  }
}

async function loadProducts(): Promise<void> {
  try {
    const result = await adminApi.listProducts('', 1, 50)
    products.value = result.list
  } catch (error) {
    toastError(error)
  }
}

async function loadShipping(): Promise<void> {
  try {
    const config = await shippingApi.getConfig()
    thresholdText.value = String(config.freeShippingThreshold)
    flatFeeYuan.value = (config.flatFee / 100).toFixed(2)
  } catch (error) {
    toastError(error)
  }
}

function switchTab(next: RuleTab): void {
  tab.value = next
  tabIndex.value = next === 'review' ? 0 : 1
}

function onTabChange(index: number): void {
  switchTab(index === 1 ? 'shipping' : 'review')
}

function selectProduct(id: string): void {
  productId.value = id
  void loadReviews()
}

async function toggleVisible(item: Review): Promise<void> {
  try {
    await adminApi.setReviewVisible(item.id, !item.visible)
    item.visible = !item.visible
  } catch (error) {
    toastError(error)
  }
}

function remove(item: Review): void {
  uni.showModal({
    title: '删除评价',
    content: '删除后不可恢复，确定继续？',
    success: async (result) => {
      if (!result.confirm) {
        return
      }
      try {
        await adminApi.removeReview(item.id)
        reviews.value = reviews.value.filter((review) => review.id !== item.id)
      } catch (error) {
        toastError(error)
      }
    },
  })
}

function toCents(yuan: string): number {
  const value = Number(yuan)
  return Number.isFinite(value) ? Math.round(value * 100) : NaN
}

function preview(sets: number): string {
  const threshold = Number(thresholdText.value)
  if (Number.isFinite(threshold) && sets >= threshold) {
    return '免运费'
  }
  const fee = toCents(flatFeeYuan.value)
  return Number.isFinite(fee) ? `¥${(fee / 100).toFixed(2)}` : '—'
}

async function saveShipping(): Promise<void> {
  if (!guarded) {
    return
  }

  const threshold = Number(thresholdText.value)
  const flatFee = toCents(flatFeeYuan.value)
  if (!Number.isInteger(threshold) || threshold < 1) {
    uni.showToast({ title: '包邮副数必须为大于 0 的整数', icon: 'none' })
    return
  }
  if (!Number.isFinite(flatFee) || flatFee < 0) {
    uni.showToast({ title: '固定邮费不能为负数', icon: 'none' })
    return
  }

  saving.value = true
  try {
    const config = await shippingApi.saveConfig({ freeShippingThreshold: threshold, flatFee })
    shipping.patch(config)
    uni.showToast({ title: '已保存', icon: 'none' })
  } catch (error) {
    toastError(error)
  } finally {
    saving.value = false
  }
}

onLoad(async (options) => {
  guarded = useAdminGuard('review:manage')
  if (!guarded) {
    return
  }

  switchTab(options?.tab === 'shipping' ? 'shipping' : 'review')
  await loadProducts()
  void loadReviews()
  void loadShipping()
})
</script>

<style lang="scss" scoped>
.rule {
  min-height: 100vh;
  padding-bottom: $app-space-lg;
  background-color: $app-color-admin-bg;
}

.section {
  padding: $app-space-base;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: $app-space-base;
}

.chip {
  margin: 0 12rpx 12rpx 0;
  padding: 8rpx 20rpx;
  font-size: 20rpx;
  color: $app-color-text-secondary;
  background-color: $app-color-white;
  border: 1rpx solid $app-color-border;
  border-radius: $app-radius-pill;
}

.active {
  color: $app-color-white;
  background-color: $app-color-secondary-dark;
  border-color: $app-color-secondary-dark;
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

.nickname {
  font-size: $app-font-sm;
  color: $app-color-text;
}

.rating {
  margin-left: 10rpx;
  font-size: 22rpx;
  color: #d6a34f;
}

.visible {
  margin-left: auto;
  padding: 2rpx 14rpx;
  font-size: 18rpx;
  color: $app-color-secondary-dark;
  background-color: $app-color-secondary-light;
  border-radius: $app-radius-pill;
}

.hidden {
  color: $app-color-text-muted;
  background-color: #f4f1f0;
}

.content {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: $app-color-text;
  line-height: 1.6;
}

.meta {
  display: block;
  margin-top: 6rpx;
  font-size: 18rpx;
  color: $app-color-text-muted;
}

.actions {
  display: flex;
  margin-top: 14rpx;
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

.block {
  margin-bottom: 20rpx;
  padding: 20rpx;
  background-color: $app-color-white;
  border: 1rpx solid $app-color-border;
  border-radius: $app-radius-lg;
}

.label {
  display: block;
  margin-bottom: 8rpx;
  font-size: 22rpx;
  color: $app-color-text-secondary;
  font-weight: 600;
}

.second {
  margin-top: $app-space-base;
}

.hint-text {
  display: block;
  margin-top: 8rpx;
  font-size: 18rpx;
  color: $app-color-text-muted;
}

.preview {
  margin-bottom: 24rpx;
  padding: 20rpx;
  background-color: $app-color-secondary-light;
  border-radius: 20rpx;
}

.preview-line {
  display: block;
  font-size: 22rpx;
  color: $app-color-text;
  line-height: 1.8;
}
</style>
