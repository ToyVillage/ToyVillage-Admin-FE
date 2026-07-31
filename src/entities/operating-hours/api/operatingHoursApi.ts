import { api } from '@/shared/api/axios'
import type { OperatingHours } from '../model/types'
import type {
  OpenTimeQueryByDateRequest,
  OpenTimeQueryByDateResponse,
  OpenTimeQueryByDateResponseItem,
} from './types'

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
    date: hours.openDate,
    opensAt: hours.startOpenTime,
    closesAt: hours.endOpenTime,
  }
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
