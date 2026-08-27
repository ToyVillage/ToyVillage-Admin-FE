import { api } from '@/shared/api/axios'
import type { Reservation, ReservationStatus } from '../model/types'
import type {
  ReservationAdminListResult,
  ReservationAdminQueryAllItem,
  ReservationAdminQueryAllRequest,
  ReservationAdminQueryAllResponse,
  ReservationStatusCode,
} from './types'

// UI 상태 ↔ 서버 상태 코드 매핑(요청 status 파라미터).
export const reservationStatusToCode: Record<
  ReservationStatus,
  ReservationStatusCode
> = {
  pending: 'BEFORE_SITE_VISIT',
  approved: 'SITE_VISIT_COMPLETED',
  rejected: 'VISIT_COMPLETED',
}

// 응답 status 라벨 → UI 상태(카드/필터).
const labelToStatus: Record<string, ReservationStatus> = {
  '사전답사 전': 'pending',
  '사전답사 완료': 'approved',
  '방문 완료': 'rejected',
}

export async function getAdminReservations(
  params: ReservationAdminQueryAllRequest,
): Promise<ReservationAdminListResult> {
  const { data } = await api.get<unknown>('/reservation', { params })

  if (!isReservationAdminQueryAllResponse(data)) {
    throw new Error('단체예약 조회 응답 형식이 올바르지 않습니다.')
  }

  const page = data.reservationAdminQueryListObjectResponse

  return {
    counts: {
      pending: data.beforeVisitSite,
      approved: data.doneVisitSite,
      rejected: data.doneVisit,
    },
    reservations: page.content.map(toReservation),
    totalPages: page.totalPages,
  }
}

function toReservation(item: ReservationAdminQueryAllItem): Reservation {
  return {
    id: String(item.id),
    status: labelToStatus[item.status] ?? 'pending',
    consultDate: formatDate(item.counselDate),
    reserveDate: formatDate(item.reservationDate),
    reserveTime: formatTime(item.reservationTime),
    groupName: item.title,
    region: item.location,
    headcount: item.count,
  }
}

// yyyy-MM-dd → yyyy.MM.dd (기존 목록 표기와 일치).
function formatDate(value: string): string {
  return value.replaceAll('-', '.')
}

// HH:mm:ss → HH : mm (기존 목록 표기와 일치).
function formatTime(value: string): string {
  const [hour, minute] = value.split(':')
  if (hour === undefined || minute === undefined) return value
  return `${hour} : ${minute}`
}

function isReservationAdminQueryAllResponse(
  value: unknown,
): value is ReservationAdminQueryAllResponse {
  if (typeof value !== 'object' || value === null) return false

  const response = value as Record<string, unknown>
  const page = response.reservationAdminQueryListObjectResponse

  return (
    typeof response.beforeVisitSite === 'number' &&
    typeof response.doneVisitSite === 'number' &&
    typeof response.doneVisit === 'number' &&
    isReservationAdminQueryAllPage(page)
  )
}

function isReservationAdminQueryAllPage(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false

  const page = value as Record<string, unknown>
  return (
    typeof page.totalPages === 'number' &&
    Array.isArray(page.content) &&
    page.content.every(isReservationAdminQueryAllItem)
  )
}

function isReservationAdminQueryAllItem(
  value: unknown,
): value is ReservationAdminQueryAllItem {
  if (typeof value !== 'object' || value === null) return false

  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'number' &&
    typeof item.title === 'string' &&
    typeof item.counselDate === 'string' &&
    typeof item.reservationDate === 'string' &&
    typeof item.reservationTime === 'string' &&
    typeof item.location === 'string' &&
    typeof item.count === 'number' &&
    typeof item.status === 'string'
  )
}
