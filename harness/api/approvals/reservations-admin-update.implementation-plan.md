# Implementation Plan — RESERVATION_ADMIN_UPDATE

## 목표

상세 편집 폼의 `updateReservationMock`을 `PATCH /reservation/{reservationId}`(RESERVATION_ADMIN_UPDATE) 실 API로 교체. 바디·매핑은 생성과 공유.

## 변경/추가 파일

1. **신규** `src/entities/reservation/api/updateReservation.ts`
   - `updateReservation({ id, body }: { id: number; body: ReservationCreateRequest }): Promise<{ message: string }>`
     - id 유효성 → `api.patch('/reservation/${id}', body)` → 200 확인 + message 검증.
   - 응답 타입 `ReservationUpdateResponse = { message: string }`(또는 생성 응답 재사용).

2. **수정** `src/entities/reservation/index.ts` — `updateReservation` + 타입 export.

3. **수정** `src/pages/notices/reservations/ReservationDetailPage.tsx`
   - `saveMutation.mutationFn`을 `(next) => { const appAdminIds = currentAssignedIds.map(Number).filter(유효); return updateReservation({ id: Number(id), body: toCreateReservationRequest(next, appAdminIds) }) }`로 교체.
   - `onSuccess`(무효화 + 이동) 유지. `onError`: 서버 `message`를 인라인 alert로 표시(기존 deleteError 배너 재사용 또는 공용 submitError).
   - `handleSave`의 빈-필수 인라인 검증은 그대로 선행.

## 범위 밖

- 상세조회 응답 visitSite 부재는 백엔드 사안(프론트는 빈 값→검증이 저장을 막음). 이번 슬라이스에서 사전답사 값을 지어내지 않는다.

## 검증

- `harness:api:policy`, lint, typecheck, build (⑩)
- Mock Playwright `yarn verify:api reservations-admin-update` (⑪): PATCH path·바디 매핑·200 이동·오류 알림.
- 실서버: `real_server.enabled=false` → 미실행.
