import { api } from '@/shared/api/axios'
import { formatFeedAmount } from '../model/format'
import type {
  AnimalSpecies,
  FeedHistoryRecord,
  FeedRecord,
  FeedRecordDetail,
} from '../model/types'
import {
  animalTaxonomics,
  type AnimalManageQueryResponse,
  type AnimalTaxonomic,
  type FeedLogAdminDetailResponse,
  type FeedLogCreateRequest,
  type FeedLogDetailResponse,
  type FeedLogListResponse,
  type FeedLogMessageResponse,
  type FeedLogRequest,
  type FeedLogUpdateRequest,
  type FeedQueryAllRequest,
  type FeedQueryRequest,
} from './types'

// OpenAPI 의 `animalTaxonomic` enum → 목록 탭·상세 배지 라벨.
const speciesByTaxonomic: Record<AnimalTaxonomic, AnimalSpecies> = {
  MAMMALS: '포유류',
  REPTILES: '파충류',
  BIRDS: '조류',
  FISH: '어류',
}

// 명세상 목록(`FeedLogResponse`)은 `feedId`·`animalKind`·`animalName` 만 준다.
// 표의 `먹이 종류 · 급여량`·`급여자`·`급여일시` 는 상세에만 있어 행마다 상세를 더 부른다.
// 분류(`animalTaxonomic`)는 feed-log 어디에도 없어 개체 조회로 채운 뒤 여기서 거른다.
// 서버에 분류 필터가 없으므로 요청은 `date` 하나뿐이다.
export async function getFeeds({
  date,
  species = null,
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
  const speciesByAnimalId = await getSpeciesByAnimalId(
    details.map((detail) => detail.animalId),
  )

  const records = details.map((detail, index) =>
    toFeedRecord(data.feedLogs[index].feedId, detail, speciesByAnimalId),
  )

  return species == null
    ? records
    : records.filter((record) => record.species === species)
}

// 상세 화면은 급여 기록 + 그 개체의 급여 이력이다.
// 특이사항은 `GET /feed-log/{feedLogId}` 에만 있어 관리자 상세와 함께 부른다.
export async function getFeedDetail({
  feedLogId,
}: FeedQueryRequest): Promise<FeedRecordDetail> {
  assertFeedLogId(feedLogId)

  const admin = await getAdminFeedLog(feedLogId)
  const [own, speciesByAnimalId, history] = await Promise.all([
    getOwnFeedLog(feedLogId),
    getSpeciesByAnimalId([admin.animalId]),
    getFeedHistory(admin.animalId),
  ])

  return {
    ...toFeedRecord(feedLogId, admin, speciesByAnimalId),
    animalManageId: admin.animalId,
    note: own.significant,
    // 개체 사진: `FileResponse` 는 `fileName`·`fileKey` 뿐이고 파일 URL 규약이 없어 비워 둔다.
    animalPhotoUrl: undefined,
    history,
  }
}

export async function createFeedLog({
  animalManageId,
  input,
}: FeedLogCreateRequest): Promise<void> {
  assertAnimalManageId(animalManageId)
  assertFeedLogRequest(input)

  await api.post(`/feed-log/${animalManageId}`, input)
}

export async function updateFeedLog({
  feedLogId,
  input,
}: FeedLogUpdateRequest): Promise<FeedLogMessageResponse> {
  assertFeedLogId(feedLogId)
  assertFeedLogRequest(input)

  const { data } = await api.put<unknown>(`/feed-log/${feedLogId}`, input)

  if (!isMessageResponse(data)) {
    throw new Error('급여 기록 수정 응답 형식이 올바르지 않습니다.')
  }

  return data
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

async function getOwnFeedLog(
  feedLogId: number,
): Promise<FeedLogDetailResponse> {
  const { data } = await api.get<unknown>(`/feed-log/${feedLogId}`)

  if (!isFeedLogDetailResponse(data)) {
    throw new Error('급여 특이사항 조회 응답 형식이 올바르지 않습니다.')
  }

  return data
}

// 급여 이력 표는 `급여일시 · 급여자 · 먹이 종류 · 급여량 · 특이사항` 인데
// history 응답은 목록과 같은 3개 필드뿐이라 행마다 상세 두 곳을 합친다.
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
      const [admin, own] = await Promise.all([
        getAdminFeedLog(feedId),
        getOwnFeedLog(feedId),
      ])

      const { fedDate, fedTime } = splitFeedDateTime(admin.feedDateTime)

      return {
        record: {
          id: String(feedId),
          fedDate,
          fedTime,
          feederName: admin.name,
          feedType: admin.feedType,
          feedAmount: formatFeedAmount(admin.feedAmount),
          note: own.significant,
        },
        feedDateTime: admin.feedDateTime,
      }
    }),
  )

  // 최신 급여가 위로 온다(서버 정렬 명세 없음).
  return records
    .sort((left, right) => right.feedDateTime.localeCompare(left.feedDateTime))
    .map((item) => item.record)
}

