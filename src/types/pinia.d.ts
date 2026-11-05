import type { StateTree } from 'pinia'
import type { UniPersistOption } from '../stores/persist'

declare module 'pinia' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface DefineStoreOptionsBase<S extends StateTree, Store> {
    persist?: UniPersistOption
  }
}
