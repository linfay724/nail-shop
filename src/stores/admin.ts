import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AdminSession } from '@/api/contract'
import { staffApi } from '@/api/staff'
import { hasPermission, type Permission } from '@/utils/permissions'

export const useAdminStore = defineStore(
  'admin',
  () => {
    const session = ref<AdminSession | null>(null)

    const isLoggedIn = computed(() => Boolean(session.value && session.value.expiresAt > Date.now()))
    const role = computed(() => session.value?.role ?? null)

    async function loginWithCode(code: string): Promise<AdminSession> {
      const result = await staffApi.resolveEntry(code)
      session.value = result
      return result
    }

    function logout(): void {
      session.value = null
    }

    function requireSession(): boolean {
      if (isLoggedIn.value) {
        return true
      }
      session.value = null
      return false
    }

    function can(permission: Permission): boolean {
      const current = session.value
      if (!current || current.expiresAt <= Date.now()) {
        return false
      }
      return hasPermission(current.role, permission)
    }

    return { session, isLoggedIn, role, loginWithCode, logout, requireSession, can }
  },
  { persist: { key: 'nail_admin_session' } },
)
