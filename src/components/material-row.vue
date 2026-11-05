<template>
  <view class="material-row">
    <view class="top">
      <view class="chips">
        <text
          v-for="item in categories"
          :key="item.value"
          class="chip"
          :class="{ active: material.category === item.value }"
          @click="patch({ category: item.value })"
        >
          {{ item.label }}
        </text>
      </view>
      <text class="remove" @click="emit('remove')">删除</text>
    </view>

    <view class="fields">
      <u-input :model-value="material.name" placeholder="材料名称" @update:model-value="(v) => patch({ name: v })" />
      <u-input :model-value="material.spec" placeholder="型号 / 色号" @update:model-value="(v) => patch({ spec: v })" />
    </view>

    <view class="fields">
      <u-input
        :model-value="String(material.amount)"
        type="digit"
        placeholder="用量"
        @update:model-value="(v) => patch({ amount: Number(v) || 0 })"
      />
      <u-input :model-value="material.unit" placeholder="单位" @update:model-value="(v) => patch({ unit: v })" />
    </view>
  </view>
</template>

<script setup lang="ts">
import type { MaterialCategory, MaterialLine } from '@/api/contract'

const props = defineProps<{ material: MaterialLine }>()
const emit = defineEmits<{
  (event: 'update:material', value: MaterialLine): void
  (event: 'remove'): void
}>()

const categories: Array<{ label: string; value: MaterialCategory }> = [
  { label: '甲片', value: 'tip' },
  { label: '甲油胶', value: 'gel' },
  { label: '饰品', value: 'ornament' },
  { label: '其他', value: 'other' },
]

function patch(partial: Partial<MaterialLine>): void {
  emit('update:material', { ...props.material, ...partial })
}
</script>

<style lang="scss" scoped>
.material-row {
  margin-bottom: $app-space-sm;
  padding: $app-space-sm;
  background-color: #fff;
  border-radius: $app-radius-base;
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chips {
  display: flex;
  flex-wrap: wrap;
}

.chip {
  margin-right: $app-space-xs;
  padding: 6rpx 18rpx;
  font-size: $app-font-xs;
  color: $app-color-text;
  background-color: #f5f5f5;
  border-radius: $app-radius-sm;
}

.active {
  color: #fff;
  background-color: $app-color-primary;
}

.remove {
  font-size: $app-font-xs;
  color: #dd524d;
}

.fields {
  display: flex;
  margin-top: $app-space-xs;
}
</style>
