import { ref } from 'vue'
import { useSessionStore } from '@/stores/session'

export const loginSheetVisible = ref(false)

let pendingAction: (() => void) | null = null

export function useAuthGuard() {
  return {
    visible: loginSheetVisible,
    open(): void {
      loginSheetVisible.value = true
    },
    close(): void {
      loginSheetVisible.value = false
      pendingAction = null
    },
  }
}

/**
 * 需要身份的动作入口：已登录直接执行，未登录弹快捷登录弹层并记住待执行动作。
 */
export function requireAuth(action?: () => void): boolean {
  const session = useSessionStore()
  if (session.isLoggedIn) {
    action?.()
    return true
  }

  pendingAction = action ?? null
  loginSheetVisible.value = true
  return false
}

export function runPendingAction(): void {
  const action = pendingAction
  pendingAction = null
  action?.()
}

export function clearPendingAction(): void {
  pendingAction = null
}
