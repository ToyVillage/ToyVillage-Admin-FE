import { api } from '@/shared/api/axios'
import type { CloseSchedule, CreateCloseScheduleInput } from '../model/types'
import type {
  CloseDateCreateRequest,
  CloseDateCreateResponse,
  CloseDateQueryAllResponseItem,
  CloseDateQueryByDateRequest,
} from './types'

export async function createCloseSchedule(
  input: CreateCloseScheduleInput,
): Promise<CloseDateCreateResponse> {
  const request = toCloseDateCreateRequest(input)
  await api.post<CloseDateCreateResponse>('/close-day', request)
}

export async function getCloseSchedules(): Promise<CloseSchedule[]> {
  const { data, status } = await api.get<unknown>('/close-day')

  if (status !== 200) {
    throw new Error('휴관일 조회 응답 상태가 올바르지 않습니다.')
  }

  if (!isCloseDateQueryAllResponse(data)) {
    throw new Error('휴관일 조회 응답 형식이 올바르지 않습니다.')
  }

  return data.map(toCloseSchedule)
}

export async function getCloseSchedulesByDate({
  date,
}: CloseDateQueryByDateRequest): Promise<CloseSchedule[]> {
  if (!isDateKey(date)) {
    throw new Error('휴관일 날짜별 조회 요청 날짜가 올바르지 않습니다.')
  }

  const { data, status } = await api.get<unknown>('/close-day', {
    params: { date },
  })

  if (status !== 200) {
    throw new Error('휴관일 날짜별 조회 응답 상태가 올바르지 않습니다.')
  }

  if (!isCloseDateQueryAllResponse(data)) {
    throw new Error('휴관일 날짜별 조회 응답 형식이 올바르지 않습니다.')
  }

  return data.map(toCloseSchedule)
}

function toCloseDateCreateRequest(
  input: CreateCloseScheduleInput,
): CloseDateCreateRequest {
  const title = input.title.trim()

  if (!title) {
    throw new Error('휴관일 제목이 올바르지 않습니다.')
  }

  if (!isDateKey(input.startDate) || !isDateKey(input.endDate)) {
    throw new Error('휴관일 생성 요청 날짜가 올바르지 않습니다.')
  }

  if (input.startDate > input.endDate) {
    throw new Error('휴관일 종료일은 시작일과 같거나 이후여야 합니다.')
  }

  return {
    title,
    startCloseTime: input.startDate,
    endCloseTime: input.endDate,
  }
}

function toCloseSchedule(schedule: CloseDateQueryAllResponseItem) {
  return {
    id: String(schedule.id),
    title: schedule.title,
    startDate: schedule.startCloseTime,
    endDate: schedule.endCloseTime,
  }
}

function isCloseDateQueryAllResponse(
  value: unknown,
): value is CloseDateQueryAllResponseItem[] {
  return Array.isArray(value) && value.every(isCloseDateQueryAllResponseItem)
}

function isCloseDateQueryAllResponseItem(
  value: unknown,
): value is CloseDateQueryAllResponseItem {
  if (typeof value !== 'object' || value === null) return false

  const schedule = value as Record<string, unknown>

  return (
    Number.isSafeInteger(schedule.id) &&
    Number(schedule.id) > 0 &&
    typeof schedule.title === 'string' &&
    isDateKey(schedule.startCloseTime) &&
    isDateKey(schedule.endCloseTime) &&
    schedule.startCloseTime <= schedule.endCloseTime
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
