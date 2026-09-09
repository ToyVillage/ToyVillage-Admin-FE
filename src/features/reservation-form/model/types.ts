export type AmPm = 'am' | 'pm'

// 생성/수정 공용 폼 값. 입력 편의상 수치도 문자열로 보관한다(제출 시 변환).
export interface ReservationFormValue {
  // ① 상담일 관련
  groupName: string
  region: string
  counselDate: string
  reserverName: string
  representativeContact: string
  // ② 방문일 관련
  headcount: string
  guideCount: string
  admissionFee: string
  visitDate: string
  visitTime: string
  visitTimeAmPm: AmPm
  exitTime: string
  exitTimeAmPm: AmPm
  // ③ 사전답사 관련
  surveyCount: string
  surveyDate: string
  surveyEnterTime: string
  surveyEnterAmPm: AmPm
  surveyExitTime: string
  surveyExitAmPm: AmPm
}

export type ReservationFormErrors = Partial<
  Record<keyof ReservationFormValue, string>
>

export const emptyReservationFormValue: ReservationFormValue = {
  groupName: '',
  region: '',
  counselDate: '',
  reserverName: '',
  representativeContact: '',
  headcount: '',
  guideCount: '',
  admissionFee: '',
  visitDate: '',
  visitTime: '',
  visitTimeAmPm: 'am',
  exitTime: '',
  exitTimeAmPm: 'pm',
  surveyCount: '',
  surveyDate: '',
  surveyEnterTime: '',
  surveyEnterAmPm: 'am',
  surveyExitTime: '',
  surveyExitAmPm: 'pm',
}
