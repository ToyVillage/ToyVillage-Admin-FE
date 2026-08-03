# Implementation Plan — RESERVATION_PERMISSION_DELETE

## 변경/생성 파일

1. `src/entities/reservation/api/deleteReservationPermission.ts` (신규)
   - `deleteReservationPermission({ reservationId, userId }): Promise<{ message: string }>`
   - `api.delete('/reservation/permission/${reservationId}/${userId}')` + 응답 `{ message }` 런타임 검증.
   - `reservationId`는 양의 정수 검증. `userId`는 path segment로 그대로 전달(목록의 임시 합성 id 허용, 빈 값만 차단).
2. `src/entities/reservation/index.ts` (수정)
   - `deleteReservationPermission` export.
3. `src/pages/notices/reservations/ReservationDetailPage.tsx` (수정)
   - `removeMutation`의 `mutationFn`을 `removeMockReservationAccess` → `deleteReservationPermission({ reservationId: Number(id), userId })`로 교체.
   - 성공 시 `['reservations', id, 'access']` 무효화 + 다이얼로그 닫기(기존 유지).
   - 미사용된 `removeMockReservationAccess`/`RemoveAccessInput` import 제거.

## 규칙 준수

- 등록·수정·삭제는 `useMutation`, 공통 `api`, `any`/`@ts-ignore` 없음, Query Key 배열 유지.

## 범위 제외 / 선행 의존

- 삭제에 필요한 `userId`를 목록 API가 주지 않아 실제 서버에선 미성립. 목록 응답 보강 후 정상 동작(코드 변경 없이 실 userId가 전달됨).
- 실제 서버 테스트(`real_server.enabled: false`).
