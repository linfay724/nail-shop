import { useAdminStore } from '@/stores/admin'
import { ADMIN_ROUTE_PREFIX } from '@/utils/constants'

export const ADMIN_AUTH_PAGE = '/pages-admin/auth/index'
export const HOME_PAGE = '/pages/index/index'

/**
 * 管理端页面入场校验，必须在每个管理端页面 onLoad 首行调用。
 * 返回 false 时页面不得发起任何管理接口请求。
 */
export function useAdminGuard(): boolean {
  const admin = useAdminStore()
  if (admin.isLoggedIn) {
    return true
  }

  uni.showToast({ title: '无管理权限', icon: 'none' })
  uni.reLaunch({ url: HOME_PAGE })
  return false
}

/**
 * 导航拦截器：所有管理端路径统一先校验会话，鉴权页除外。
 */
export function installAdminInterceptor(): void {
  const targets = ['navigateTo', 'redirectTo', 'reLaunch'] as const

  targets.forEach((name) => {
    uni.addInterceptor(name, {
      invoke(args: { url?: string }) {
        const url = args.url ?? ''
        if (url.startsWith(ADMIN_ROUTE_PREFIX) && url !== ADMIN_AUTH_PAGE) {
          const admin = useAdminStore()
          if (!admin.isLoggedIn) {
            uni.showToast({ title: '无管理权限', icon: 'none' })
            args.url = HOME_PAGE
          }
        }
        return true
      },
    })
  })
}
