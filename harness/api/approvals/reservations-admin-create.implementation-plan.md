# Implementation Plan — RESERVATION_ADMIN_CREATE

## 목표

생성 페이지의 `createReservationMock`을 `POST /reservation`(RESERVATION_ADMIN_CREATE) 실 API로 교체. 폼 값 → 요청 바디 변환, 성공 201 → 목록 복귀.

## 변경/추가 파일

1. **신규** `src/features/reservation-form/model/format.ts`에 시간 역변환 헬퍼 추가(또는 인접):
   - `partsTo24hClock(rawDigits: string, ampm: AmPm): string` — 12h raw(예 `"1000"`) + am/pm → `"HH:mm"` 24h. (12am→00, 12pm→12, 그 외 pm+12)

2. **신규** `src/entities/reservation/api/createReservation.ts`
   - `ReservationCreateRequest` 타입(16필드; `appAdminIds?: number[]`).
   - `createReservation(body): Promise<{ message: string }>` — `api.post('/reservation', body)`, 201 확인, 응답 message 검증.

3. **신규/수정** `src/features/reservation-form`에 폼→요청 매핑 유틸:
   - `toCreateReservationRequest(value: ReservationFormValue, appAdminIds: number[]): ReservationCreateRequest` — 위 매핑표대로(날짜 `.`→`-`, 시간 12h→24h, 콤마 제거→int).

4. **수정** `src/entities/reservation/index.ts` — `createReservation` + 타입 export.

5. **수정** `src/pages/notices/reservations/CreateReservationPage.tsx`
   - `createMutation`을 `createReservation(toCreateReservationRequest(value, appAdminIds))`로 교체.
   - `appAdminIds` = `permission.assignedIds` 중 **숫자 변환 가능한 것만** `Number` 매핑(결정 1: mock 후보 → 사실상 `[]`).
   - 성공 201 → 기존 `['reservations']` 무효화 + `/notices/reservations` 이동.
   - 실패 시 서버 `message`를 상단 인라인 `role="alert"` 배너로 표시(폼 유지).
   - 기존 빈-필수 인라인 검증(`validateReservationForm`)은 그대로 선행.

## 범위 밖

- 생성용 배정 직원 후보 실 API(직원 목록). 현재 mock 후보 유지 → `appAdminIds`는 숫자만 전송.
- 수정/삭제 실 API.

## 검증

- `harness:api:policy`, lint, typecheck, build (⑩)
- Mock Playwright `yarn verify:api reservations-admin-create` (⑪): 요청 바디 매핑/201 이동/오류 알림.
- 실서버: `real_server.enabled=false` → 미실행.
