# Implementation Plan — RESERVATION_PERMISSION_QUERY_ALL

## 변경/생성 파일

1. `src/entities/reservation/api/getReservationPermissions.ts` (수정)
   - 엔드포인트 오타 정정: `/reseravtion/permission/${reservationId}` → `/reservation/permission/${reservationId}`.
   - 응답 `[{ appAdminId, name }]` → `Staff{ id: String(appAdminId), name }` 매핑(이전 합성 id 제거).
2. `src/entities/reservation/index.ts` — export 유지.
3. `src/pages/notices/reservations/ReservationDetailPage.tsx` — 변경 없음(기존 배선 유지).

## 규칙 준수

- 공통 `api` + `useQuery`, 런타임 검증, `any`/`@ts-ignore` 없음, Query Key 배열 유지.

## 범위 제외

- 실제 서버 테스트(`real_server.enabled: false`).
