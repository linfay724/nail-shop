import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { cartApi } from '@/api/cart'
import type { CartLine, PublicProduct, PublicProductDetail, ProductSku } from '@/api/contract'
import { countPaidSets } from '@/utils/shipping'

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
    /** 结算副数：只统计穿戴甲，工具包等配件不计入包邮阈值 */
    const paidSets = computed(() => countPaidSets(selectedLines.value))
    const allSelected = computed(
      () => validLines.value.length > 0 && validLines.value.every((line) => line.selected),
    )

    function syncToMock(): void {
      void cartApi.save(lines.value).catch((error) => console.warn('[cart] sync failed', error))
    }

    /** 加入穿戴甲：以「商品 + 尺码 + 甲型」组合作为行唯一标识 */
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
          shape: sku.shape,
          isAccessory: false,
          quantity: Math.min(quantity, sku.stock),
          selected: true,
          snapshot: {
            name: product.name,
            cover: product.cover,
            price: product.price + sku.priceDiff,
            stock: sku.stock,
            unit: product.unit,
            piecesPerSet: product.piecesPerSet,
          },
        })
      }
      syncToMock()
    }

    /** 加入配件（工具包）：独立成行，不参与副数统计 */
    function addAccessory(product: PublicProduct, quantity = 1): void {
      const skuId = `${product.id}-ACC`
      const exists = lines.value.find((line) => line.skuId === skuId)
      if (exists) {
        exists.quantity += quantity
        exists.selected = true
      } else {
        lines.value.push({
          skuId,
          productId: product.id,
          isAccessory: true,
          quantity,
          selected: true,
          snapshot: {
            name: product.name,
            cover: product.cover,
            price: product.price,
            stock: 99,
            unit: '件',
            piecesPerSet: 0,
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

    /** 丢弃旧版本（尺码 + 片数模型）遗留的购物车行 */
    function sanitize(): void {
      lines.value = lines.value.filter(
        (line) =>
          Boolean(line.snapshot) &&
          typeof line.snapshot.stock === 'number' &&
          typeof line.isAccessory === 'boolean',
      )
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
      paidSets,
      allSelected,
      add,
      addAccessory,
      updateQuantity,
      toggle,
      toggleAll,
      remove,
      clear,
      reset,
      sanitize,
      load,
    }
  },
  { persist: { key: 'nail_cart' } },
)
