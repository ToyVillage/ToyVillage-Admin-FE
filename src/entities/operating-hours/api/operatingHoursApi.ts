import { api } from '@/shared/api/axios'
import type { OperatingHours } from '../model/types'
import type {
  OpenTimeCreateRequest,
  OpenTimeCreateResponse,
  OpenTimeQueryByDateRequest,
  OpenTimeQueryByDateResponse,
  OpenTimeQueryByDateResponseItem,
  OpenTimeUpdateRequest,
  OpenTimeUpdateResponse,
} from './types'

export interface SaveOperatingHoursInput {
  date: string
  /** 24시간제 HH:mm */
  opensAt: string
  /** 24시간제 HH:mm */
  closesAt: string
}

export async function getOperatingHoursByDate({
  date,
}: OpenTimeQueryByDateRequest): Promise<OperatingHours> {
  if (!isDateKey(date)) {
    throw new Error('운영시간 날짜별 조회 요청 날짜가 올바르지 않습니다.')
  }

  const { data, status } = await api.get<unknown>('/open-time/date', {
    params: { date },
  })

  if (status !== 200) {
    throw new Error('운영시간 날짜별 조회 응답 상태가 올바르지 않습니다.')
  }

  if (!isOpenTimeQueryByDateResponse(data) || data.length === 0) {
    throw new Error('운영시간 날짜별 조회 응답 형식이 올바르지 않습니다.')
  }

  const [hours] = data

  return {
    id: hours.id,
    date: hours.openDate,
    opensAt: hours.startOpenTime,
    closesAt: hours.endOpenTime,
  }
}

// OPEN_TIME_CREATE — 그 날짜에 저장값이 없을 때(조회 id 가 null) 쓴다.
export async function createOperatingHours({
  date,
  opensAt,
  closesAt,
}: SaveOperatingHoursInput): Promise<OpenTimeCreateResponse> {
  const request: OpenTimeCreateRequest = {
    openDate: assertDateKey(date),
    startOpenTime: `${assertHourMinute(opensAt)}:00`,
    endOpenTime: `${assertHourMinute(closesAt)}:00`,
  }

  const { data, status } = await api.post<unknown>('/open-time', request)

  if (status !== 201 || !isMessageResponse(data)) {
    throw new Error('운영시간 등록 응답이 올바르지 않습니다.')
  }

  return data
}

// OPEN_TIME_UPDATE — 조회 id 가 있을 때 그 id 로 수정한다.
export async function updateOperatingHours({
  id,
  input: { date, opensAt, closesAt },
}: {
  id: number
  input: SaveOperatingHoursInput
}): Promise<OpenTimeUpdateResponse> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('운영시간 수정 요청 ID가 올바르지 않습니다.')
  }

  const request: OpenTimeUpdateRequest = {
    openDate: assertDateKey(date),
    startOpenTime: assertHourMinute(opensAt),
    endOpenTime: assertHourMinute(closesAt),
  }

  const { data, status } = await api.put<unknown>(`/open-time/${id}`, request)

  if (status !== 201 || !isMessageResponse(data)) {
    throw new Error('운영시간 수정 응답이 올바르지 않습니다.')
  }

  return data
}

function assertDateKey(value: string) {
  if (!isDateKey(value)) {
    throw new Error('운영시간 저장 요청 날짜가 올바르지 않습니다.')
  }
  return value
}

function assertHourMinute(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) {
    throw new Error('운영시간 저장 요청 시간이 올바르지 않습니다.')
  }
  return value
}

function isMessageResponse(value: unknown): value is { message: string } {
  if (typeof value !== 'object' || value === null) return false
  return typeof (value as Record<string, unknown>).message === 'string'
}

function isOpenTimeQueryByDateResponse(
  value: unknown,
): value is OpenTimeQueryByDateResponse {
  return Array.isArray(value) && value.every(isOpenTimeQueryByDateResponseItem)
}

function isOpenTimeQueryByDateResponseItem(
  value: unknown,
): value is OpenTimeQueryByDateResponseItem {
  if (typeof value !== 'object' || value === null) return false

  const hours = value as Record<string, unknown>

  return (
    (hours.id === null ||
      (Number.isSafeInteger(hours.id) && Number(hours.id) > 0)) &&
    isDateKey(hours.openDate) &&
    isTime(hours.startOpenTime) &&
    isTime(hours.endOpenTime)
  )
}

function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string') return false

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false

  const [, year, month, day] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))

  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day)
  )
}

function isTime(value: unknown): value is string {
  if (typeof value !== 'string') return false

  const match = /^(\d{2}):(\d{2}):(\d{2})$/.exec(value)
  if (!match) return false

  const [, hour, minute, second] = match.map(Number)
  return hour <= 23 && minute <= 59 && second <= 59
}
