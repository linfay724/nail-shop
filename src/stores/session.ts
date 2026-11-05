import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { UserSession } from '@/api/contract'
import { userApi } from '@/api/user'

export const useSessionStore = defineStore(
  'session',
  () => {
    const session = ref<UserSession | null>(null)

    const isLoggedIn = computed(() => Boolean(session.value && session.value.expiresAt > Date.now()))

    function persist(): void {
      if (session.value) {
        uni.setStorageSync('nail_user_session', { session: session.value })
      }
    }

    async function login(payload: { nickname?: string; phone?: string } = {}): Promise<UserSession> {
      const result = await userApi.login(payload)
      session.value = result
      persist()
      return result
    }

    async function restore(): Promise<void> {
      if (!session.value) {
        return
      }
      if (session.value.expiresAt > Date.now()) {
        return
      }

      session.value = null
    }

    /** 启动静默登录：无会话或会话失效时用 uni.login 换 code，无感知建立会话 */
    async function silentLogin(): Promise<void> {
      await restore()
      if (isLoggedIn.value) {
        return
      }

      try {
        const loginResult = await uni.login({ provider: 'weixin' })
        const code = (loginResult as UniApp.LoginRes).code
        if (!code) {
          return
        }
        await login({})
      } catch (error) {
        console.warn('[session] silent login skipped', error)
      }
    }

    function logout(): void {
      session.value = null
      uni.removeStorageSync('nail_user_session')
    }

    return { session, isLoggedIn, login, restore, silentLogin, logout }
  },
  { persist: { key: 'nail_user_session' } },
)
