import { createPinia } from 'pinia'
import { createUniPersistPlugin } from './persist'

/** 所有业务 store 的 storage key 统一前缀 */
export const STORAGE_PREFIX = 'nail_'

export const pinia = createPinia()

pinia.use(createUniPersistPlugin(STORAGE_PREFIX))
