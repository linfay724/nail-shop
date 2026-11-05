<template>
  <view class="aftersale">
    <view class="block">
      <text class="label">售后类型</text>
      <u-radio-group v-model="type">
        <u-radio name="refund">仅退款</u-radio>
        <u-radio name="return_refund">退货退款</u-radio>
      </u-radio-group>
    </view>

    <view class="block">
      <text class="label">申请原因</text>
      <u-textarea v-model="reason" :maxlength="50" placeholder="请填写申请原因" count />
    </view>

    <view class="block">
      <text class="label">问题说明</text>
      <u-textarea v-model="description" :maxlength="200" placeholder="请补充说明（选填）" count />
    </view>

    <u-button type="primary" :loading="submitting" @click="submit">提交申请</u-button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { orderApi } from '@/api/order'
import { toastError } from '@/api/transport'
import type { AfterSaleType } from '@/api/contract'

const orderId = ref('')
const type = ref<AfterSaleType>('refund')
const reason = ref('')
const description = ref('')
const submitting = ref(false)

onLoad((options) => {
  orderId.value = options?.id ?? ''
})

async function submit(): Promise<void> {
  if (!reason.value.trim()) {
    uni.showToast({ title: '请填写申请原因', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    await orderApi.applyAfterSale({
      id: orderId.value,
      type: type.value,
      reason: reason.value,
      description: description.value,
    })
    uni.showToast({ title: '已提交申请', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 400)
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
  padding: $app-space-base;
  background-color: $app-color-bg;
}

.block {
  margin-bottom: $app-space-base;
  padding: $app-space-base;
  background-color: #fff;
  border-radius: $app-radius-base;
}

.label {
  display: block;
  margin-bottom: $app-space-sm;
  font-size: $app-font-base;
  color: $app-color-text;
  font-weight: 600;
}
</style>
