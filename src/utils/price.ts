/**
 * 金额统一以「分」为单位存储，仅在展示时转元。
 */

export function formatPrice(cents: number): string {
  const safe = Number.isFinite(cents) ? Math.round(cents) : 0
  const sign = safe < 0 ? '-' : ''
  const abs = Math.abs(safe)
  const yuan = Math.floor(abs / 100)
  const fen = abs % 100

  return `${sign}¥${yuan}.${fen.toString().padStart(2, '0')}`
}

export function formatAmount(cents: number): string {
  const safe = Number.isFinite(cents) ? Math.round(cents) : 0

  return (safe / 100).toFixed(2)
}

export function sumAmount(items: Array<{ price: number; quantity: number }>): number {
  return items.reduce((total, item) => total + item.price * item.quantity, 0)
}

export function multiplyPrice(price: number, quantity: number): number {
  return Math.round(price * quantity)
}
