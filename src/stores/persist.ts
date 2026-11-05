import type { PiniaPluginContext } from 'pinia'

export interface UniPersistOptions {
  /** 自定义 storage key，默认 `${prefix}${store.$id}` */
  key?: string
  /** 仅持久化指定顶层字段 */
  paths?: string[]
}

export type UniPersistOption = boolean | UniPersistOptions

function resolveKey(prefix: string, storeId: string, options: UniPersistOptions): string {
  return options.key ?? `${prefix}${storeId}`
}

function pickPaths(state: Record<string, unknown>, paths?: string[]): Record<string, unknown> {
  if (!paths || paths.length === 0) {
    return state
  }

  return paths.reduce<Record<string, unknown>>((picked, path) => {
    picked[path] = state[path]
    return picked
  }, {})
}

/**
 * 基于 uni storage 的 Pinia 持久化插件：初始化回填 + 变更写回。
 */
export function createUniPersistPlugin(prefix: string) {
  return ({ store, options }: PiniaPluginContext) => {
    const persistOption = (options as { persist?: UniPersistOption }).persist
    if (!persistOption) {
      return
    }

    const persist: UniPersistOptions = typeof persistOption === 'boolean' ? {} : persistOption
    const storageKey = resolveKey(prefix, store.$id, persist)

    try {
      const cached = uni.getStorageSync(storageKey)
      if (cached && typeof cached === 'object') {
        store.$patch((state) => {
          Object.assign(state, cached as Record<string, unknown>)
        })
      }
    } catch (error) {
      console.warn(`[persist] restore failed: ${storageKey}`, error)
    }

    store.$subscribe(
      (_mutation, state) => {
        try {
          uni.setStorageSync(storageKey, pickPaths(state as Record<string, unknown>, persist.paths))
        } catch (error) {
          console.warn(`[persist] write failed: ${storageKey}`, error)
        }
      },
      { detached: true, flush: 'sync' },
    )
  }
}
