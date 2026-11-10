import type { CartLine, ShippingConfig } from '@/api/contract'

type SetLine = Pick<CartLine, 'quantity' | 'isAccessory'>

/** 包邮副数只统计穿戴甲行，工具包等配件不计入 */
export function countPaidSets(lines: SetLine[]): number {
  return lines.reduce((total, line) => (line.isAccessory ? total : total + line.quantity), 0)
}

/** 运费纯函数：达到包邮阈值返回 0，否则返回固定邮费 */
export function calcShipping(config: ShippingConfig, paidSets: number): number {
  if (paidSets >= config.freeShippingThreshold) {
    return 0
  }
  return Math.max(0, config.flatFee)
}

/** 结算页运费提示文案 */
export function describeShipping(config: ShippingConfig, paidSets: number): string {
  if (paidSets >= config.freeShippingThreshold) {
    return `已满 ${config.freeShippingThreshold} 副包邮`
  }
  const gap = config.freeShippingThreshold - paidSets
  return `再买 ${gap} 副包邮`
}
