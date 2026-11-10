import { appConfig } from '@/config/env'

export type UploadKind = 'image' | 'video'

/**
 * 媒体上传统一入口：mock 模式直接返回本地临时路径，真实模式走 uni.uploadFile。
 * 页面不直接调用 uni.uploadFile，便于后端接入时统一替换。
 */
export async function uploadMedia(filePath: string, kind: UploadKind = 'image'): Promise<string> {
  if (appConfig.mockMode) {
    return filePath
  }

  return new Promise<string>((resolve, reject) => {
    uni.uploadFile({
      url: `${appConfig.baseURL}/upload/${kind}`,
      filePath,
      name: 'file',
      success: (response) => {
        try {
          const data = JSON.parse(response.data) as { url?: string }
          if (data.url) {
            resolve(data.url)
            return
          }
          reject(new Error('上传返回缺少 url'))
        } catch (error) {
          reject(error)
        }
      },
      fail: (error) => reject(new Error(error.errMsg || '上传失败')),
    })
  })
}
