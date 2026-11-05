import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore(
  'app',
  () => {
    const launchCount = ref<number>(0)
    const lastActiveAt = ref<number>(Date.now())

    function recordLaunch(): void {
      launchCount.value += 1
      lastActiveAt.value = Date.now()
    }

    return { launchCount, lastActiveAt, recordLaunch }
  },
  { persist: true },
)
