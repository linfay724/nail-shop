import type { AdminSession, AccountStatus, StaffAccountView } from './contract'
import { request } from './transport'

/**
 * 账号由服务端预置（mock 以种子账号模拟），管理端只做查看、停用/启用与重新生成码，
 * 不提供新增账号与角色分配。
 */
export const staffApi = {
  resolveEntry(code: string): Promise<AdminSession> {
    return request<AdminSession>('staff/resolve', { code })
  },
  list(): Promise<StaffAccountView[]> {
    return request<StaffAccountView[]>('admin/staff/list', {}, { admin: true })
  },
  setStatus(accountId: string, status: AccountStatus): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('admin/staff/status', { accountId, status }, { admin: true })
  },
  regenerate(accountId: string): Promise<{ code: string }> {
    return request<{ code: string }>('admin/staff/regenerate', { accountId }, { admin: true })
  },
}
