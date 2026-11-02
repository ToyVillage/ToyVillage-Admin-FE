# Implementation Plan — app-all-activities-feed-log-query-fifth-floor

전체 활동 세 연동은 같은 파일을 쓰므로 모두 승인된 뒤 함께 구현한다.

## 승인 기준

- `GET /all-activities/feed-log/fifth-floor?date`, Bearer, ADMIN. 배열 응답. Swagger와 차이 없음.
- 실제 서버 테스트 disabled.

## 변경 파일

- `src/entities/activity/api/types.ts` — 응답 타입을 전용 API 배열 항목으로 바꾼다. 페이지 래퍼 타입 제거.
- `src/entities/activity/api/activityApi.ts` — 4층·5층·관찰일지를 `api.get<unknown>(path, { params: { date } })` + 배열 타입 가드로 교체. 이어 받기 제거. 날짜 형식이 아니면 throw.
  4층은 급여시간 오름차순, 5층은 응답 순서, 관찰일지는 작성시간 오름차순.
- `src/entities/activity/model/mock.ts` — 관찰일지 mock 제거(업무일지 mock 유지).
- `src/pages/activity/ActivityPage.tsx` — 관찰 탭 query `staleTime: 0`·`failed`. `ActivityTable`이 실패 문구를 prop으로 받는다(먹이 급여 문구 그대로, 관찰은 `관찰일지를 불러오지 못했어요. 다시 시도해 주세요.`).
- `tests/e2e/support/activity-api.ts` — 가짜 서버 경로를 `/all-activities/...`로, 응답을 배열로, 관찰일지 경로 추가(2026-10-20 5건).
- 신규 `tests/e2e/api/app-all-activities-feed-log-query-fifth-floor.spec.ts`.

## 오류 처리

- 500·405·네트워크·형식 오류 → 표 빈 자리 실패 문구(alert). 401·403은 공통 인터셉터.

## 검증 순서

1. `yarn harness:api:gate app-all-activities-feed-log-query-fifth-floor`
2. `yarn harness:api:policy app-all-activities-feed-log-query-fifth-floor <변경된 src 파일>`
3. `yarn lint` · `yarn typecheck` · `yarn build`
4. `yarn verify:api app-all-activities-feed-log-query-fifth-floor`
5. 회귀: `yarn verify:e2e activity`

## 승인 시 확정 필요

1. Notion에 없는 API — Swagger만 기준, 제안 API ID, 역할 ADMIN, 필드 필수 여부.
