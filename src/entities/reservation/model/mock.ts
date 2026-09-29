import type {
  GrantAccessInput,
  RemoveAccessInput,
  Reservation,
  ReservationDetail,
  ReservationStatus,
  Staff,
} from './types'

export const reservationAccessStorageKey = 'toyvillage:reservation-access'
// 빈 상태(데이터 없음) 경로 검증용 테스트 훅. 이 키가 설정되면 목록을 비운다.
// 실제 API 연동(/api 슬라이스) 시 제거한다.
export const reservationsEmptyStorageKey = 'toyvillage:reservations:empty'

// 상태 라벨(카운트 카드/필터).
export const reservationStatusLabel: Record<ReservationStatus, string> = {
  pending: '사전답사 전',
  approved: '사전답사 완료',
  rejected: '방문 완료',
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
  { id: 's1', name: '김지환', role: '과장' },
  { id: 's2', name: '이서연', role: '대리' },
  { id: 's3', name: '박민준', role: '사원' },
  { id: 's4', name: '최유나', role: '팀장' },
  { id: 's5', name: '정하람', role: '주임' },
  { id: 's6', name: '홍길동', role: '과장' },
  { id: 's7', name: '이서연', role: '대리' },
  { id: 's8', name: '박민준', role: '사원' },
  { id: 's9', name: '최유나', role: '팀장' },
  { id: 's10', name: '정하람', role: '주임' },
]

// 상세 페이지 확장 필드(목록 mock 위에 덧붙이는 상세 정보). 실제 필드 계약은 /api 슬라이스에서 확정.
type ReservationDetailExtras = Omit<ReservationDetail, keyof Reservation>

const reservationDetailExtras: Record<string, ReservationDetailExtras> = {
  '1': { reserveTimeEnd: '15 : 00', reserverName: '이승현', regionDetail: '대구광역시 수성구 범어동', admissionFee: 200000, surveyStatus: '답사 완료', guideCount: 3, guideContact: '010-7753-9698' },
  '2': { reserveTimeEnd: '12 : 00', reserverName: '김도윤', regionDetail: '서울특별시 강남구 역삼동', admissionFee: 260000, surveyStatus: '답사 대기', guideCount: 4, guideContact: '010-2244-1830' },
  '3': { reserveTimeEnd: '15 : 30', reserverName: '박서준', regionDetail: '부산광역시 해운대구 우동', admissionFee: 180000, surveyStatus: '답사 완료', guideCount: 2, guideContact: '010-9981-2213' },
  '4': { reserveTimeEnd: '13 : 00', reserverName: '이하은', regionDetail: '인천광역시 연수구 송도동', admissionFee: 300000, surveyStatus: '답사 대기', guideCount: 5, guideContact: '010-3390-7742' },
  '5': { reserveTimeEnd: '11 : 15', reserverName: '정예린', regionDetail: '광주광역시 서구 치평동', admissionFee: 220000, surveyStatus: '답사 완료', guideCount: 3, guideContact: '010-5567-1094' },
  '6': { reserveTimeEnd: '15 : 00', reserverName: '조현우', regionDetail: '대전광역시 유성구 장동', admissionFee: 240000, surveyStatus: '답사 완료', guideCount: 3, guideContact: '010-8842-6610' },
  '7': { reserveTimeEnd: '16 : 30', reserverName: '한지민', regionDetail: '울산광역시 남구 삼산동', admissionFee: 190000, surveyStatus: '답사 완료', guideCount: 2, guideContact: '010-4471-9928' },
  '8': { reserveTimeEnd: '11 : 45', reserverName: '오세훈', regionDetail: '경기도 성남시 분당구', admissionFee: 320000, surveyStatus: '답사 대기', guideCount: 4, guideContact: '010-6613-2287' },
  '9': { reserveTimeEnd: '17 : 40', reserverName: '유가은', regionDetail: '강원도 춘천시 석사동', admissionFee: 150000, surveyStatus: '답사 반려', guideCount: 2, guideContact: '010-7729-3345' },
  '10': { reserveTimeEnd: '14 : 10', reserverName: '신동현', regionDetail: '충청북도 청주시 흥덕구', admissionFee: 280000, surveyStatus: '답사 반려', guideCount: 4, guideContact: '010-1102-8846' },
}

// 권한 직원이 지정되지 않은 예약에 기본 노출할 직원(mock 시드).
const defaultAccessStaffIds = ['s6', 's1']

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

// 상세 페이지용 단건 조회(목록 예약 + 상세 확장 필드).
export async function getMockReservationDetail(
  id: string,
): Promise<ReservationDetail | null> {
  const base = mockReservations.find((reservation) => reservation.id === id)
  const extras = reservationDetailExtras[id]
  if (!base || !extras) return null
  return { ...base, ...extras }
}

// 예약 페이지에 접근 권한을 가진 직원 목록. 지정 기록이 없으면 mock 시드를 노출한다.
export async function getMockReservationAccess(
  reservationId: string,
): Promise<Staff[]> {
  const stored = readAccessMap()
  const ids = stored[reservationId] ?? defaultAccessStaffIds
  return ids
    .map((staffId) => mockStaff.find((member) => member.id === staffId))
    .filter((member): member is Staff => Boolean(member))
}

// 예약 페이지 권한에서 직원 한 명을 제거한다(교체 경계). 실 저장은 /api 슬라이스에서 확정.
export async function removeMockReservationAccess(
  input: RemoveAccessInput,
): Promise<void> {
  const stored = readAccessMap()
  const current = stored[input.reservationId] ?? defaultAccessStaffIds
  stored[input.reservationId] = current.filter(
    (staffId) => staffId !== input.staffId,
  )
  localStorage.setItem(reservationAccessStorageKey, JSON.stringify(stored))
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
