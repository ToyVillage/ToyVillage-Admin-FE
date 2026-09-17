import { isAxiosError } from 'axios'
import { api } from '@/shared/api/axios'
import { formatFeedAmount } from '../model/format'
import type {
  FeedHistoryRecord,
  FeedRecord,
  FeedRecordDetail,
} from '../model/types'
import type {
  FeedLogAdminDetailResponse,
  FeedLogHistoryResponse,
  FeedLogListResponse,
  FeedQueryAllRequest,
  FeedQueryRequest,
} from './types'
import { animalTaxonomics } from './types'

export interface FeedListPage {
  items: FeedRecord[]
  /** 총 페이지 수 */
  totalPageSize: number
}

// 목록은 날짜로 조회하고 분류 탭은 `animalTaxonomic` 으로 서버가 거른다.
// 표의 네 열이 모두 목록 응답에 있어 행별 추가 조회가 없다.
export async function getFeeds({
  date,
  animalTaxonomic = null,
  page,
  size,
}: FeedQueryAllRequest): Promise<FeedListPage> {
  assertIsoDate(date)
  assertPaging(page, size)

  const { data } = await api.get<unknown>('/feed-log/admin', {
    params: {
      date,
      animalTaxonomic: animalTaxonomic ?? undefined,
      page,
      size,
    },
  })

  if (!isFeedLogListResponse(data)) {
    throw new Error('급여 목록 조회 응답 형식이 올바르지 않습니다.')
  }

  return {
    items: data.feedLogs.map((item) => {
      const { fedDate, fedTime } = splitFeedDateTime(item.feedDateTime)

      return {
        id: String(item.feedLogId),
        animalType: item.animalKind,
        animalName: item.animalName,
        feedType: item.feedType,
        feedAmount: formatFeedAmount(item.feedAmount),
        feederName: item.staffName,
        fedDate,
        fedTime,
      }
    }),
    totalPageSize: data.totalPageSize,
  }
}

/** 지워졌거나 없는 급여 기록은 404 다. 그 외 실패(500·네트워크)와 구분한다. */
export function isFeedNotFoundError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404
}

// 상세는 급여 기록 한 건과 그 개체의 급여 이력이다.
export async function getFeedDetail({
  feedLogId,
}: FeedQueryRequest): Promise<FeedRecordDetail> {
  assertFeedLogId(feedLogId)

  const { data } = await api.get<unknown>(`/feed-log/admin/${feedLogId}`)

  if (!isFeedLogAdminDetailResponse(data)) {
    throw new Error('급여 상세 조회 응답 형식이 올바르지 않습니다.')
  }

  // 이력이 없거나(404) 이력 조회만 실패해도 급여 기록 본문은 보여준다.
  const history = await getFeedHistory(data.animalId).catch(() => [])
  const { fedDate, fedTime } = splitFeedDateTime(data.feedDateTime)

  return {
    id: String(feedLogId),
    animalManageId: data.animalId,
    animalType: data.animalKind,
    animalName: data.animalName,
    feedType: data.feedType,
    feedAmount: formatFeedAmount(data.feedAmount),
    feederName: data.staffName,
    fedDate,
    fedTime,
    note: data.significant ?? '',
    // `animalImageUrl` 은 `fileName`·`fileKey` 뿐이라 표시할 URL 이 없다.
    animalPhotoUrl: undefined,
    history,
  }
}

async function getFeedHistory(
  animalManageId: number,
): Promise<FeedHistoryRecord[]> {
  const { data } = await api.get<unknown>(
    `/feed-log/admin/history/${animalManageId}`,
  )

  if (!isFeedLogHistoryResponse(data)) {
    throw new Error('급여 이력 조회 응답 형식이 올바르지 않습니다.')
  }

  return data.feedLogs
    .map((item) => {
      const { fedDate, fedTime } = splitFeedDateTime(item.feedDateTime)

      return {
        record: {
          id: String(item.feedLogId),
          fedDate,
          fedTime,
          feederName: item.staffName,
          feedType: item.feedType,
          feedAmount: formatFeedAmount(item.feedAmount),
          note: item.significant ?? '',
        },
        feedDateTime: item.feedDateTime,
      }
    })
    // 최신 급여가 위로 온다(서버 정렬 명세 없음).
    // 오프셋이 붙은 값과 안 붙은 값이 섞여도 되도록 시각으로 견준다.
    .sort((left, right) => toEpoch(right.feedDateTime) - toEpoch(left.feedDateTime))
    .map((item) => item.record)
}

