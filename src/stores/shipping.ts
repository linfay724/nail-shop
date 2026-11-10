import { ref } from 'vue'
import { defineStore } from 'pinia'
import { shippingApi } from '@/api/shipping'
import { appConfig } from '@/config/env'
import type { ShippingConfig } from '@/api/contract'

/** 运费配置不做持久化，避免店主改配置后其他端读到旧值 */
export const useShippingStore = defineStore('shipping', () => {
  const config = ref<ShippingConfig>({
    merchantId: appConfig.defaultMerchantId,
    ...appConfig.fallbackShipping,
  })
  const loaded = ref(false)

  async function load(): Promise<ShippingConfig> {
    try {
      config.value = await shippingApi.getConfig()
      loaded.value = true
    } catch (error) {
      console.warn('[shipping] load failed', error)
    }
    return config.value
  }

  function patch(next: ShippingConfig): void {
    config.value = next
    loaded.value = true
  }

  return { config, loaded, load, patch }
})
