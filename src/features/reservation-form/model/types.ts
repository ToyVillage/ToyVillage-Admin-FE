// 생성/수정 공용 폼 값. 입력 편의상 수치도 문자열로 보관한다(제출 시 변환).
// 시간은 24시간제 원시 자릿수 "HHmm"(예: 18:30 → "1830").
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
  exitTime: string
  // ③ 사전답사 관련
  surveyCount: string
  surveyDate: string
  surveyEnterTime: string
  surveyExitTime: string
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
  exitTime: '',
  surveyCount: '',
  surveyDate: '',
  surveyEnterTime: '',
  surveyExitTime: '',
}

// 생성·수정 화면이 목록으로 돌려보내는 결과. 목록이 이 값으로 토스트를 고른다.
// `permission` 은 값 변경 없이 담당자 배정만 바뀐 저장이다(Figma `권한 부여에 성공했습니다`).
export type ReservationFormCompletion = 'created' | 'updated' | 'permission'
