<template>
  <view class="address-edit">
    <u-form ref="formRef" :model="form" :rules="rules" label-width="140">
      <u-form-item label="收货人" prop="receiver">
        <u-input v-model="form.receiver" placeholder="请输入收货人姓名" />
      </u-form-item>
      <u-form-item label="手机号" prop="phone">
        <u-input v-model="form.phone" placeholder="请输入 11 位手机号" />
      </u-form-item>
      <u-form-item label="所在地区" prop="regionText">
        <u-input v-model="form.regionText" placeholder="如：浙江省 杭州市 西湖区" />
      </u-form-item>
      <u-form-item label="详细地址" prop="detail">
        <u-input v-model="form.detail" placeholder="街道、门牌号等" />
      </u-form-item>
    </u-form>

    <view class="default-row">
      <text class="label">设为默认地址</text>
      <u-switch v-model="form.isDefault" />
    </view>

    <u-button type="primary" :loading="saving" @click="submit">保存</u-button>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { addressApi } from '@/api/address'
import { toastError } from '@/api/transport'
import type { Address } from '@/api/contract'

interface AddressForm {
  id: string
  receiver: string
  phone: string
  regionText: string
  detail: string
  isDefault: boolean
}

const form = reactive<AddressForm>({
  id: '',
  receiver: '',
  phone: '',
  regionText: '',
  detail: '',
  isDefault: false,
})

const rules = {
  receiver: [{ required: true, message: '请填写收货人', trigger: ['blur', 'change'] }],
  phone: [
    { required: true, message: '请填写手机号', trigger: ['blur', 'change'] },
    { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: ['blur', 'change'] },
  ],
  regionText: [{ required: true, message: '请填写所在地区', trigger: ['blur', 'change'] }],
  detail: [{ required: true, message: '请填写详细地址', trigger: ['blur', 'change'] }],
}

const formRef = ref<{ validate: () => Promise<unknown> } | null>(null)
const saving = ref(false)
let existing: Address | null = null

onLoad((options) => {
  const id = options?.id
  if (!id) {
    return
  }

  void addressApi.list().then((list) => {
    const target = list.find((item) => item.id === id)
    if (target) {
      existing = target
      form.id = target.id
      form.receiver = target.receiver
      form.phone = target.phone
      form.regionText = target.region.join(' ')
      form.detail = target.detail
      form.isDefault = target.isDefault
    }
  })
})

async function submit(): Promise<void> {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  saving.value = true
  try {
    const region = form.regionText.split(/[\s,，]+/).filter(Boolean)
    const address: Address = {
      id: form.id,
      receiver: form.receiver,
      phone: form.phone,
      region: region.length > 0 ? region : ['未填写'],
      detail: form.detail,
      isDefault: form.isDefault || existing?.isDefault === true,
    }
    await addressApi.save(address)
    uni.showToast({ title: '已保存', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 400)
  } catch (error) {
    toastError(error)
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.address-edit {
  min-height: 100vh;
  padding: $app-space-base;
  background-color: $app-color-bg;
}

.default-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: $app-space-base 0;
  padding: $app-space-sm;
  background-color: #fff;
  border-radius: $app-radius-base;
}

.label {
  font-size: $app-font-base;
  color: $app-color-text;
}
</style>
