<template>
  <view class="page">
    <legal-doc :doc="legalDocs.terms" />
  </view>
</template>

<script setup lang="ts">
import LegalDoc from '@/components/legal-doc.vue'
import { legalDocs } from '@/config/legal'
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #fff;
}
</style>
