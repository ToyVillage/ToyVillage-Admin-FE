import { api } from '@/shared/api/axios'
import type {
  DashboardFeed,
  DashboardKpi,
  DashboardObservation,
  DashboardTaskStatusCounts,
} from '../model/types'
import type {
  DashboardAnimalObservationItemResponse,
  DashboardCountQueryResponse,
  DashboardFeedLogItemResponse,
  DashboardOverallOperationsQueryResponse,
  DashboardPageRequest,
  DashboardPageResponse,
} from './types'

// DASHBOARD_COUNT_QUERY
export async function getDashboardCounts(): Promise<DashboardKpi> {
  const { data } = await api.get<unknown>('/dashboard/count')

  if (!isCountResponse(data)) {
    throw new Error('대시보드 집계 응답 형식이 올바르지 않습니다.')
  }

  return {
    feeds: data.feedLogCount,
    individuals: data.animalCount,
    taskReports: data.workReportCount,
    workLogs: data.workLogCount,
  }
}

// DASHBOARD_OVERALL_OPERATIONS_QUERY — 도넛은 세 상태의 합(= TOTAL)으로 그린다.
export async function getDashboardTaskStatusCounts(): Promise<DashboardTaskStatusCounts> {
  const { data } = await api.get<unknown>('/dashboard/overall-operations')

  if (!isOverallOperationsResponse(data)) {
    throw new Error('대시보드 업무 현황 응답 형식이 올바르지 않습니다.')
  }

  return {
    COMPLETED: data.COMPLETED,
    IN_PROGRESS: data.IN_PROGRESS,
    EXPIRED: data.EXPIRED,
  }
}

// DASHBOARD_FEED_LOG_QUERY_ALL — 정렬은 서버 기본값(feedDateTime,desc)을 쓴다.
// 항목에 식별자가 없어 순번을 key 로 쓴다.
export async function getDashboardFeeds({
  page,
  size,
}: DashboardPageRequest): Promise<DashboardFeed[]> {
  assertPaging(page, size)

  const { data } = await api.get<unknown>('/dashboard/feed-logs', {
    params: { page, size },
  })

  if (!isPageResponse(data, isFeedLogItem)) {
    throw new Error('대시보드 급여일지 응답 형식이 올바르지 않습니다.')
  }

  return data.content.map((item, index) => ({
    id: String(index),
    species: item.animalKind,
    animalName: item.animalName,
    fedAt: item.feedDateTime,
  }))
}

// DASHBOARD_ANIMAL_OBSERVATION_QUERY_ALL — 정렬은 서버 기본값(createdAt,desc)을 쓴다.
export async function getDashboardObservations({
  page,
  size,
}: DashboardPageRequest): Promise<DashboardObservation[]> {
  assertPaging(page, size)

  const { data } = await api.get<unknown>('/dashboard/animal-observations', {
    params: { page, size },
  })

  if (!isPageResponse(data, isAnimalObservationItem)) {
    throw new Error('대시보드 관찰 기록 응답 형식이 올바르지 않습니다.')
  }

  return data.content.map((item, index) => ({
    id: String(index),
    content: item.title,
    recordedAt: item.createdAt,
  }))
}

function assertPaging(page: number, size: number): void {
  if (!Number.isSafeInteger(page) || page < 1) {
    throw new Error('페이지 번호가 올바르지 않습니다.')
  }

  if (!Number.isSafeInteger(size) || size <= 0) {
    throw new Error('페이지 크기가 올바르지 않습니다.')
  }
}

function isCountResponse(value: unknown): value is DashboardCountQueryResponse {
  return hasCounts(value, [
    'feedLogCount',
    'animalCount',
    'workReportCount',
    'workLogCount',
  ])
}

function isOverallOperationsResponse(
  value: unknown,
): value is DashboardOverallOperationsQueryResponse {
  return hasCounts(value, ['TOTAL', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED'])
}

function isPageResponse<T>(
  value: unknown,
  isItem: (item: unknown) => item is T,
): value is DashboardPageResponse<T> {
  if (!isRecord(value)) return false

  return (
    Array.isArray(value.content) &&
    value.content.every(isItem) &&
    hasCounts(value, [
      'totalPages',
      'totalElements',
      'size',
      'number',
      'numberOfElements',
    ]) &&
    typeof value.first === 'boolean' &&
    typeof value.last === 'boolean' &&
    typeof value.empty === 'boolean'
  )
}

function isFeedLogItem(value: unknown): value is DashboardFeedLogItemResponse {
  return (
    isRecord(value) &&
    typeof value.animalKind === 'string' &&
    typeof value.animalName === 'string' &&
    typeof value.feedDateTime === 'string'
  )
}

function isAnimalObservationItem(
  value: unknown,
): value is DashboardAnimalObservationItemResponse {
  return (
    isRecord(value) &&
    typeof value.title === 'string' &&
    typeof value.createdAt === 'string'
  )
}

function hasCounts(value: unknown, keys: string[]): boolean {
  return (
    isRecord(value) &&
    keys.every((key) => {
      const count = value[key]
      return Number.isSafeInteger(count) && (count as number) >= 0
    })
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
