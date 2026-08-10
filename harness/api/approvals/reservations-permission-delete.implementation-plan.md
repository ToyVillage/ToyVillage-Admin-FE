# Implementation Plan — RESERVATION_PERMISSION_DELETE

## 변경/생성 파일

1. `src/entities/reservation/api/deleteReservationPermission.ts` (수정)
   - param `userId` → `appAdminId`. path `/reservation/permission/${reservationId}/${appAdminId}`.
   - 응답 204 No Content → 본문 파싱 없이 `void` 반환(이전 `{message}` 검증 제거).
2. `src/entities/reservation/index.ts` — `DeleteReservationPermissionResponse` export 제거, 함수·요청 타입만 유지.
3. `src/pages/notices/reservations/ReservationDetailPage.tsx`
   - `removeMutation`이 `appAdminId`(권한 목록의 실제 계정 id)를 path로 전달.

## 규칙 준수

- 삭제는 `useMutation`, 공통 `api`, `any`/`@ts-ignore` 없음, Query Key 배열 유지.

## 범위 제외

- 실제 서버 테스트(`real_server.enabled: false`).
