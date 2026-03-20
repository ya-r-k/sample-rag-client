/**
 * Feedback API — aligned with Demo RAG API spec.
 * POST /api/feedbacks — submit like/dislike. Idempotent per (messageId, user). Returns 204.
 */
import { apiPost } from './client'

export type FeedbackRequest = {
  messageId: string
  isLike: boolean
}

/** GetFeedbackByModel for POST /api/feedbacks/filter. */
export type GetFeedbackByModel = {
  lastId?: string
  batchSize?: number
  messageId?: string
}

export type FeedbackDto = {
  id?: string
  messageId: string
  userId?: string
  isLike: boolean
}

/** POST /api/feedbacks — submit like/dislike for a message. Returns 204. */
export async function submitFeedback(body: FeedbackRequest): Promise<void> {
  await apiPost<FeedbackRequest, unknown>('/api/feedbacks', body)
}

/** POST /api/feedbacks/filter — get feedback by filter. */
export async function getFeedbacksFilter(
  body: GetFeedbackByModel,
): Promise<FeedbackDto[]> {
  return apiPost<GetFeedbackByModel, FeedbackDto[]>('/api/feedbacks/filter', body)
}
