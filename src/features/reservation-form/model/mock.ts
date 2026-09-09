import type { Staff } from '@/entities/reservation'
import type { ReservationFormValue } from './types'

// 퍼블리싱 슬라이스는 실제 API를 연결하지 않고 mock 경계를 유지한다.
// 실제 생성/수정/삭제 계약과 배정 후보 직원 목록은 별도 `/api` 슬라이스에서 확정한다.

// 배정 가능한 직원 후보(mock). 실제 직원/권한 API 계약 전까지 사용.
export const mockAssignableStaff: Staff[] = [
  { id: 'a1', name: '이승현', role: '사원' },
  { id: 'a2', name: '김도윤', role: '대리' },
  { id: 'a3', name: '박서준', role: '과장' },
  { id: 'a4', name: '정예린', role: '주임' },
  { id: 'a5', name: '최민준', role: '사원' },
  { id: 'a6', name: '한지우', role: '대리' },
  { id: 'a7', name: '오세훈', role: '팀장' },
  { id: 'a8', name: '윤아름', role: '사원' },
  { id: 'a9', name: '강태현', role: '주임' },
  { id: 'a10', name: '임수빈', role: '대리' },
  { id: 'a11', name: '조현우', role: '과장' },
  { id: 'a12', name: '신유진', role: '사원' },
  { id: 'a13', name: '배준영', role: '주임' },
  { id: 'a14', name: '문가은', role: '대리' },
  { id: 'a15', name: '서지호', role: '사원' },
]

export async function createReservationMock(
  value: ReservationFormValue,
  assignedStaffIds: string[],
): Promise<void> {
  // mock 경계: 입력을 소비만 하고 성공 반환. 실제 생성은 /api 슬라이스에서.
  void value
  void assignedStaffIds
}

export async function updateReservationMock(
  id: string,
  value: ReservationFormValue,
  assignedStaffIds: string[],
): Promise<void> {
  void id
  void value
  void assignedStaffIds
}

export async function deleteReservationMock(id: string): Promise<void> {
  void id
}
