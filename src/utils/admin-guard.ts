import { useAdminStore } from '@/stores/admin'
import { ADMIN_ROUTE_PREFIX } from '@/utils/constants'
import type { Permission } from '@/utils/permissions'

export const ADMIN_AUTH_PAGE = '/pages-admin/auth/index'
export const ADMIN_WORKBENCH_PAGE = '/pages-admin/index/index'
export const HOME_PAGE = '/pages/index/index'

/** 管理端路径与所需权限的映射，未列出的管理端页面只要求有管理会话 */
const ROUTE_PERMISSIONS: Array<{ prefix: string; permission: Permission }> = [
  { prefix: '/pages-admin/product', permission: 'product:write' },
  { prefix: '/pages-admin/craft', permission: 'craft:read' },
  { prefix: '/pages-admin/order', permission: 'order:read' },
  { prefix: '/pages-admin/review', permission: 'review:manage' },
  { prefix: '/pages-admin/shipping', permission: 'shipping:manage' },
  { prefix: '/pages-admin/staff', permission: 'staff:manage' },
]

function permissionOf(url: string): Permission | undefined {
  return ROUTE_PERMISSIONS.find((item) => url.startsWith(item.prefix))?.permission
}

/**
 * 管理端页面入场校验，必须在每个管理端页面 onLoad 首行调用。
 * 返回 false 时页面不得发起任何管理接口请求。
 */
export function useAdminGuard(required?: Permission): boolean {
  const admin = useAdminStore()
  if (!admin.isLoggedIn) {
    uni.showToast({ title: '无管理权限', icon: 'none' })
    uni.reLaunch({ url: HOME_PAGE })
    return false
  }

  const permission = required ?? undefined
  if (permission && !admin.can(permission)) {
    uni.showToast({ title: '当前账号无该操作权限', icon: 'none' })
    uni.redirectTo({ url: ADMIN_WORKBENCH_PAGE })
    return false
  }

  return true
}

/** 导航拦截器：所有管理端路径先校验会话与角色，鉴权页除外 */
export function installAdminInterceptor(): void {
  const targets = ['navigateTo', 'redirectTo', 'reLaunch'] as const

  targets.forEach((name) => {
    uni.addInterceptor(name, {
      invoke(args: { url?: string }) {
        const url = args.url ?? ''
        if (!url.startsWith(ADMIN_ROUTE_PREFIX) || url.startsWith(ADMIN_AUTH_PAGE)) {
          return true
        }

        const admin = useAdminStore()
        if (!admin.isLoggedIn) {
          uni.showToast({ title: '无管理权限', icon: 'none' })
          args.url = HOME_PAGE
          return true
        }

        const permission = permissionOf(url)
        if (permission && !admin.can(permission)) {
          uni.showToast({ title: '当前账号无该操作权限', icon: 'none' })
          args.url = ADMIN_WORKBENCH_PAGE
        }

        return true
      },
    })
  })
}
