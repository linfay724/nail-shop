<template>
  <view class="aftersale">
    <view class="block">
      <text class="block-title">关联订单</text>
      <text class="order-no">{{ orderId || '—' }}</text>
    </view>

    <view class="block">
      <text class="block-title">选择问题类型</text>
      <view
        v-for="item in TYPES"
        :key="item.value"
        class="option"
        :class="{ active: type === item.value }"
        @click="type = item.value"
      >
        <text class="radio" :class="{ on: type === item.value }" />
        <text class="option-label">{{ item.label }}</text>
      </view>
    </view>

    <view class="block">
      <text class="block-title">问题描述</text>
      <textarea
        v-model="description"
        class="textarea"
        maxlength="500"
        placeholder="描述遇到的问题，例如尺码不合适、甲片破损等，方便店主判断"
      />
      <text class="count">{{ description.length }}/500</text>
    </view>

    <view class="block">
      <text class="block-title">上传凭证（最多 9 张图片或 1 个视频）</text>
      <media-uploader v-model="media" :max-images="9" />
    </view>

    <text class="tips">
      提交后会跳转客服会话，由店主人工协商处理；本店不提供线上退款/退货，订单状态也不会因协商变化。
    </text>

    <u-button type="primary" :loading="submitting" @click="submit">提交并联系客服</u-button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { afterSaleApi } from '@/api/aftersale'
import { toastError } from '@/api/transport'
import {
  AFTER_SALE_TYPE_LABELS,
  type AfterSaleType,
  type ReviewMedia,
} from '@/api/contract'
import MediaUploader from '@/components/media-uploader.vue'
import { requireAuth } from '@/utils/auth-guard'

const TYPES = (Object.keys(AFTER_SALE_TYPE_LABELS) as AfterSaleType[]).map((value) => ({
  value,
  label: AFTER_SALE_TYPE_LABELS[value],
}))

const orderId = ref('')
const type = ref<AfterSaleType>('size')
const description = ref('')
const media = ref<ReviewMedia[]>([])
const submitting = ref(false)

onLoad((options) => {
  orderId.value = options?.orderId ?? ''
  requireAuth()
})

function openServiceChat(recordId: string): void {
  const chat = (uni as unknown as {
    openCustomerServiceChat?: (options: {
      extInfo: { url: string; title?: string }
      corpId: string
      fail?: () => void
    }) => void
  }).openCustomerServiceChat

  if (chat) {
    chat({
      extInfo: {
        url: `https://work.weixin.qq.com/kfid/order-${orderId.value}`,
        title: `订单 ${orderId.value} 售后协商`,
      },
      corpId: '',
      fail: () => fallbackContact(recordId),
    })
    return
  }

  fallbackContact(recordId)
}

function fallbackContact(recordId: string): void {
  uni.showModal({
    title: '联系客服',
    content: `客服微信：nailcare-store\n订单号 ${orderId.value}\n协商编号 ${recordId}`,
    confirmText: '复制微信号',
    success: (result) => {
      if (result.confirm) {
        uni.setClipboardData({ data: 'nailcare-store' })
      }
    },
  })
}

async function submit(): Promise<void> {
  if (!orderId.value) {
    uni.showToast({ title: '缺少订单信息', icon: 'none' })
    return
  }
  if (!description.value.trim()) {
    uni.showToast({ title: '请填写问题描述', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    const record = await afterSaleApi.create({
      orderId: orderId.value,
      type: type.value,
      description: description.value.trim(),
      media: media.value,
    })
    uni.showToast({ title: '已提交，请与客服协商', icon: 'none' })
    openServiceChat(record.id)
    setTimeout(() => {
      uni.navigateBack()
    }, 1200)
  } catch (error) {
    toastError(error)
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.aftersale {
  min-height: 100vh;
  padding: 28rpx;
  padding-bottom: 80rpx;
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
  display: block;
  margin-bottom: 12rpx;
  font-size: 26rpx;
  color: $app-color-text;
  font-weight: 600;
}

.order-no {
  font-size: 22rpx;
  color: $app-color-text-muted;
}

.option {
  display: flex;
  align-items: center;
  padding: 22rpx 0;
  border-bottom: 1rpx solid $app-color-border-soft;
}

.option:last-child {
  border-bottom: none;
}

.radio {
  flex: 0 0 auto;
  width: 32rpx;
  height: 32rpx;
  margin-right: 18rpx;
  border: 3rpx solid $app-color-disabled-bg;
  border-radius: 50%;
}

.radio.on {
  border: 9rpx solid $app-color-primary-dark;
}

.option-label {
  font-size: 24rpx;
  color: $app-color-text;
}

.active .option-label {
  color: $app-color-primary-dark;
  font-weight: 600;
}

.textarea {
  width: 100%;
  height: 200rpx;
  padding: 18rpx;
  font-size: 22rpx;
  color: $app-color-text;
  background-color: $app-color-input-bg;
  border: 1rpx solid $app-color-border;
  border-radius: 18rpx;
}

.count {
  display: block;
  margin-top: 8rpx;
  text-align: right;
  font-size: 18rpx;
  color: $app-color-text-muted;
}

/* 与原型 .role-banner 一致的说明条 */
.tips {
  display: block;
  margin-bottom: 24rpx;
  padding: 14rpx 16rpx;
  font-size: 20rpx;
  line-height: 1.6;
  color: $app-color-warning-text;
  background-color: $app-color-warning-bg;
  border-radius: 20rpx;
}
</style>
