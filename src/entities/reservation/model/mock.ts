import type {
  GrantAccessInput,
  Reservation,
  ReservationStatus,
  Staff,
} from './types'

export const reservationAccessStorageKey = 'toyvillage:reservation-access'
// 빈 상태(데이터 없음) 경로 검증용 테스트 훅. 이 키가 설정되면 목록을 비운다.
// 실제 API 연동(/api 슬라이스) 시 제거한다.
export const reservationsEmptyStorageKey = 'toyvillage:reservations:empty'

// 상태 라벨(카운트 카드/필터).
export const reservationStatusLabel: Record<ReservationStatus, string> = {
  pending: '심사대기',
  approved: '승인 완료',
  rejected: '반려',
}

// 카운트 카드 노출 순서.
export const reservationStatuses: ReservationStatus[] = [
  'pending',
  'approved',
  'rejected',
]

// 슬라이스용 mock. 추후 TanStack Query + Axios(/api 슬라이스)로 대체.
// pending 은 상담일순/예약일순 정렬이 서로 다른 순서가 되도록 날짜를 어긋나게 둔다.
export const mockReservations: Reservation[] = [
  { id: '1', status: 'pending', consultDate: '2026.07.08', reserveDate: '2026.07.10', reserveTime: '13 : 01', groupName: '대구어린이집', region: '대구광역시', headcount: 18 },
  { id: '2', status: 'pending', consultDate: '2026.07.06', reserveDate: '2026.07.14', reserveTime: '10 : 30', groupName: '행복유치원', region: '서울특별시', headcount: 24 },
  { id: '3', status: 'pending', consultDate: '2026.07.05', reserveDate: '2026.07.16', reserveTime: '14 : 00', groupName: '푸른숲어린이집', region: '부산광역시', headcount: 15 },
  { id: '4', status: 'pending', consultDate: '2026.07.03', reserveDate: '2026.07.20', reserveTime: '11 : 15', groupName: '햇살유치원', region: '인천광역시', headcount: 30 },
  { id: '5', status: 'pending', consultDate: '2026.07.02', reserveDate: '2026.07.22', reserveTime: '09 : 45', groupName: '무지개어린이집', region: '광주광역시', headcount: 20 },
  { id: '6', status: 'approved', consultDate: '2026.06.28', reserveDate: '2026.07.10', reserveTime: '13 : 30', groupName: '별빛유치원', region: '대전광역시', headcount: 22 },
  { id: '7', status: 'approved', consultDate: '2026.06.30', reserveDate: '2026.07.12', reserveTime: '15 : 00', groupName: '꿈나무어린이집', region: '울산광역시', headcount: 17 },
  { id: '8', status: 'approved', consultDate: '2026.07.01', reserveDate: '2026.07.14', reserveTime: '10 : 00', groupName: '아이사랑유치원', region: '경기도', headcount: 28 },
  { id: '9', status: 'rejected', consultDate: '2026.06.25', reserveDate: '2026.07.08', reserveTime: '16 : 20', groupName: '한빛어린이집', region: '강원도', headcount: 12 },
  { id: '10', status: 'rejected', consultDate: '2026.06.27', reserveDate: '2026.07.09', reserveTime: '12 : 40', groupName: '초록별유치원', region: '충청북도', headcount: 26 },
]

export const mockStaff: Staff[] = [
  { id: 's1', name: '김지환' },
  { id: 's2', name: '이서연' },
  { id: 's3', name: '박민준' },
  { id: 's4', name: '최유나' },
  { id: 's5', name: '정하람' },
  { id: 's6', name: '김지환' },
  { id: 's7', name: '이서연' },
  { id: 's8', name: '박민준' },
  { id: 's9', name: '최유나' },
  { id: 's10', name: '정하람' },
]

export async function getMockReservations(): Promise<Reservation[]> {
  if (localStorage.getItem(reservationsEmptyStorageKey)) return []
  return [...mockReservations]
}

export async function getMockReservation(
  id: string,
): Promise<Reservation | null> {
  return mockReservations.find((reservation) => reservation.id === id) ?? null
}

export async function getMockStaff(): Promise<Staff[]> {
  return [...mockStaff]
}

// 선택 예약에 접근 가능한 직원을 지정한다. 실제 저장은 /api 슬라이스에서 확정하고,
// 이번 슬라이스는 localStorage에 예약별 직원 매핑만 남긴다(교체 경계).
export async function grantMockReservationAccess(
  input: GrantAccessInput,
): Promise<void> {
  const stored = readAccessMap()
  for (const reservationId of input.reservationIds) {
    stored[reservationId] = input.staffIds
  }
  localStorage.setItem(reservationAccessStorageKey, JSON.stringify(stored))
}

function readAccessMap(): Record<string, string[]> {
  const raw = localStorage.getItem(reservationAccessStorageKey)
  if (!raw) return {}

  try {
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, string[]>)
      : {}
  } catch {
    return {}
  }
}
