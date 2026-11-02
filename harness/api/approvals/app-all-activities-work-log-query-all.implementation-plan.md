# Implementation Plan — app-all-activities-work-log-query-all

## 승인 기준

- `GET /all-activities/work-log?date`, Bearer, ADMIN. 배열 응답. `writeAt` date-time. Swagger와 차이 없음.
- 실제 서버 테스트 disabled.

## 변경 파일

- `src/entities/activity/api/types.ts` — `WorkLogResponse`(workLogId·writeAt·templateTitle·title·authorName·fileCount) 추가.
- `src/entities/activity/api/activityApi.ts` — `getWorkLogActivities`를 `getActivityList('/all-activities/work-log', date, isWorkLog)`로 교체.
  작성시간=`writeAt.slice(11, 16)`, 작성시간 오름차순(같으면 응답 순서 유지). mock import 제거.
- `src/entities/activity/model/mock.ts` — 삭제(업무일지 mock만 남아 있었다). 주석으로 mock을 가리키던 곳 정리.
- `src/pages/activity/ActivityPage.tsx` — 업무일지 query `staleTime: 0`, 표에 `failed`·`failedTitle`(`업무일지를 불러오지 못했어요. 다시 시도해 주세요.`).
- `tests/e2e/support/activity-api.ts` — 업무일지 경로(`workLogPattern`)·`workLog()` 헬퍼·2026-10-20 기본 5건(퍼블리싱 mock과 같은 값) 추가, `requests.workLog` 기록.
- 신규 `tests/e2e/api/app-all-activities-work-log-query-all.spec.ts`.

## 오류 처리

- 500·405·네트워크·형식 오류 → 표 빈 자리 실패 문구(alert). 401·403은 공통 인터셉터.

## 검증 순서

1. `yarn harness:api:gate app-all-activities-work-log-query-all`
2. `yarn harness:api:policy app-all-activities-work-log-query-all <변경된 src 파일>`
3. `yarn lint` · `yarn typecheck` · `yarn build`
4. `yarn verify:api app-all-activities-work-log-query-all`
5. 회귀: `yarn verify:e2e activity`, 전체 활동 API e2e 3개

## 승인 시 확정 필요

1. Notion에 없는 API — Swagger만 기준, 제안 API ID, 역할 ADMIN, 필드 필수 여부.
2. 업무일지 탭 실패 문구 `업무일지를 불러오지 못했어요. 다시 시도해 주세요.`(디자인에 없음).
3. 기존 기록의 작성시간 `00:00`은 그대로 표시.
