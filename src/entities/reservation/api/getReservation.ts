import { api } from '@/shared/api/axios'
import type { ReservationDetail, ReservationStatus } from '../model/types'

export interface ReservationQueryRequest {
  id: number
}

// RESERVATION_QUERY (GET /reservation/{id}) 응답 런타임 형태.
// 명세상 모든 필드가 존재하지만 방어적으로 unknown 으로 받고 매핑 시 검증한다.
interface ReservationQueryRuntimeItem {
  id: number | string
  reservationName?: unknown
  leaderCount?: unknown
  reservationCount?: unknown
  location?: unknown
  visitDate?: unknown
  exitTime?: unknown
  visitSiteDate?: unknown
  visitSiteTime?: unknown
  visitSiteExitTime?: unknown
  visitSiteCount?: unknown
  money?: unknown
}

// RESERVATION_QUERY (GET /reservation/{id}) — id로 단체예약 상세 조회.
//
// 임시 매핑(B): 응답에 단체명·상태(사전답사 라벨)·인솔자 연락처 필드가 없어(백엔드 명세 미비)
// 해당 UI 값은 빈 값으로 둔다. 백엔드가 필드를 추가하면 매핑을 확정한다.
// - reservationName      → reserverName (예약인)
// - reservationCount     → headcount (전체 인원)
// - leaderCount          → guideCount (인솔자 인원)
// - location             → region / regionDetail (지역)
// - visitDate            → reserveDate + reserveTime (예약일 / 예약 시작 시간)
// - exitTime             → reserveTimeEnd (예약 종료 시간)
// - visitSiteDate        → consultDate (상담일 = 사전답사 방문일)
// - money                → admissionFee (입장료로 추정)
export async function getReservation({
  id,
}: ReservationQueryRequest): Promise<ReservationDetail> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('예약 ID가 올바르지 않습니다.')
  }

  const { data } = await api.get<unknown>(`/reservation/${id}`)

  if (!isReservationQueryResponse(data)) {
    throw new Error('예약 상세 조회 응답 형식이 올바르지 않습니다.')
  }

  return toReservationDetail(data)
}

function toReservationDetail(item: ReservationQueryRuntimeItem): ReservationDetail {
  const location = toText(item.location)

  return {
    id: String(item.id),
    // 이 API는 목록 상태(pending/approved/rejected)를 제공하지 않는다(상세 카드 미표시).
    status: 'pending' as ReservationStatus,
    consultDate: toDateDots(item.visitSiteDate),
    reserveDate: toDateDots(item.visitDate),
    reserveTime: toClock(item.visitDate),
    reserveTimeEnd: toClock(item.exitTime),
    reserverName: toText(item.reservationName),
    // 응답에 단체명 없음(임시 매핑 B) → 빈 값.
    groupName: '',
    region: location,
    regionDetail: location,
    headcount: toNumber(item.reservationCount),
    admissionFee: toNumber(item.money),
    // 응답에 상태 라벨 없음(임시 매핑 B) → 빈 값.
    surveyStatus: '',
    guideCount: toNumber(item.leaderCount),
    // 응답에 인솔자 연락처 없음(임시 매핑 B) → 빈 값.
    guideContact: '',
  }
}

// ISO datetime 또는 날짜 문자열 → "yyyy.MM.dd".
function toDateDots(value: unknown): string {
  if (typeof value !== 'string' || value.length < 10) return ''
  return value.slice(0, 10).replace(/-/g, '.')
}

// datetime("...THH:mm:ss") 또는 time("HH:mm:ss") → "HH : mm".
function toClock(value: unknown): string {
  if (typeof value !== 'string') return ''
  const timePart = value.includes('T') ? (value.split('T')[1] ?? '') : value
  const match = timePart.match(/^(\d{2}):(\d{2})/)
  return match ? `${match[1]} : ${match[2]}` : ''
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function isReservationQueryResponse(
  value: unknown,
): value is ReservationQueryRuntimeItem {
  if (typeof value !== 'object' || value === null) return false

  const item = value as Record<string, unknown>
  return (
    (typeof item.id === 'number' && Number.isFinite(item.id)) ||
    (typeof item.id === 'string' && item.id.trim().length > 0)
  )
}

export function isReservationNotFoundError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false

  const response = (error as { response?: unknown }).response
  if (typeof response !== 'object' || response === null) return false

  return (response as { status?: unknown }).status === 404
}
