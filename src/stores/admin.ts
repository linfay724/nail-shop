import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AdminSession } from '@/api/contract'
import { adminApi } from '@/api/admin'

export const useAdminStore = defineStore(
  'admin',
  () => {
    const session = ref<AdminSession | null>(null)
    const isLoggedIn = computed(() => Boolean(session.value && session.value.expiresAt > Date.now()))

    async function login(passcode: string): Promise<void> {
      session.value = await adminApi.login(passcode)
      uni.setStorageSync('nail_admin_session', { session: session.value })
    }

    function logout(): void {
      session.value = null
      uni.removeStorageSync('nail_admin_session')
    }

    function requireSession(): boolean {
      if (isLoggedIn.value) {
        return true
      }
      session.value = null
      uni.removeStorageSync('nail_admin_session')
      return false
    }

    return { session, isLoggedIn, login, logout, requireSession }
  },
  { persist: { key: 'nail_admin_session' } },
)
