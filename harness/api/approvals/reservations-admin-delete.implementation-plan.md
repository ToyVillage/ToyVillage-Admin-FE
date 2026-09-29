# Implementation Plan — RESERVATION_ADMIN_DELETE

## 목표

상세 페이지의 `deleteReservationMock`을 `DELETE /reservation/{reservationId}`(RESERVATION_ADMIN_DELETE) 실 API로 교체.

## 변경/추가 파일

1. **신규** `src/entities/reservation/api/deleteReservation.ts`
   - `deleteReservation(id: number): Promise<{ message: string }>` — id 유효성(`Number.isSafeInteger && > 0`) → `api.delete('/reservation/${id}')` → 200 확인 + message 검증.

2. **수정** `src/entities/reservation/index.ts` — `deleteReservation` export.

3. **수정** `src/pages/notices/reservations/ReservationDetailPage.tsx`
   - `deleteMutation`의 `mutationFn`을 `deleteReservationMock(id)` → `deleteReservation(Number(id))`로 교체.
   - `onSuccess`(무효화 + 이동) 유지.
   - `onError` 추가: 서버 `message`를 상단 인라인 `role="alert"` 배너로 표시, 삭제 모달 닫음.
   - 상세 조회 실패 시 기존 NotFound 유지.

## 범위 밖

- 수정(update) 실 API는 별도.

## 검증

- `harness:api:policy`, lint, typecheck, build (⑩)
- Mock Playwright `yarn verify:api reservations-admin-delete` (⑪): DELETE path·200 이동·오류 알림.
- 실서버: `real_server.enabled=false` → 미실행.
