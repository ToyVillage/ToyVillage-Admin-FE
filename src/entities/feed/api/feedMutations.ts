import { api } from '@/shared/api/axios'
import type { FeedLogMessageResponse, FeedLogUpdateRequest } from './types'

export interface FeedUpdateInput extends FeedLogUpdateRequest {
  feedLogId: number
}

export interface FeedDeleteInput {
  feedLogId: number
}

// 관리자 급여일지 수정(`APP_FEED_LOG_UPDATE_ADMIN`, PUT `/feed-log/admin/{feedLogId}`).
// Notion 명세에 행이 없어 staging Swagger(`updateAdminFeedLog`)를 기준으로 연동했다.
export async function updateFeed({
  feedLogId,
  ...request
}: FeedUpdateInput): Promise<FeedLogMessageResponse> {
  assertFeedLogId(feedLogId)

  const { data } = await api.put<unknown>(
    `/feed-log/admin/${feedLogId}`,
    request,
  )

  if (!isMessageResponse(data)) {
    throw new Error('급여일지 수정 응답 형식이 올바르지 않습니다.')
  }

  return data
}

// 관리자 급여일지 삭제(`APP_FEED_LOG_DELETE_ADMIN`, DELETE `/feed-log/admin/{feedLogId}`).
// Notion 명세에 행이 없어 staging Swagger(`deleteFeedLog`)를 기준으로 연동했다.
// 성공 200 의 응답 본문은 명세에 없어 읽지 않는다.
export async function deleteFeed({
  feedLogId,
}: FeedDeleteInput): Promise<void> {
  assertFeedLogId(feedLogId)

  await api.delete(`/feed-log/admin/${feedLogId}`)
}

function assertFeedLogId(feedLogId: number) {
  if (!Number.isSafeInteger(feedLogId) || feedLogId <= 0) {
    throw new Error('급여 기록 id 가 올바르지 않습니다.')
  }
}

function isMessageResponse(value: unknown): value is FeedLogMessageResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).message === 'string'
  )
}
