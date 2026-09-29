import type { ReservationFormCompletion } from '@/features/reservation-form'

// Figma `단체예약 · 토스트`(yot 311:12770). 수정 성공 문구만 노드가 없어
// 나머지와 같은 규칙으로 맞춘다(개발자 결정, 자료실 목록과 동일).
export const successToastMessage: Record<ReservationFormCompletion, string> = {
  created: '데이터 생성에 성공했습니다',
  updated: '데이터 수정에 성공했습니다',
  permission: '권한 부여에 성공했습니다',
}

export const deleteToastMessage = {
  success: '데이터 삭제에 성공했습니다',
  failure: '데이터 삭제에 실패했습니다',
} as const

export const failureToastMessage: Record<ReservationFormCompletion, string> = {
  created: '데이터 생성에 실패했습니다',
  updated: '데이터 수정에 실패했습니다',
  permission: '권한 부여에 실패했습니다',
}
