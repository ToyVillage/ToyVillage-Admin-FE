# Implementation Plan — app-fifth-floor-feed-log-query-all-admin-by-date

2026-10-29 범위 변경: 전체 활동 시나리오를 빼고 `/feeds` 5층 탭만 남긴다. 코드 구현은 이미 있다.

## 승인 기준

- `GET /feed-log/fifth-floor/admin?date&page&size=10`, Bearer, ADMIN. `animalTaxonomic`·`sort`는 보내지 않는다. page 1-based.
- 응답 `feedLogs[]`(계약 필드만) + `totalPageSize`. Swagger와 차이 없음.
- 실제 서버 테스트 disabled.

## 변경 파일

- `src/entities/feed/api/fifthFloorFeedApi.ts` — 변경 없음.
- `tests/e2e/api/app-fifth-floor-feed-log-query-all-admin-by-date.spec.ts` — S1–S6(전체 활동)과 시각 고정을 지우고 S7–S10만 둔다.

## 검증 순서

1. `yarn harness:api:gate app-fifth-floor-feed-log-query-all-admin-by-date`
2. `yarn verify:api app-fifth-floor-feed-log-query-all-admin-by-date`
3. 회귀: `yarn verify:e2e feed-list`

## 승인 시 확정 필요

1. 범위를 `/feeds` 5층 탭으로 옮기는 것(전체 활동은 전용 API).
