<template>
  <view class="detail">
    <template v-if="product">
      <u-swiper :list="images" height="600" :radius="0" />

      <view class="info">
        <view class="row">
          <price-tag :price="product.price" />
          <text class="sales">已售 {{ product.sales }}</text>
        </view>
        <text class="name">{{ product.name }}</text>
        <view class="tags">
          <text class="tag">{{ product.style }}</text>
          <text class="tag">{{ product.shape }}</text>
        </view>
        <text class="guide-link" @click="openGuide">如何测量尺码 ›</text>
      </view>

      <view class="bottom-bar">
        <text class="fav" @click="toggleFavorite">{{ favorite ? '已收藏' : '收藏' }}</text>
        <u-button custom-style="flex: 1" @click="openSku('cart')">加入购物车</u-button>
        <u-button type="primary" custom-style="flex: 1; margin-left: 20rpx" @click="openSku('buy')">
          立即购买
        </u-button>
      </view>

      <sku-picker v-model:show="skuVisible" :product="product" @confirm="handleSkuConfirm" />
    </template>

    <view v-else class="loading">加载中…</view>

    <login-sheet />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { productApi } from '@/api/product'
import { favoriteApi } from '@/api/favorite'
import { toastError } from '@/api/transport'
import type { OrderItem, ProductSku, PublicProductDetail } from '@/api/contract'
import PriceTag from '@/components/price-tag.vue'
import SkuPicker from '@/components/sku-picker.vue'
import LoginSheet from '@/components/login-sheet.vue'
import { requireAuth } from '@/utils/auth-guard'
import { useSessionStore } from '@/stores/session'
import { useCartStore } from '@/stores/cart'
import { setStorage } from '@/utils/storage'

const session = useSessionStore()
const cart = useCartStore()

const product = ref<PublicProductDetail | null>(null)
const favorite = ref(false)
const skuVisible = ref(false)
const pendingMode = ref<'cart' | 'buy'>('cart')

const images = computed(() => (product.value?.images ?? []).map((image) => ({ image })))

onLoad(async (options) => {
  const id = options?.id
  if (!id) {
    return
  }

  try {
    product.value = await productApi.detail(id)
    if (session.isLoggedIn) {
      const favorites = await favoriteApi.list()
      favorite.value = favorites.some((item) => item.id === id)
    }
  } catch (error) {
    toastError(error)
  }
})

function openSku(mode: 'cart' | 'buy'): void {
  pendingMode.value = mode
  skuVisible.value = true
}

function handleSkuConfirm(payload: { sku: ProductSku; quantity: number }): void {
  if (!product.value) {
    return
  }

  const currentProduct = product.value
  requireAuth(() => {
    if (pendingMode.value === 'cart') {
      cart.add(currentProduct, payload.sku, payload.quantity)
      uni.showToast({ title: '已加入购物车', icon: 'none' })
      return
    }

    const item: OrderItem = {
      skuId: payload.sku.id,
      productId: currentProduct.id,
      name: currentProduct.name,
      cover: currentProduct.cover,
      size: payload.sku.size,
      pieceCount: payload.sku.pieceCount,
      price: currentProduct.price + (payload.sku.priceDelta ?? 0),
      quantity: payload.quantity,
    }
    setStorage('checkout_items', [item])
    uni.navigateTo({ url: '/pages-user/checkout/index' })
  })
}

function toggleFavorite(): void {
  if (!product.value) {
    return
  }

  const id = product.value.id
  requireAuth(async () => {
    try {
      const result = await favoriteApi.toggle(id)
      favorite.value = result.favorite
    } catch (error) {
      toastError(error)
    }
  })
}

function openGuide(): void {
  uni.navigateTo({ url: '/pages-user/guide/size' })
}
</script>

<style lang="scss" scoped>
.detail {
  min-height: 100vh;
  padding-bottom: 160rpx;
  background-color: $app-color-bg;
}

.info {
  padding: $app-space-base;
  background-color: #fff;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sales {
  font-size: $app-font-xs;
  color: $app-color-text-secondary;
}

.name {
  display: block;
  margin-top: $app-space-xs;
  font-size: $app-font-lg;
  color: $app-color-text;
  font-weight: 600;
}

.tags {
  display: flex;
  margin-top: $app-space-xs;
}

.tag {
  margin-right: $app-space-xs;
  padding: 0 12rpx;
  font-size: $app-font-xs;
  color: $app-color-primary;
  background-color: $app-color-primary-light;
  border-radius: $app-radius-sm;
}

.guide-link {
  display: inline-block;
  margin-top: $app-space-sm;
  font-size: $app-font-sm;
  color: $app-color-primary;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: $app-space-sm $app-space-base;
  background-color: #fff;
}

.fav {
  margin-right: $app-space-sm;
  font-size: $app-font-sm;
  color: $app-color-text-secondary;
}

.loading {
  padding-top: 200rpx;
  text-align: center;
  color: $app-color-text-secondary;
}
</style>
