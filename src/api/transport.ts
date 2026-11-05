import { appConfig } from '@/config/env'
import type { AdminSession, ApiError, UserSession } from './contract'
import { handleMockRequest } from '@/mock/handlers'
import { assertNoSensitive } from './projections'
import { getStorage } from '@/utils/storage'

export interface RequestOptions {
  /** 该接口返回普通用户数据，开发模式下追加敏感字段断言 */
  publicResponse?: boolean
  /** 管理端接口，携带管理员 token */
  admin?: boolean
}

interface PersistedSession<T> {
  session?: T | null
}

function currentUserToken(): string | undefined {
  return getStorage<PersistedSession<UserSession>>('user_session', {}).session?.token
}

function currentAdminToken(): string | undefined {
  return getStorage<PersistedSession<AdminSession>>('admin_session', {}).session?.token
}

function normalizeError(error: unknown): ApiError {
  if (error && typeof error === 'object' && 'message' in error) {
    const err = error as ApiError
    return { code: err.code ?? 500, message: String(err.message) }
  }

  return { code: 500, message: '网络异常，请稍后重试' }
}

export async function request<T>(
  path: string,
  payload: Record<string, unknown> = {},
  options: RequestOptions = {},
): Promise<T> {
  try {
    let data: T

    if (appConfig.mockMode) {
      data = await handleMockRequest<T>(path, payload, {
        token: currentUserToken(),
        adminToken: options.admin ? currentAdminToken() : undefined,
      })
    } else {
      data = await new Promise<T>((resolve, reject) => {
        uni.request({
          url: `${appConfig.baseURL}/${path}`,
          method: 'POST',
          data: payload,
          header: options.admin
            ? { Authorization: `Bearer ${currentAdminToken() ?? ''}` }
            : { Authorization: `Bearer ${currentUserToken() ?? ''}` },
          success: (response) => {
            if (response.statusCode >= 200 && response.statusCode < 300) {
              resolve(response.data as T)
              return
            }
            reject({ code: response.statusCode, message: '请求失败' })
          },
          fail: (error) => reject({ code: 500, message: error.errMsg }),
        })
      })
    }

    if (options.publicResponse) {
      assertNoSensitive(data, path)
    }

    return data
  } catch (error) {
    throw normalizeError(error)
  }
}

export function isApiError(error: unknown): error is ApiError {
  return Boolean(error && typeof error === 'object' && 'code' in error && 'message' in error)
}

export function toastError(error: unknown): void {
  const message = isApiError(error) ? error.message : '操作失败，请稍后重试'
  uni.showToast({ title: message, icon: 'none' })
}
