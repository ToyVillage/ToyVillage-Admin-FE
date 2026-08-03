# Implementation Plan — RESERVATION_PERMISSION_QUERY_ALL

## 변경/생성 파일

1. `src/entities/reservation/api/getReservationPermissions.ts` (신규)
   - `getReservationPermissions(reservationId: number): Promise<Staff[]>`
   - `api.get<unknown>('/reseravtion/permission/${reservationId}')` (명세 오타 그대로) + 런타임 검증 후 매핑.
   - 매핑(B): `{ name }` → `{ id: 'perm-<index>', name }`, `role` 미표시.
2. `src/entities/reservation/index.ts` (수정)
   - `getReservationPermissions` export.
3. `src/pages/notices/reservations/ReservationDetailPage.tsx` (수정)
   - 권한 목록 query `queryFn`을 `getMockReservationAccess` → `getReservationPermissions(Number(id))`로 교체. query key `['reservations', id, 'access']` 유지. `retry: false`.

## 규칙 준수

- 공통 `api` + `useQuery`, request/response 타입 분리, `any`/`@ts-ignore` 없음, Query Key 배열 유지.
- Contract 밖 필드 사용 안 함(`name`만).

## 범위 제외 / 후속

- 권한 제거(RESERVATION_PERMISSION_DELETE): 응답이 `userId`를 안 줘서 이번 슬라이스 미포함. 제거 버튼은 기존 mock(`removeMockReservationAccess`) 유지 → 실제 반영 안 됨(후속 과제).
- 엔드포인트 오타 확정 시 경로 1줄 수정.
- 실제 서버 테스트(`real_server.enabled: false`).
