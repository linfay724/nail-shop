import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { cartApi } from '@/api/cart'
import type { CartLine, PublicProductDetail, ProductSku } from '@/api/contract'

export const useCartStore = defineStore(
  'cart',
  () => {
    const lines = ref<CartLine[]>([])

    const validLines = computed(() => lines.value.filter((line) => line.snapshot.stock > 0))
    const selectedLines = computed(() => validLines.value.filter((line) => line.selected))
    const totalCount = computed(() =>
      selectedLines.value.reduce((count, line) => count + line.quantity, 0),
    )
    const totalAmount = computed(() =>
      selectedLines.value.reduce((total, line) => total + line.snapshot.price * line.quantity, 0),
    )
    const allSelected = computed(
      () => validLines.value.length > 0 && validLines.value.every((line) => line.selected),
    )

    function syncToMock(): void {
      void cartApi.save(lines.value).catch((error) => console.warn('[cart] sync failed', error))
    }

    function add(product: PublicProductDetail, sku: ProductSku, quantity = 1): void {
      const exists = lines.value.find((line) => line.skuId === sku.id)
      if (exists) {
        exists.quantity = Math.min(exists.quantity + quantity, sku.stock)
        exists.selected = true
      } else {
        lines.value.push({
          skuId: sku.id,
          productId: product.id,
          size: sku.size,
          pieceCount: sku.pieceCount,
          quantity: Math.min(quantity, sku.stock),
          selected: true,
          snapshot: {
            name: product.name,
            cover: product.cover,
            price: product.price + (sku.priceDelta ?? 0),
            stock: sku.stock,
          },
        })
      }
      syncToMock()
    }

    function updateQuantity(skuId: string, quantity: number): boolean {
      const line = lines.value.find((item) => item.skuId === skuId)
      if (!line) {
        return false
      }

      if (quantity >= line.snapshot.stock) {
        line.quantity = line.snapshot.stock
        return false
      }

      line.quantity = Math.max(1, quantity)
      syncToMock()
      return true
    }

    function toggle(skuId: string): void {
      const line = lines.value.find((item) => item.skuId === skuId)
      if (line && line.snapshot.stock > 0) {
        line.selected = !line.selected
        syncToMock()
      }
    }

    function toggleAll(selected: boolean): void {
      lines.value.forEach((line) => {
        if (line.snapshot.stock > 0) {
          line.selected = selected
        }
      })
      syncToMock()
    }

    function remove(skuId: string): void {
      lines.value = lines.value.filter((line) => line.skuId !== skuId)
      syncToMock()
    }

    function clear(): void {
      lines.value = []
      syncToMock()
    }

    function reset(): void {
      lines.value = []
    }

    async function load(): Promise<void> {
      try {
        const remote = await cartApi.list()
        if (remote.length > 0) {
          lines.value = remote
        } else if (lines.value.length > 0) {
          syncToMock()
        }
      } catch (error) {
        console.warn('[cart] load failed', error)
      }
    }

    return {
      lines,
      validLines,
      selectedLines,
      totalCount,
      totalAmount,
      allSelected,
      add,
      updateQuantity,
      toggle,
      toggleAll,
      remove,
      clear,
      reset,
      load,
    }
  },
  { persist: { key: 'nail_cart' } },
)
