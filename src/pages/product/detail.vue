<template>
  <view class="detail">
    <template v-if="product">
      <swiper
        class="gallery"
        circular
        :autoplay="false"
        :indicator-dots="true"
        indicator-color="rgba(255, 255, 255, 0.4)"
        indicator-active-color="#ffffff"
        @change="onGalleryChange"
      >
        <swiper-item v-if="product.video">
          <video
            id="gallery-video"
            class="gallery-media"
            :src="product.video"
            :poster="product.cover"
            autoplay
            controls
            object-fit="cover"
          />
        </swiper-item>
        <swiper-item
          v-for="(img, index) in product.images"
          :key="img"
        >
          <image
            class="gallery-media"
            :src="img"
            mode="aspectFill"
            @click="previewImage(index)"
          />
        </swiper-item>
      </swiper>

      <view class="info">
        <view class="row">
          <price-tag
            :price="product.price"
            :unit="product.isAccessory ? '/件' : '/副'"
            size="lg"
          />
          <text class="sales">已售 {{ product.sales }}</text>
        </view>
        <text class="name">{{ product.name }}</text>
        <view class="tags">
          <text class="tag">{{ product.style }}</text>
          <text
            v-for="tag in product.tags"
            :key="tag"
            class="tag"
          >{{ tag }}</text>
        </view>
        <text class="unit">{{ unitText }}</text>
        <text
          v-if="!product.isAccessory"
          class="accessory-tip"
        >
          含工具包可选，工具包在分类页单独购买
        </text>
      </view>

      <view class="reviews">
        <view class="reviews-head">
          <text class="reviews-title">用户评价（{{ reviewCount }}）</text>
          <text v-if="reviewCount > 0" class="reviews-all" @click="openAllReviews">
            查看全部 ›
          </text>
          <text v-else class="reviews-score">{{ averageText }}</text>
        </view>

        <view
          v-if="reviews.length === 0"
          class="reviews-empty"
        >暂无评价</view>
        <review-card
          v-for="review in reviews"
          :key="review.id"
          :review="review"
        />

        <text
          v-if="reviewHasMore"
          class="more"
          @click="loadMoreReviews"
        >加载更多评价</text>
      </view>

      <view class="bottom-bar">
        <text
          class="fav"
          @click="toggleFavorite"
        >{{ favorite ? '已收藏' : '收藏' }}</text>
        <u-button
          custom-style="flex: 1; color: #8c3b4a; border-color: #e8b4b8; background-color: #ffffff"
          @click="onPrimary('cart')"
        >
          加入购物车
        </u-button>
        <u-button
          type="primary"
          custom-style="flex: 1; margin-left: 20rpx"
          @click="onPrimary('buy')"
        >
          立即购买
        </u-button>
      </view>

      <sku-picker
        v-model:show="skuVisible"
        :product="product"
        @confirm="handleSkuConfirm"
      />
    </template>

    <view
      v-else
      class="loading"
    >加载中…</view>

    <login-sheet />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { productApi } from '@/api/product'
import { reviewApi } from '@/api/review'
import { toastError } from '@/api/transport'
import type {
  OrderItem,
  ProductSku,
  PublicProductDetail,
  PublicReview,
} from '@/api/contract'
import PriceTag from '@/components/price-tag.vue'
import SkuPicker from '@/components/sku-picker.vue'
import ReviewCard from '@/components/review-card.vue'
import LoginSheet from '@/components/login-sheet.vue'
import { requireAuth } from '@/utils/auth-guard'
import { useSessionStore } from '@/stores/session'
import { useCartStore } from '@/stores/cart'
import { useFavoriteStore } from '@/stores/favorite'
import { setStorage } from '@/utils/storage'

const session = useSessionStore()
const cart = useCartStore()
const favoriteStore = useFavoriteStore()

const product = ref<PublicProductDetail | null>(null)
const skuVisible = ref(false)
const pendingMode = ref<'cart' | 'buy'>('cart')

const reviews = ref<PublicReview[]>([])
const reviewPage = ref(1)
const reviewHasMore = ref(false)
const reviewCount = ref(0)
const reviewAverage = ref(0)

const favorite = computed(() =>
  product.value ? favoriteStore.isFavorite(product.value.id) : false
)
const unitText = computed(() => {
  if (!product.value) {
    return ''
  }
  if (product.value.isAccessory) {
    return '配件 · 工具包，不参与包邮副数'
  }
  return product.value.piecesPerSet > 0
    ? `单位：${product.value.unit} · 每副 ${product.value.piecesPerSet} 片`
    : `单位：${product.value.unit} · 片数以实物为准`
})
const averageText = computed(() =>
  reviewCount.value > 0 ? `${reviewAverage.value} 分` : '暂无评分'
)

onLoad(async (options) => {
  const id = options?.id
  if (!id) {
    return
  }

  try {
    product.value = await productApi.detail(id)
    await loadReviews(true)

    if (session.isLoggedIn) {
      await favoriteStore.loadIds()
    }
  } catch (error) {
    toastError(error)
  }
})

