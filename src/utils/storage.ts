export const STORAGE_KEY_PREFIX = 'nail_'

function withPrefix(key: string): string {
  return key.startsWith(STORAGE_KEY_PREFIX) ? key : `${STORAGE_KEY_PREFIX}${key}`
}

export function getStorage<T>(key: string, fallback: T): T {
  try {
    const raw = uni.getStorageSync(withPrefix(key))
    if (raw === '' || raw === null || raw === undefined) {
      return fallback
    }

    return raw as T
  } catch (error) {
    console.warn(`[storage] read failed: ${key}`, error)
    return fallback
  }
}

export function setStorage<T>(key: string, value: T): void {
  try {
    uni.setStorageSync(withPrefix(key), value)
  } catch (error) {
    console.warn(`[storage] write failed: ${key}`, error)
  }
}

export function removeStorage(key: string): void {
  try {
    uni.removeStorageSync(withPrefix(key))
  } catch (error) {
    console.warn(`[storage] remove failed: ${key}`, error)
  }
}