// 개체 분류는 개체 조회에만 있다. 같은 개체가 여러 번 급여됐으면 한 번만 부른다.
async function getSpeciesByAnimalId(
  animalIds: number[],
): Promise<Map<number, AnimalSpecies>> {
  const uniqueIds = [...new Set(animalIds)]

  const animals = await Promise.all(
    uniqueIds.map(async (animalManageId) => {
      const { data } = await api.get<unknown>(
        `/animal-manage/${animalManageId}`,
      )

      if (!isAnimalManageQueryResponse(data)) {
        throw new Error('개체 조회 응답 형식이 올바르지 않습니다.')
      }

      return data
    }),
  )

  return new Map(
    animals.map((animal: AnimalManageQueryResponse) => [
      animal.animalManageId,
      speciesByTaxonomic[animal.animalTaxonomic],
    ]),
  )
}

function toFeedRecord(
  feedId: number,
  detail: FeedLogAdminDetailResponse,
  speciesByAnimalId: Map<number, AnimalSpecies>,
): FeedRecord {
  const species = speciesByAnimalId.get(detail.animalId)

  if (!species) {
    throw new Error('급여 기록의 개체 분류를 확인하지 못했습니다.')
  }

  const { fedDate, fedTime } = splitFeedDateTime(detail.feedDateTime)

  return {
    id: String(feedId),
    species,
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

function assertAnimalManageId(animalManageId: number): void {
  if (!Number.isSafeInteger(animalManageId) || animalManageId <= 0) {
    throw new Error('개체 ID가 올바르지 않습니다.')
  }
}

// 명세상 필수는 `feedDateTime`·`feedType` 이고 `feedAmount` 는 int32 다.
function assertFeedLogRequest(input: FeedLogRequest): void {
  if (!input.feedDateTime) {
    throw new Error('급여일시를 입력해 주세요.')
  }

  if (input.feedType.trim().length === 0) {
    throw new Error('먹이 종류를 입력해 주세요.')
  }

  if (
    input.feedAmount !== undefined &&
    (!Number.isSafeInteger(input.feedAmount) || input.feedAmount < 0)
  ) {
    throw new Error('급여량이 올바르지 않습니다.')
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

function isFeedLogDetailResponse(
  value: unknown,
): value is FeedLogDetailResponse {
  if (typeof value !== 'object' || value === null) return false

  const detail = value as Record<string, unknown>

  return (
    Number.isInteger(detail.feedLogId) && typeof detail.significant === 'string'
  )
}

function isAnimalManageQueryResponse(
  value: unknown,
): value is AnimalManageQueryResponse {
  if (typeof value !== 'object' || value === null) return false

  const animal = value as Record<string, unknown>

  return (
    Number.isInteger(animal.animalManageId) &&
    animalTaxonomics.some((taxonomic) => taxonomic === animal.animalTaxonomic)
  )
}

function isMessageResponse(value: unknown): value is FeedLogMessageResponse {
  if (typeof value !== 'object' || value === null) return false

  return typeof (value as Record<string, unknown>).message === 'string'
}
