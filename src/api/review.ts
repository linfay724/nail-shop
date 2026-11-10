import type { ReviewMedia, ReviewPage } from './contract'
import { request } from './transport'

export interface CreateReviewPayload {
  orderId: string
  rating: number
  content: string
  media: ReviewMedia[]
}

export const reviewApi = {
  listByProduct(productId: string, page = 1, pageSize = 5): Promise<ReviewPage> {
    return request<ReviewPage>(
      'review/list',
      { productId, page, pageSize },
      { publicResponse: true },
    )
  },
  create(payload: CreateReviewPayload): Promise<unknown> {
    return request('review/create', { ...payload })
  },
}
