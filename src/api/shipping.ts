import type { ShippingConfig } from './contract'
import { request } from './transport'

export const shippingApi = {
  getConfig(): Promise<ShippingConfig> {
    return request<ShippingConfig>('shipping/config', {}, { publicResponse: true })
  },
  saveConfig(payload: { freeShippingThreshold: number; flatFee: number }): Promise<ShippingConfig> {
    return request<ShippingConfig>('admin/shipping/save', { ...payload }, { admin: true })
  },
}
