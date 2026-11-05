<template>
  <view class="craft-edit">
    <view class="block">
      <text class="block-title">材料清单</text>
      <text class="hint">每行材料需填写名称、用量与单位</text>
      <material-row
        v-for="(line, index) in materials"
        :key="index"
        :material="line"
        @update:material="createMaterialHandler(index)"
        @remove="removeMaterial(index)"
      />
      <u-button size="small" plain @click="addMaterial">新增材料</u-button>
    </view>

    <view class="block">
      <text class="block-title">制作步骤</text>
      <step-editor
        v-for="(step, index) in steps"
        :key="index"
        :step="step"
        :index="index"
        @update:step="createStepHandler(index)"
        @remove="removeStep"
        @move-up="moveStep(index, -1)"
        @move-down="moveStep(index, 1)"
      />
      <u-button size="small" plain @click="addStep">新增步骤</u-button>
    </view>

    <view class="block">
      <text class="block-title">成本核算</text>
      <view class="cost-row">
        <text class="cost-label">材料成本（元）</text>
        <u-input v-model="materialCostYuan" type="digit" custom-style="width: 200rpx" />
      </view>
      <view class="cost-row">
        <text class="cost-label">其他成本（元）</text>
        <u-input v-model="otherCostYuan" type="digit" custom-style="width: 200rpx" />
      </view>
      <view class="summary">
        <text class="summary-item">预估总成本：{{ formatPrice(totalCost) }}</text>
        <text class="summary-item">预估毛利：{{ formatPrice(margin) }}</text>
      </view>
    </view>

    <u-button type="primary" :loading="saving" @click="submit">保存档案</u-button>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { adminApi } from '@/api/admin'
import { toastError } from '@/api/transport'
import type { CraftArchive, CraftStep, MaterialLine } from '@/api/contract'
import MaterialRow from '@/components/material-row.vue'
import StepEditor from '@/components/step-editor.vue'
import { useAdminGuard } from '@/utils/admin-guard'
import { formatPrice } from '@/utils/price'

const productId = ref('')
const productPrice = ref(0)
const materials = ref<MaterialLine[]>([])
const steps = ref<CraftStep[]>([])
const materialCostYuan = ref('0')
const otherCostYuan = ref('0')
const saving = ref(false)
let guarded = false

const totalCost = computed(
  () => toCents(materialCostYuan.value) + toCents(otherCostYuan.value),
)
const margin = computed(() => productPrice.value - totalCost.value)

function toCents(yuan: string): number {
  const value = Number(yuan)
  if (!Number.isFinite(value) || value < 0) {
    return -1
  }
  return Math.round(value * 100)
}

onLoad(async (options) => {
  guarded = useAdminGuard()
  productId.value = options?.productId ?? ''
  if (!guarded || !productId.value) {
    return
  }

  try {
    const products = await adminApi.listProducts()
    productPrice.value = products.find((item) => item.id === productId.value)?.price ?? 0
    const archive = await adminApi.getCraft(productId.value)
    materials.value = archive.materials
    steps.value = archive.steps
    materialCostYuan.value = (archive.materialCost / 100).toFixed(2)
    otherCostYuan.value = (archive.otherCost / 100).toFixed(2)
  } catch (error) {
    toastError(error)
  }
})

function addMaterial(): void {
  materials.value.push({ category: 'tip', name: '', spec: '', amount: 0, unit: '片' })
}

function createMaterialHandler(index: number) {
  return (value: MaterialLine): void => {
    materials.value[index] = value
  }
}

function removeMaterial(index: number): void {
  materials.value.splice(index, 1)
}

function addStep(): void {
  steps.value.push({ order: steps.value.length + 1, description: '', images: [] })
}

function createStepHandler(index: number) {
  return (value: CraftStep): void => {
    steps.value[index] = value
  }
}

function removeStep(index: number): void {
  steps.value.splice(index, 1)
}

function moveStep(index: number, offset: number): void {
  const target = index + offset
  if (target < 0 || target >= steps.value.length) {
    return
  }

  const list = [...steps.value]
  const [moved] = list.splice(index, 1)
  list.splice(target, 0, moved)
  steps.value = list
}

async function submit(): Promise<void> {
  if (!guarded) {
    return
  }
  if (materials.value.some((line) => !line.name || !line.amount || line.amount <= 0)) {
    uni.showToast({ title: '材料名称与用量必须填写', icon: 'none' })
    return
  }
  if (steps.value.some((step) => !step.description || step.images.length === 0)) {
    uni.showToast({ title: '每一步都需要说明与图片', icon: 'none' })
    return
  }
  if (toCents(materialCostYuan.value) < 0 || toCents(otherCostYuan.value) < 0) {
    uni.showToast({ title: '成本必须为非负数值', icon: 'none' })
    return
  }

  const archive: CraftArchive = {
    productId: productId.value,
    materials: materials.value.map((line) => ({ ...line })),
    steps: steps.value.map((step, index) => ({ ...step, order: index + 1, images: [...step.images] })),
    materialCost: toCents(materialCostYuan.value),
    otherCost: toCents(otherCostYuan.value),
    updatedAt: new Date().toISOString(),
  }

  saving.value = true
  try {
    await adminApi.saveCraft(archive)
    uni.showToast({ title: '已保存档案', icon: 'none' })
  } catch (error) {
    toastError(error)
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.craft-edit {
  min-height: 100vh;
  padding: $app-space-base;
  background-color: $app-color-bg;
}

.block {
  margin-bottom: $app-space-base;
}

.block-title {
  display: block;
  margin-bottom: $app-space-xs;
  font-size: $app-font-base;
  color: $app-color-text;
  font-weight: 600;
}

.hint {
  display: block;
  margin-bottom: $app-space-sm;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.cost-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $app-space-sm;
  margin-bottom: $app-space-xs;
  background-color: #fff;
  border-radius: $app-radius-base;
}

.cost-label {
  font-size: $app-font-sm;
  color: $app-color-text;
}

.summary {
  padding: $app-space-sm;
  background-color: #fff;
  border-radius: $app-radius-base;
}

.summary-item {
  display: block;
  font-size: $app-font-sm;
  color: $app-color-text;
  line-height: 1.8;
}
</style>
