import type { UserSession } from './contract'
import { request } from './transport'

export const userApi = {
  login(payload: { nickname?: string; phone?: string } = {}): Promise<UserSession> {
    return request<UserSession>('user/login', payload)
  },
  session(token: string): Promise<UserSession> {
    return request<UserSession>('user/session', { token })
  },
  logout(): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('user/logout')
  },
}
