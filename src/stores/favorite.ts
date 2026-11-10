import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { favoriteApi } from '@/api/favorite'
import type { PublicProduct } from '@/api/contract'

/** 收藏以服务端为准，本地只做缓存，不持久化 */
export const useFavoriteStore = defineStore('favorite', () => {
  const ids = ref<string[]>([])
  const list = ref<PublicProduct[]>([])
  const page = ref(1)
  const hasMore = ref(false)
  const loaded = ref(false)

  const idSet = computed(() => new Set(ids.value))

  function isFavorite(productId: string): boolean {
    return idSet.value.has(productId)
  }

  async function loadIds(): Promise<void> {
    try {
      ids.value = await favoriteApi.ids()
      loaded.value = true
    } catch (error) {
      console.warn('[favorite] load ids failed', error)
    }
  }

  async function loadList(reset = true): Promise<void> {
    try {
      const target = reset ? 1 : page.value + 1
      const result = await favoriteApi.list(target)
      list.value = reset ? result.list : [...list.value, ...result.list]
      page.value = result.page
      hasMore.value = result.hasMore
    } catch (error) {
      console.warn('[favorite] load list failed', error)
    }
  }

  async function toggle(productId: string): Promise<boolean> {
    const previous = ids.value
    const favorite = !isFavorite(productId)
    ids.value = favorite ? [...ids.value, productId] : ids.value.filter((id) => id !== productId)

    try {
      const result = await favoriteApi.toggle(productId)
      ids.value = result.favorite
        ? [...ids.value.filter((id) => id !== productId), productId]
        : ids.value.filter((id) => id !== productId)
      list.value = result.favorite ? list.value : list.value.filter((item) => item.id !== productId)
      return result.favorite
    } catch (error) {
      ids.value = previous
      throw error
    }
  }

  function reset(): void {
    ids.value = []
    list.value = []
    page.value = 1
    hasMore.value = false
    loaded.value = false
  }

  return { ids, list, hasMore, loaded, isFavorite, loadIds, loadList, toggle, reset }
})
