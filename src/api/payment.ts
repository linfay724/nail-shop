import { appConfig } from '@/config/env'
import { orderApi } from './order'
import type { PublicOrder } from './contract'

export interface PayResult {
  paid: boolean
  order: PublicOrder
}

function confirmMockPayment(): Promise<boolean> {
  return new Promise((resolve) => {
    uni.showModal({
      title: '模拟支付',
      content: '点击「确定」模拟支付成功，点击「取消」模拟支付取消',
      confirmText: '确定',
      cancelText: '取消',
      success: (result) => resolve(result.confirm),
      fail: () => resolve(false),
    })
  })
}

/**
 * 支付入口：mock 模式弹确认框，真实模式调用 uni.requestPayment（契约占位）。
 */
export async function payOrder(orderId: string, payParams?: Record<string, string>): Promise<PayResult> {
  if (appConfig.mockMode) {
    const confirmed = await confirmMockPayment()
    if (!confirmed) {
      const order = await orderApi.detail(orderId)
      return { paid: false, order }
    }

    return { paid: true, order: await orderApi.pay(orderId) }
  }

  await new Promise<void>((resolve, reject) => {
    uni.requestPayment({
      provider: 'wxpay',
      orderInfo: payParams ?? {},
      success: () => resolve(),
      fail: (error: { errMsg: string }) => reject({ code: 500, message: error.errMsg }),
    } as unknown as UniApp.RequestPaymentOptions)
  })

  return { paid: true, order: await orderApi.pay(orderId) }
}
