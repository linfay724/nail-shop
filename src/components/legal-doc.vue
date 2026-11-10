<template>
  <view class="legal-doc">
    <text class="title">{{ doc.title }}</text>
    <view class="meta">
      <text class="meta-item">版本 {{ doc.version }}</text>
      <text class="meta-item">更新于 {{ doc.updatedAt }}</text>
    </view>

    <view v-if="doc.sections.length === 0" class="placeholder">
      内容整理中，正式版本上线前以本页为准。
    </view>

    <view v-for="section in doc.sections" :key="section.heading" class="section">
      <text class="heading">{{ section.heading }}</text>
      <text v-for="(paragraph, index) in section.paragraphs" :key="index" class="paragraph">
        {{ paragraph }}
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { LegalDoc } from '@/config/legal'

defineProps<{ doc: LegalDoc }>()
</script>

<style lang="scss" scoped>
.legal-doc {
  padding: $app-space-base;
  background-color: #fff;
}

.title {
  font-size: $app-font-lg;
  font-weight: 600;
  color: $app-color-text;
}

.meta {
  display: flex;
  margin-top: $app-space-xs;
}

.meta-item {
  margin-right: $app-space-sm;
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.placeholder {
  margin-top: $app-space-base;
  padding: $app-space-base;
  font-size: $app-font-sm;
  color: $app-color-text-secondary;
  background-color: $app-color-input-bg;
  border-radius: $app-radius-base;
}

.section {
  margin-top: $app-space-base;
}

.heading {
  display: block;
  font-size: $app-font-base;
  font-weight: 600;
  color: $app-color-text;
}

.paragraph {
  display: block;
  margin-top: $app-space-xs;
  font-size: $app-font-sm;
  color: $app-color-text;
  line-height: 1.8;
}
</style>
