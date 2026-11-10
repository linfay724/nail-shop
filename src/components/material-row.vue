<template>
  <view class="material-row">
    <template v-if="readonly">
      <view class="readonly-line">
        <text class="readonly-category">{{ categoryLabel }}</text>
        <text class="readonly-name">{{ material.name }} {{ material.spec }}</text>
        <text class="readonly-amount">{{ material.amount }} {{ material.unit }}</text>
      </view>
    </template>

    <template v-else>
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
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MaterialCategory, MaterialLine } from '@/api/contract'

const props = withDefaults(defineProps<{ material: MaterialLine; readonly?: boolean }>(), {
  readonly: false,
})
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

const categoryLabel = computed(
  () => categories.find((item) => item.value === props.material.category)?.label ?? '其他',
)

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
  background-color: $app-color-input-bg;
  border-radius: $app-radius-sm;
}

.active {
  color: #fff;
  background-color: $app-color-primary;
}

.remove {
  font-size: $app-font-xs;
  color: $app-color-danger;
}

.fields {
  display: flex;
  margin-top: $app-space-xs;
}

.readonly-line {
  display: flex;
  align-items: center;
}

.readonly-category {
  width: 100rpx;
  font-size: $app-font-xs;
  color: $app-color-primary;
}

.readonly-name {
  flex: 1;
  font-size: $app-font-sm;
  color: $app-color-text;
}

.readonly-amount {
  font-size: $app-font-sm;
  color: $app-color-text-secondary;
}
</style>
