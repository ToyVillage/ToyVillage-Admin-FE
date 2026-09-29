import type { ReservationDetail } from '@/entities/reservation'
import { clock24ToRawDigits, formatMoney } from './format'
import { emptyReservationFormValue } from './types'
import type { ReservationFormValue } from './types'

// 조회한 상세 → 폼 값. 초기값을 폼 입력 계약에 맞춰 서식한다:
// 금액 콤마, 시간은 24시간제 raw 자릿수, 사전답사 섹션 포함.
// 읽기 전용 상세(`ReservationReadonlyForm`)와 수정 폼이 같은 변환을 쓴다.
export function toReservationFormValue(
  detail: ReservationDetail,
): ReservationFormValue {
  return {
    ...emptyReservationFormValue,
    groupName: detail.groupName,
    region: detail.regionDetail || detail.region,
    counselDate: detail.consultDate,
    reserverName: detail.reserverName,
    representativeContact: detail.guideContact,
    // 숫자 0(무료 입장료·0명 등)도 유효값이므로 truthy가 아닌 존재 여부로 판단한다.
    headcount: detail.headcount != null ? String(detail.headcount) : '',
    guideCount: detail.guideCount != null ? String(detail.guideCount) : '',
    admissionFee:
      detail.admissionFee != null
        ? formatMoney(String(detail.admissionFee))
        : '',
    visitDate: detail.reserveDate,
    visitTime: clock24ToRawDigits(detail.reserveTime),
    exitTime: clock24ToRawDigits(detail.reserveTimeEnd),
    surveyCount: detail.surveyCount != null ? String(detail.surveyCount) : '',
    surveyDate: detail.surveyDate ?? '',
    surveyEnterTime: clock24ToRawDigits(detail.surveyEnterTime ?? ''),
    surveyExitTime: clock24ToRawDigits(detail.surveyExitTime ?? ''),
  }
}