/**
 * `2026-09-16T09:30:00` → `2026-09-16` + `09:30`.
 * `Z` 나 `+09:00` 처럼 오프셋이 붙어 오면 현지 시각으로 바꾼다.
 * 오프셋이 없으면 이미 현지 시각이므로 문자열을 그대로 자른다.
 */
function splitFeedDateTime(feedDateTime: string): {
  fedDate: string
  fedTime: string
} {
  if (hasUtcOffset(feedDateTime)) {
    const parsed = new Date(feedDateTime)

    if (!Number.isNaN(parsed.getTime())) {
      const year = parsed.getFullYear()
      const month = pad(parsed.getMonth() + 1)
      const day = pad(parsed.getDate())
      return {
        fedDate: `${year}-${month}-${day}`,
        fedTime: `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`,
      }
    }
  }

  const [date, time = ''] = feedDateTime.split('T')
  return { fedDate: date, fedTime: time.slice(0, 5) }
}

/** 정렬용 시각. 파싱할 수 없으면 가장 뒤로 보낸다. */
function toEpoch(feedDateTime: string): number {
  const parsed = new Date(feedDateTime).getTime()
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed
}

function hasUtcOffset(value: string): boolean {
  return /(?:Z|[+-]\d{2}:?\d{2})$/.test(value)
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function assertIsoDate(date: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('급여 조회 날짜 형식이 올바르지 않습니다.')
  }
}

function assertPaging(page: number, size: number): void {
  if (!Number.isSafeInteger(page) || page < 0) {
    throw new Error('페이지 번호가 올바르지 않습니다.')
  }

  if (!Number.isSafeInteger(size) || size <= 0) {
    throw new Error('페이지 크기가 올바르지 않습니다.')
  }
}

function assertFeedLogId(feedLogId: number): void {
  if (!Number.isSafeInteger(feedLogId) || feedLogId <= 0) {
    throw new Error('급여 기록 ID가 올바르지 않습니다.')
  }
}

// 특이사항은 명세에 필수 표기가 없다. 값이 없으면 null 로 오므로 빈 문자열로 읽는다.
function isNullableString(value: unknown): boolean {
  return value === null || value === undefined || typeof value === 'string'
}

function isFeedLogListResponse(value: unknown): value is FeedLogListResponse {
  if (typeof value !== 'object' || value === null) return false

  const response = value as Record<string, unknown>

  return (
    Array.isArray(response.feedLogs) &&
    response.feedLogs.every((item) => {
      if (typeof item !== 'object' || item === null) return false

      const feedLog = item as Record<string, unknown>
      return (
        Number.isInteger(feedLog.feedLogId) &&
        typeof feedLog.staffName === 'string' &&
        typeof feedLog.animalKind === 'string' &&
        typeof feedLog.animalName === 'string' &&
        typeof feedLog.feedType === 'string' &&
        typeof feedLog.feedAmount === 'number' &&
        typeof feedLog.feedDateTime === 'string'
      )
    }) &&
    Number.isInteger(response.totalPageSize)
  )
}

function isFeedLogAdminDetailResponse(
  value: unknown,
): value is FeedLogAdminDetailResponse {
  if (typeof value !== 'object' || value === null) return false

  const detail = value as Record<string, unknown>

  return (
    Number.isInteger(detail.animalId) &&
    typeof detail.staffName === 'string' &&
    typeof detail.animalKind === 'string' &&
    typeof detail.animalName === 'string' &&
    typeof detail.feedType === 'string' &&
    typeof detail.feedAmount === 'number' &&
    typeof detail.feedDateTime === 'string' &&
    isNullableString(detail.significant)
  )
}

function isFeedLogHistoryResponse(
  value: unknown,
): value is FeedLogHistoryResponse {
  if (typeof value !== 'object' || value === null) return false

  const response = value as Record<string, unknown>

  return (
    Array.isArray(response.feedLogs) &&
    response.feedLogs.every((item) => {
      if (typeof item !== 'object' || item === null) return false

      const feedLog = item as Record<string, unknown>
      return (
        Number.isInteger(feedLog.feedLogId) &&
        typeof feedLog.staffName === 'string' &&
        typeof feedLog.feedType === 'string' &&
        typeof feedLog.feedAmount === 'number' &&
        typeof feedLog.feedDateTime === 'string' &&
        isNullableString(feedLog.significant)
      )
    })
  )
}

export { animalTaxonomics }
