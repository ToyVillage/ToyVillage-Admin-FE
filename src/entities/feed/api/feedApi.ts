import { api } from '@/shared/api/axios'
import { formatFeedAmount } from '../model/format'
import type {
  FeedHistoryRecord,
  FeedRecord,
  FeedRecordDetail,
} from '../model/types'
import type {
  FeedLogAdminDetailResponse,
  FeedLogListResponse,
  FeedQueryAllRequest,
  FeedQueryRequest,
} from './types'

// 프론트는 admin 3개(`/feed-log/admin`, `/feed-log/admin/{feedLogId}`,
// `/feed-log/admin/history/{animalManageId}`)만 쓴다.
// 목록(`FeedLogResponse`)은 `feedId`·`animalKind`·`animalName` 만 주고
// 표의 `먹이 종류 · 급여량`·`급여자`·`급여일시` 는 상세에만 있어 행마다 상세를 더 부른다.
export async function getFeeds({
  date,
}: FeedQueryAllRequest): Promise<FeedRecord[]> {
  assertIsoDate(date)

  const { data } = await api.get<unknown>('/feed-log/admin', {
    params: { date },
  })

  if (!isFeedLogListResponse(data)) {
    throw new Error('급여 목록 조회 응답 형식이 올바르지 않습니다.')
  }

  const details = await Promise.all(
    data.feedLogs.map((item) => getAdminFeedLog(item.feedId)),
  )

  return details.map((detail, index) =>
    toFeedRecord(data.feedLogs[index].feedId, detail),
  )
}

// 상세 화면은 급여 기록 + 그 개체의 급여 이력이다.
export async function getFeedDetail({
  feedLogId,
}: FeedQueryRequest): Promise<FeedRecordDetail> {
  assertFeedLogId(feedLogId)

  const admin = await getAdminFeedLog(feedLogId)
  const history = await getFeedHistory(admin.animalId)

  return {
    ...toFeedRecord(feedLogId, admin),
    animalManageId: admin.animalId,
    // 특이사항(`significant`)은 admin 상세 응답에 없다.
    note: '',
    history,
  }
}

async function getAdminFeedLog(
  feedLogId: number,
): Promise<FeedLogAdminDetailResponse> {
  assertFeedLogId(feedLogId)

  const { data } = await api.get<unknown>(`/feed-log/admin/${feedLogId}`)

  if (!isFeedLogAdminDetailResponse(data)) {
    throw new Error('급여 상세 조회 응답 형식이 올바르지 않습니다.')
  }

  return data
}

// 급여 이력 표도 목록과 같은 3개 필드만 받아 행마다 상세를 더 부른다.
async function getFeedHistory(
  animalManageId: number,
): Promise<FeedHistoryRecord[]> {
  const { data } = await api.get<unknown>(
    `/feed-log/admin/history/${animalManageId}`,
  )

  if (!isFeedLogListResponse(data)) {
    throw new Error('급여 이력 조회 응답 형식이 올바르지 않습니다.')
  }

  const records = await Promise.all(
    data.feedLogs.map(async ({ feedId }) => {
      const detail = await getAdminFeedLog(feedId)
      const { fedDate, fedTime } = splitFeedDateTime(detail.feedDateTime)

      return {
        record: {
          id: String(feedId),
          fedDate,
          fedTime,
          feederName: detail.name,
          feedType: detail.feedType,
          feedAmount: formatFeedAmount(detail.feedAmount),
          // 특이사항(`significant`)은 admin 상세 응답에 없다.
          note: '',
        },
        feedDateTime: detail.feedDateTime,
      }
    }),
  )

  // 최신 급여가 위로 온다(서버 정렬 명세 없음).
  return records
    .sort((left, right) => right.feedDateTime.localeCompare(left.feedDateTime))
    .map((item) => item.record)
}

function toFeedRecord(
  feedId: number,
  detail: FeedLogAdminDetailResponse,
): FeedRecord {
  const { fedDate, fedTime } = splitFeedDateTime(detail.feedDateTime)

  return {
    id: String(feedId),
    animalType: detail.animalKind,
    animalName: detail.animalName,
    feedType: detail.feedType,
    feedAmount: formatFeedAmount(detail.feedAmount),
    feederName: detail.name,
    fedDate,
    fedTime,
  }
}

/** `2026-09-16T09:30:00` → `2026-09-16` + `09:30` */
function splitFeedDateTime(feedDateTime: string): {
  fedDate: string
  fedTime: string
} {
  const [date, time = ''] = feedDateTime.split('T')
  return { fedDate: date, fedTime: time.slice(0, 5) }
}

function assertIsoDate(date: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('급여 조회 날짜 형식이 올바르지 않습니다.')
  }
}

function assertFeedLogId(feedLogId: number): void {
  if (!Number.isSafeInteger(feedLogId) || feedLogId <= 0) {
    throw new Error('급여 기록 ID가 올바르지 않습니다.')
  }
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
        Number.isInteger(feedLog.feedId) &&
        typeof feedLog.animalKind === 'string' &&
        typeof feedLog.animalName === 'string'
      )
    })
  )
}

function isFeedLogAdminDetailResponse(
  value: unknown,
): value is FeedLogAdminDetailResponse {
  if (typeof value !== 'object' || value === null) return false

  const detail = value as Record<string, unknown>

  return (
    Number.isInteger(detail.animalId) &&
    typeof detail.name === 'string' &&
    typeof detail.animalKind === 'string' &&
    typeof detail.animalName === 'string' &&
    typeof detail.feedType === 'string' &&
    Number.isInteger(detail.feedAmount) &&
    typeof detail.feedDateTime === 'string'
  )
}
