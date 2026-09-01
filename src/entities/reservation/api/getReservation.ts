import { api } from '@/shared/api/axios'
import type { ReservationDetail, ReservationStatus } from '../model/types'

export interface ReservationQueryRequest {
  id: number
}

// RESERVATION_ADMIN_QUERY (GET /reservation/{id}) 응답 런타임 형태.
// 방어적으로 unknown 으로 받고 매핑 시 검증한다. 응답에 id는 없어 요청 id를 사용한다.
interface ReservationAdminQueryRuntimeItem {
  counselDate?: unknown
  visitDate?: unknown
  visitTime?: unknown
  exitTime?: unknown
  reservationName?: unknown
  reservationCount?: unknown
  location?: unknown
  title?: unknown
  money?: unknown
  status?: unknown
  leaderCount?: unknown
  leaderPhoneNumber?: unknown
  visitSiteCount?: unknown
  visitSiteDate?: unknown
  visitSiteTime?: unknown
  visitSiteExitTime?: unknown
}

// RESERVATION_ADMIN_QUERY (GET /reservation/{id}) — id로 단체예약 상세 조회(관리자).
// 매핑:
// - counselDate        → consultDate (상담일)
// - visitDate          → reserveDate (예약일)
// - visitTime          → reserveTime (예약 시작 시간)
// - exitTime           → reserveTimeEnd (예약 종료 시간)
// - reservationName    → reserverName (예약인)
// - reservationCount   → headcount (전체 인원)
// - location           → region / regionDetail (지역)
// - title              → groupName (단체명)
// - money              → admissionFee (입장료)
// - status             → surveyStatus (상태 라벨, 예: 사전답사 완료)
// - leaderCount        → guideCount (인솔자 인원)
// - leaderPhoneNumber  → guideContact (인솔자 연락처)
// - visitSiteCount     → surveyCount (사전답사 인원)
// - visitSiteDate      → surveyDate (사전답사 날짜)
// - visitSiteTime      → surveyEnterTime (사전답사 입장 시간)
// - visitSiteExitTime  → surveyExitTime (사전답사 퇴장 시간)
export async function getReservation({
  id,
}: ReservationQueryRequest): Promise<ReservationDetail> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('예약 ID가 올바르지 않습니다.')
  }

  const { data } = await api.get<unknown>(`/reservation/${id}`)

  if (!isReservationAdminQueryResponse(data)) {
    throw new Error('예약 상세 조회 응답 형식이 올바르지 않습니다.')
  }

  return toReservationDetail(id, data)
}

function toReservationDetail(
  id: number,
  item: ReservationAdminQueryRuntimeItem,
): ReservationDetail {
  const location = toText(item.location)

  return {
    id: String(id),
    // 목록 상태(pending/approved/rejected)는 이 응답으로 판별하지 않는다(상세 카드 미표시).
    status: 'pending' as ReservationStatus,
    consultDate: toDateDots(item.counselDate),
    reserveDate: toDateDots(item.visitDate),
    reserveTime: toClock(item.visitTime),
    reserveTimeEnd: toClock(item.exitTime),
    reserverName: toText(item.reservationName),
    groupName: toText(item.title),
    region: location,
    regionDetail: location,
    headcount: toNumber(item.reservationCount),
    admissionFee: toNumber(item.money),
    surveyStatus: toText(item.status),
    guideCount: toNumber(item.leaderCount),
    guideContact: toText(item.leaderPhoneNumber),
    surveyCount: toNumber(item.visitSiteCount),
    surveyDate: toDateDots(item.visitSiteDate),
    surveyEnterTime: toClock(item.visitSiteTime),
    surveyExitTime: toClock(item.visitSiteExitTime),
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

function isReservationAdminQueryResponse(
  value: unknown,
): value is ReservationAdminQueryRuntimeItem {
  return typeof value === 'object' && value !== null
}

export function isReservationNotFoundError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false

  const response = (error as { response?: unknown }).response
  if (typeof response !== 'object' || response === null) return false

  return (response as { status?: unknown }).status === 404
}
