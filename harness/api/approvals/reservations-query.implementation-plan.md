# Implementation Plan — RESERVATION_QUERY

## 변경/생성 파일

1. `src/entities/reservation/api/getReservation.ts` (신규)
   - `ReservationQueryRequest { id: number }` 추가.
   - `getReservation({ id })` → `api.get<unknown>('/reservation/${id}')` + 런타임 검증(id) 후 `ReservationDetail`로 매핑. id 유효성(양의 정수) 검증.
   - `isReservationNotFoundError`(404 판별) export.
2. `src/entities/reservation/index.ts` (수정)
   - `getReservation`, `isReservationNotFoundError`, 타입 `ReservationQueryRequest` export.
3. `src/pages/notices/reservations/ReservationDetailPage.tsx` (수정)
   - `getMockReservationDetail` → `getReservation({ id: Number(id) })`. `queryKey: ['reservations', id]` 유지. `retry: false`.
   - 기존 로딩/‘예약을 찾을 수 없습니다’ 상태(퍼블리싱 존재분) 유지. 새 화면 추가 없음.

## 매핑 (임시 B — 응답에 없는 필드는 빈 값)

- `reservationName`→예약인, `reservationCount`→전체 인원, `leaderCount`→인솔자 인원, `location`→지역, `visitDate`→예약일/예약 시작 시간, `exitTime`→예약 종료 시간, `visitSiteDate`→상담일, `money`→입장료.
- 응답에 없음 → 빈 값: **단체명, 상태(사전답사 라벨), 인솔자 연락처**. `status`(목록 상태)는 상세 카드 미표시로 기본값.

## 규칙 준수

- 공통 `api` + `useQuery`, request/response 타입 분리, `any`/`@ts-ignore` 없음, Query Key 배열 유지.
- Contract 밖 필드 사용 안 함(응답 12개 필드만 참조).

## 범위 제외

- 전체조회(RESERVATION_QUERY_ALL), 권한(RESERVATION_PERMISSION_*) 연동. 실제 서버 테스트(`real_server.enabled: false`).
