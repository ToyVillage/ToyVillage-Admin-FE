import { api } from '@/shared/api/axios'
import { mockActivityDate, mockWorkLogs } from '../model/mock'
import type {
  FloorFiveFeedActivity,
  FloorFourFeedActivity,
  ObservationActivity,
  WorkLogActivity,
} from '../model/types'
import type {
  FeedUnitCode,
  FloorFiveFeedLogResponse,
  FloorFourFeedLogResponse,
  ObservationResponse,
} from './types'

// 전체 활동 전용 조회(staging Swagger `all-activities-controller`). 날짜(YYYY-MM-DD)만 받고 그날 기록 전체를 배열로 돌려준다.
// Notion 명세에 없어 Swagger 를 기준으로 연동했다.

export async function getFloorFourFeedActivities(
  date: string,
): Promise<FloorFourFeedActivity[]> {
  const feedLogs = await getActivityList(
    '/all-activities/feed-log/fourth-floor',
    date,
    isFloorFourFeedLog,
  )
  return (
    feedLogs
      .map((feedLog) => ({
        id: String(feedLog.feedLogId),
        commonName: feedLog.animalKind,
        individualName: feedLog.animalName,
        fedTime: feedLog.feedDateTime.slice(11, 16),
        feedType: feedLog.feedType,
        feedAmount: feedLog.feedAmount,
        remainingAmount: feedLog.remainingAmount,
        unit: feedLog.feedUnit,
        note: feedLog.significant ?? '',
        feederName: feedLog.staffName,
      }))
      // 서버 정렬 명세가 없어 급여시간 오름차순으로 맞춘다.
      .sort((left, right) => left.fedTime.localeCompare(right.fedTime))
  )
}

// 5층은 응답 순서(등록 순서)를 그대로 쓴다.
export async function getFloorFiveFeedActivities(
  date: string,
): Promise<FloorFiveFeedActivity[]> {
  const feedLogs = await getActivityList(
    '/all-activities/feed-log/fifth-floor',
    date,
    isFloorFiveFeedLog,
  )
  return feedLogs.map((feedLog) => ({
    id: String(feedLog.feedLogId),
    commonName: feedLog.animalKind,
    individualName: feedLog.animalName,
    feedType: feedLog.feedType,
    feedAmount: feedLog.feedAmount,
    unit: feedLog.feedUnit,
    feederName: feedLog.staffName,
  }))
}

export async function getObservationActivities(
  date: string,
): Promise<ObservationActivity[]> {
  const observations = await getActivityList(
    '/all-activities/animal-observation',
    date,
    isObservation,
  )
  return (
    observations
      .map((observation) => ({
        id: String(observation.animalObservationId),
        writtenTime: observation.createdAt.slice(11, 16),
        commonName: observation.animalKind,
        individualName: observation.animalName,
        title: observation.title,
        observerName: observation.authorName,
        attachmentCount: observation.fileCount,
      }))
      // 서버 정렬 명세가 없어 작성시간 오름차순으로 맞춘다.
      .sort((left, right) => left.writtenTime.localeCompare(right.writtenTime))
  )
}

// 업무일지는 `all-activities-controller` 에 API 가 없어 아직 퍼블리싱 mock 이다.
export async function getWorkLogActivities(
  date: string,
): Promise<WorkLogActivity[]> {
  const rows = date === mockActivityDate ? mockWorkLogs : []
  return [...rows].sort((left, right) =>
    left.writtenTime.localeCompare(right.writtenTime),
  )
}

async function getActivityList<Item>(
  path: string,
  date: string,
  isItem: (value: unknown) => value is Item,
): Promise<Item[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`조회 날짜 형식이 올바르지 않습니다: ${date}`)
  }

  const { data } = await api.get<unknown>(path, { params: { date } })
  if (!Array.isArray(data) || !data.every(isItem)) {
    throw new Error('전체 활동 조회 응답 형식이 올바르지 않습니다.')
  }
  return data
}

function isFeedLogBase(value: unknown): value is Record<string, unknown> {
  return (
    isRecord(value) &&
    typeof value.feedLogId === 'number' &&
    typeof value.staffName === 'string' &&
    typeof value.animalKind === 'string' &&
    typeof value.animalName === 'string' &&
    typeof value.animalDeleted === 'boolean' &&
    typeof value.feedType === 'string' &&
    typeof value.feedAmount === 'number' &&
    isFeedUnit(value.feedUnit)
  )
}

function isFloorFourFeedLog(value: unknown): value is FloorFourFeedLogResponse {
  return (
    isFeedLogBase(value) &&
    (value.remainingAmount === null ||
      typeof value.remainingAmount === 'number') &&
    isDateTime(value.feedDateTime) &&
    (value.significant === undefined ||
      value.significant === null ||
      typeof value.significant === 'string')
  )
}

function isFloorFiveFeedLog(value: unknown): value is FloorFiveFeedLogResponse {
  return isFeedLogBase(value)
}

function isObservation(value: unknown): value is ObservationResponse {
  return (
    isRecord(value) &&
    typeof value.animalObservationId === 'number' &&
    typeof value.animalManageId === 'number' &&
    typeof value.animalKind === 'string' &&
    typeof value.animalName === 'string' &&
    typeof value.animalDeleted === 'boolean' &&
    isDateTime(value.createdAt) &&
    typeof value.title === 'string' &&
    typeof value.authorName === 'string' &&
    typeof value.fileCount === 'number'
  )
}

function isDateTime(value: unknown): value is string {
  return (
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)
  )
}

function isFeedUnit(value: unknown): value is FeedUnitCode {
  return value === 'GML' || value === 'KGL'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
