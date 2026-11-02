import { api } from '@/shared/api/axios'
import type {
  FeedHistoryRecord,
  FeedRecord,
  FeedRecordDetail,
} from '../model/types'
import { isFeedNotFoundError, type FeedListPage } from './feedApi'
import type {
  FeedLogMessageResponse,
  FifthFloorFeedLogDetailResponse,
  FifthFloorFeedLogHistoryResponse,
  FifthFloorFeedLogListItemResponse,
  FifthFloorFeedLogListResponse,
  FifthFloorFeedLogUpdateRequest,
} from './types'

// 5층 급여일지(staging Swagger tag `fifth-floor-feed-log-controller`). Notion 명세에 없어 Swagger 를 기준으로 연동했다.
// 5층은 급여 날짜만 있고 잔량·특이사항·급여 시각이 없다.

// 5층 급여 목록(`APP_FIFTH_FLOOR_FEED_LOG_QUERY_ALL_ADMIN_BY_DATE`, GET `/feed-log/fifth-floor/admin`).
// 4층 목록과 같이 page 는 1부터, 분류·정렬은 보내지 않는다.
export async function getFifthFloorFeeds({
  date,
  page,
  size,
}: {
  date: string
  page: number
  size: number
}): Promise<FeedListPage> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('급여 조회 날짜 형식이 올바르지 않습니다.')
  }

  const { data } = await api.get<unknown>('/feed-log/fifth-floor/admin', {
    params: { date, page, size },
  })

  if (!isListResponse(data)) {
    throw new Error('5층 급여 목록 조회 응답 형식이 올바르지 않습니다.')
  }

  return {
    items: data.feedLogs.map(toRecord),
    totalPageSize: data.totalPageSize,
  }
}

// 5층 급여 기록 상세(`APP_FIFTH_FLOOR_FEED_LOG_QUERY_ADMIN`, GET `/feed-log/fifth-floor/admin/{feedLogId}`).
// 없는 기록은 404 로 실패한다(`isFeedNotFoundError`).
export async function getFifthFloorFeedDetail({
  feedLogId,
}: {
  feedLogId: number
}): Promise<FeedRecordDetail> {
  assertPositiveId(feedLogId)

  const { data } = await api.get<unknown>(
    `/feed-log/fifth-floor/admin/${feedLogId}`,
  )

  if (!isDetailResponse(data)) {
    throw new Error('5층 급여 상세 조회 응답 형식이 올바르지 않습니다.')
  }

  return {
    ...toRecord({ ...data, feedLogId }),
    animalManageId: data.animalId,
    // 수정 요청은 화면에서 바꿀 수 없는 급여 날짜를 원본 그대로 보낸다.
    fedAtValue: data.feedDate,
  }
}

// 5층 개체별 급여 이력(`APP_FIFTH_FLOOR_FEED_LOG_QUERY_HISTORY_ADMIN`,
// GET `/feed-log/fifth-floor/admin/history/{animalManageId}`). 최신 급여가 맨 앞이다.
// 4층 이력과 같이 404 는 이력 없음(빈 배열)으로 보고, 그 밖의 실패는 그대로 올린다.
export async function getFifthFloorFeedHistory(
  animalManageId: number,
): Promise<FeedHistoryRecord[]> {
  assertPositiveId(animalManageId)

  const data = await api
    .get<unknown>(`/feed-log/fifth-floor/admin/history/${animalManageId}`)
    .then((response) => response.data)
    .catch((error: unknown) => {
      if (isFeedNotFoundError(error)) return { feedLogs: [] }
      throw error
    })

  if (!isHistoryResponse(data)) {
    throw new Error('5층 급여 이력 조회 응답 형식이 올바르지 않습니다.')
  }

  return (
    data.feedLogs
      .map((item): FeedHistoryRecord => ({
        id: String(item.feedLogId),
        floor: '5',
        feedType: item.feedType,
        feedAmount: item.feedAmount,
        remainingAmount: null,
        unit: item.feedUnit,
        note: '',
        feederName: item.staffName,
        fedDate: item.feedDate,
        fedTime: '',
      }))
      // 서버 정렬 명세가 없어 날짜 내림차순으로 맞춘다. 같은 날은 응답 순서를 지킨다(안정 정렬).
      .sort((left, right) => right.fedDate.localeCompare(left.fedDate))
  )
}

