<template>
  <text class="price-tag">{{ formatPrice(price) }}</text>
</template>

<script setup lang="ts">
import { formatPrice } from '@/utils/price'

defineProps<{ price: number }>()
</script>

<style lang="scss" scoped>
.price-tag {
  font-size: $app-font-lg;
  color: $app-color-primary;
  font-weight: 700;
}
</style>