async function loadReviews(reset = false): Promise<void> {
  if (!product.value) {
    return
  }

  try {
    const page = reset ? 1 : reviewPage.value + 1
    const result = await reviewApi.listByProduct(product.value.id, page)
    reviews.value = reset ? result.list : [...reviews.value, ...result.list]
    reviewPage.value = result.page
    reviewHasMore.value = result.hasMore
    reviewCount.value = result.count
    reviewAverage.value = result.average
  } catch (error) {
    toastError(error)
  }
}

function loadMoreReviews(): void {
  void loadReviews(false)
}

/** 滑到其他图片时暂停视频，避免后台继续播放 */
function onGalleryChange(event: { detail: { current: number } }): void {
  if (event.detail.current !== 0) {
    uni.createVideoContext('gallery-video')?.pause()
  }
}

function previewImage(index: number): void {
  if (!product.value) {
    return
  }
  uni.previewImage({ urls: product.value.images, current: index })
}

function openAllReviews(): void {
  if (!product.value) {
    return
  }
  uni.navigateTo({ url: `/pages-user/product/reviews?id=${product.value.id}` })
}

function openSku(mode: 'cart' | 'buy'): void {
  pendingMode.value = mode
  skuVisible.value = true
}

/** 工具包是独立配件商品，不选尺码甲型，直接加购 */
function onPrimary(mode: 'cart' | 'buy'): void {
  if (!product.value) {
    return
  }
  if (product.value.isAccessory) {
    addAccessory(mode)
    return
  }
  openSku(mode)
}

function addAccessory(mode: 'cart' | 'buy'): void {
  const current = product.value
  if (!current) {
    return
  }

  requireAuth(() => {
    if (mode === 'cart') {
      cart.addAccessory(current)
      uni.showToast({ title: '已加入购物车', icon: 'none' })
      return
    }

    const item: OrderItem = {
      skuId: `${current.id}-ACC`,
      productId: current.id,
      name: current.name,
      cover: current.cover,
      unit: '件',
      price: current.price,
      quantity: 1,
      isAccessory: true,
    }
    setStorage('checkout_items', [item])
    uni.navigateTo({ url: '/pages-user/checkout/index' })
  })
}

function handleSkuConfirm(payload: {
  sku: ProductSku
  quantity: number
}): void {
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
      shape: payload.sku.shape,
      unit: currentProduct.unit,
      price: currentProduct.price + payload.sku.priceDiff,
      quantity: payload.quantity,
      isAccessory: false,
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
      await favoriteStore.toggle(id)
    } catch (error) {
      toastError(error)
    }
  })
}
</script>

<style lang="scss" scoped>
.detail {
  min-height: 100vh;
  padding-bottom: 160rpx;
  background-color: $app-color-bg;
}

.gallery {
  width: 100%;
  height: 600rpx;
}

.gallery-media {
  width: 100%;
  height: 600rpx;
}

.info {
  margin: 20rpx;
  padding: 20rpx;
  background-color: $app-color-white;
  border: 1rpx solid $app-color-border;
  border-radius: $app-radius-lg;
  box-shadow: $app-shadow;
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
  margin-top: 10rpx;
  font-size: 28rpx;
  color: $app-color-text;
  font-weight: 600;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  margin-top: 10rpx;
}

.tag {
  margin: 0 8rpx 8rpx 0;
  padding: 4rpx 14rpx;
  font-size: 18rpx;
  color: $app-color-primary-dark;
  background-color: $app-color-primary-light;
  border-radius: $app-radius-pill;
}

.unit {
  display: block;
  margin-top: 8rpx;
  font-size: 20rpx;
  color: $app-color-text-muted;
}

.accessory-tip {
  display: block;
  margin-top: 4rpx;
  font-size: 20rpx;
  color: $app-color-text-muted;
}

.reviews {
  margin: 0 20rpx 20rpx;
  padding: 20rpx;
  background-color: $app-color-white;
  border: 1rpx solid $app-color-border;
  border-radius: $app-radius-lg;
  box-shadow: $app-shadow;
}

.reviews-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $app-space-xs;
}

.reviews-title {
  font-size: $app-font-base;
  font-weight: 600;
  color: $app-color-text;
}

.reviews-score {
  font-size: 22rpx;
  color: #d6a34f;
}

.reviews-all {
  font-size: 22rpx;
  color: $app-color-primary-dark;
}

.reviews-empty {
  padding: 20rpx 0;
  font-size: 22rpx;
  color: $app-color-text-muted;
}

.more {
  display: block;
  padding-top: 16rpx;
  font-size: 22rpx;
  color: $app-color-primary-dark;
  text-align: center;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background-color: $app-color-white;
  border-top: 1rpx solid $app-color-border;
}

.fav {
  margin-right: 20rpx;
  font-size: 22rpx;
  color: $app-color-primary-dark;
}

.loading {
  padding-top: 200rpx;
  text-align: center;
  color: $app-color-text-secondary;
}
</style>