// 5층 급여일지 수정(`APP_FIFTH_FLOOR_FEED_LOG_UPDATE_ADMIN`, PUT `/feed-log/fifth-floor/admin/{feedLogId}`).
export async function updateFifthFloorFeed({
  feedLogId,
  ...request
}: FifthFloorFeedLogUpdateRequest & {
  feedLogId: number
}): Promise<FeedLogMessageResponse> {
  assertPositiveId(feedLogId)

  const { data } = await api.put<unknown>(
    `/feed-log/fifth-floor/admin/${feedLogId}`,
    request,
  )

  if (!isMessageResponse(data)) {
    throw new Error('5층 급여일지 수정 응답 형식이 올바르지 않습니다.')
  }

  return data
}

// 5층 급여일지 삭제(`APP_FIFTH_FLOOR_FEED_LOG_DELETE_ADMIN`, DELETE `/feed-log/fifth-floor/admin/{feedLogId}`).
// 성공 200 의 응답 본문은 명세에 없어 읽지 않는다.
export async function deleteFifthFloorFeed({
  feedLogId,
}: {
  feedLogId: number
}): Promise<void> {
  assertPositiveId(feedLogId)

  await api.delete(`/feed-log/fifth-floor/admin/${feedLogId}`)
}

function toRecord(item: FifthFloorFeedLogListItemResponse): FeedRecord {
  return {
    id: String(item.feedLogId),
    floor: '5',
    animalType: item.animalKind,
    animalName: item.animalName,
    feedType: item.feedType,
    feedAmount: item.feedAmount,
    remainingAmount: null,
    unit: item.feedUnit,
    note: '',
    feederName: item.staffName,
    fedDate: item.feedDate,
    fedTime: '',
  }
}

function assertPositiveId(id: number): void {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('5층 급여 id 가 올바르지 않습니다.')
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isUnit(value: unknown): boolean {
  return value === 'GML' || value === 'KGL'
}

// 급여 기록 공통 필드(목록 항목·상세·이력 항목).
function hasFeedFields(item: Record<string, unknown>): boolean {
  return (
    typeof item.staffName === 'string' &&
    typeof item.feedType === 'string' &&
    typeof item.feedAmount === 'number' &&
    isUnit(item.feedUnit) &&
    typeof item.feedDate === 'string'
  )
}

function hasAnimalFields(item: Record<string, unknown>): boolean {
  return (
    typeof item.animalKind === 'string' &&
    typeof item.animalName === 'string' &&
    typeof item.animalDeleted === 'boolean'
  )
}

function isListResponse(
  value: unknown,
): value is FifthFloorFeedLogListResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.feedLogs) &&
    value.feedLogs.every(
      (item) =>
        isRecord(item) &&
        Number.isInteger(item.feedLogId) &&
        hasAnimalFields(item) &&
        hasFeedFields(item),
    ) &&
    Number.isInteger(value.totalPageSize)
  )
}

function isDetailResponse(
  value: unknown,
): value is FifthFloorFeedLogDetailResponse {
  return (
    isRecord(value) &&
    Number.isInteger(value.animalId) &&
    hasAnimalFields(value) &&
    hasFeedFields(value)
  )
}

function isHistoryResponse(
  value: unknown,
): value is FifthFloorFeedLogHistoryResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.feedLogs) &&
    value.feedLogs.every(
      (item) =>
        isRecord(item) &&
        Number.isInteger(item.feedLogId) &&
        hasFeedFields(item),
    )
  )
}

function isMessageResponse(value: unknown): value is FeedLogMessageResponse {
  return isRecord(value) && typeof value.message === 'string'
}
