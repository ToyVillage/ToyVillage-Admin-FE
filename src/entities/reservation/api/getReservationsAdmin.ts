import { api } from '@/shared/api/axios'
import type { Reservation, ReservationStatus } from '../model/types'

export interface ReservationAdminListResult {
  reservations: Reservation[]
  counts: Record<ReservationStatus, number>
}

interface ReservationAdminContentItem {
  id: number | string
  title?: unknown
  counselDate?: unknown
  reservationDate?: unknown
  reservationTime?: unknown
  location?: unknown
  count?: unknown
  status?: unknown
}

// 서버 응답의 상태 라벨 → 내부 상태값(카운트 카드 순서: 사전답사 전/완료/방문 완료).
const statusFromLabel: Record<string, ReservationStatus> = {
  '사전답사 전': 'pending',
  '사전답사 완료': 'approved',
  '방문 완료': 'rejected',
}

const PAGE_SIZE = 10

// RESERVATION_ADMIN_QUERY_ALL (GET /reservation) — 관리자 단체예약 전체 조회.
// 서버는 상태별 카운트와 페이지 목록을 반환한다. 검색/상태 필터 서버 파라미터가 없어
// (백엔드 확인 필요) 공지(getAllNotices)와 동일하게 전 페이지를 취합해 클라이언트에서
// 검색·정렬·페이지 처리한다. 카운트는 응답의 상태별 전체 개수를 그대로 사용한다.
export async function getReservationsAdmin(): Promise<ReservationAdminListResult> {
  const reservations: Reservation[] = []
  const counts: Record<ReservationStatus, number> = {
    pending: 0,
    approved: 0,
    rejected: 0,
  }

  for (let page = 0; ; page += 1) {
    const { data } = await api.get<unknown>('/reservation', {
      params: { page, size: PAGE_SIZE, sort: 'id,desc' },
    })

    if (!isAdminListResponse(data)) {
      throw new Error('단체예약 조회 응답 형식이 올바르지 않습니다.')
    }

    // 카운트는 어느 페이지 응답이든 전체 기준이므로 첫 페이지 값으로 채운다.
    if (page === 0) {
      counts.pending = data.beforeVisitSite
      counts.approved = data.doneVisitSite
      counts.rejected = data.doneVisit
    }

    const list = data.reservationAdminQueryListObjectResponse
    for (const item of list.content) {
      reservations.push(toReservation(item))
    }

    if (list.last || list.content.length === 0) break
    // totalPages 초과 방지: 마지막 페이지 표식이 없어도 페이지 수만큼만 순회한다.
    if (page + 1 >= list.totalPages) break
  }

  return { reservations, counts }
}

function toReservation(item: ReservationAdminContentItem): Reservation {
  return {
    id: String(item.id),
    status: toStatus(item.status),
    consultDate: toDateDots(item.counselDate),
    reserveDate: toDateDots(item.reservationDate),
    reserveTime: toClock(item.reservationTime),
    groupName: toText(item.title),
    region: toText(item.location),
    headcount: toNumber(item.count),
  }
}

function toStatus(value: unknown): ReservationStatus {
  if (typeof value === 'string' && value in statusFromLabel) {
    return statusFromLabel[value]
  }
  return 'pending'
}

function toDateDots(value: unknown): string {
  if (typeof value !== 'string' || value.length < 10) return ''
  return value.slice(0, 10).replace(/-/g, '.')
}

function toClock(value: unknown): string {
  if (typeof value !== 'string') return ''
  const match = value.match(/^(\d{2}):(\d{2})/)
  return match ? `${match[1]} : ${match[2]}` : ''
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

interface AdminListResponse {
  beforeVisitSite: number
  doneVisitSite: number
  doneVisit: number
  reservationAdminQueryListObjectResponse: {
    content: ReservationAdminContentItem[]
    totalPages: number
    last?: boolean
  }
}

function isAdminListResponse(value: unknown): value is AdminListResponse {
  if (typeof value !== 'object' || value === null) return false

  const root = value as Record<string, unknown>
  if (
    typeof root.beforeVisitSite !== 'number' ||
    typeof root.doneVisitSite !== 'number' ||
    typeof root.doneVisit !== 'number'
  ) {
    return false
  }

  const list = root.reservationAdminQueryListObjectResponse
  if (typeof list !== 'object' || list === null) return false

  const page = list as Record<string, unknown>
  return (
    Array.isArray(page.content) &&
    page.content.every(isAdminContentItem) &&
    typeof page.totalPages === 'number'
  )
}

function isAdminContentItem(value: unknown): value is ReservationAdminContentItem {
  if (typeof value !== 'object' || value === null) return false

  const item = value as Record<string, unknown>
  return (
    (typeof item.id === 'number' && Number.isFinite(item.id)) ||
    (typeof item.id === 'string' && item.id.trim().length > 0)
  )
}
