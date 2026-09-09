import type { ReservationCreateRequest } from '@/entities/reservation'
import { partsTo24hClock } from './format'
import type { ReservationFormValue } from './types'

// yyyy.MM.dd → yyyy-MM-dd
const toDashDate = (value: string) => value.replaceAll('.', '-')
// 숫자만 남겨 정수화(빈 값은 0).
const toInt = (value: string) => Number(value.replace(/\D/g, '') || '0')

// 생성/수정 공용 폼 값 → RESERVATION_ADMIN_CREATE 요청 바디.
export function toCreateReservationRequest(
  value: ReservationFormValue,
  appAdminIds: number[],
): ReservationCreateRequest {
  return {
    title: value.groupName,
    location: value.region,
    counselDate: toDashDate(value.counselDate),
    reservationName: value.reserverName,
    leaderPhoneNumber: value.representativeContact,
    reservationCount: toInt(value.headcount),
    leaderCount: toInt(value.guideCount),
    money: toInt(value.admissionFee),
    visitDate: toDashDate(value.visitDate),
    visitTime: partsTo24hClock(value.visitTime, value.visitTimeAmPm),
    exitTime: partsTo24hClock(value.exitTime, value.exitTimeAmPm),
    visitSiteCount: toInt(value.surveyCount),
    visitSiteDate: toDashDate(value.surveyDate),
    visitSiteTime: partsTo24hClock(value.surveyEnterTime, value.surveyEnterAmPm),
    visitSiteExitTime: partsTo24hClock(
      value.surveyExitTime,
      value.surveyExitAmPm,
    ),
    appAdminIds,
  }
}
