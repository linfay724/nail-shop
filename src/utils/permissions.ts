import type { Role } from '@/api/contract'

/** 管理端权限点，前端入口、路由守卫与 mock handler 共用同一张表 */
export type Permission =
  | 'product:read'
  | 'product:write'
  | 'craft:read'
  | 'craft:write'
  | 'cost:read'
  | 'order:read'
  | 'order:write'
  | 'review:manage'
  | 'shipping:manage'
  | 'staff:manage'

const OWNER_PERMISSIONS: Permission[] = [
  'product:read',
  'product:write',
  'craft:read',
  'craft:write',
  'cost:read',
  'order:read',
  'order:write',
  'review:manage',
  'shipping:manage',
  'staff:manage',
]

/** 美甲师仅可只读制作资料（材料清单与步骤），不含成本 */
const ARTIST_PERMISSIONS: Permission[] = ['craft:read']

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: OWNER_PERMISSIONS,
  artist: ARTIST_PERMISSIONS,
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: '店主',
  artist: '美甲师',
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}
