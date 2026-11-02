# Implementation Plan — app-feed-log-query-all-admin-by-date

2026-10-29 범위 변경: 전체 활동 → `/feeds` 4층 탭. 코드 구현은 이미 있으므로 테스트를 `/feeds` 기준으로 다시 쓴다.

## 승인 기준

- `GET /feed-log/admin?date&page&size=10`, Bearer, ADMIN. `animalTaxonomic`·`sort`는 보내지 않는다. page 1-based.
- 응답 `feedLogs[]`(계약 필드만, `significant` optional·nullable) + `totalPageSize`.
- 실제 서버 테스트 disabled.

## 변경 파일

- `src/entities/feed/api/feedApi.ts` — 변경 없음(이미 계약대로).
- `tests/e2e/api/app-feed-log-query-all-admin-by-date.spec.ts` — 전체 활동 시나리오를 지우고 `/feeds` 4층 시나리오(S1–S6)로 다시 쓴다(`support/feed-api`).

## 오류 처리

- 500·405·네트워크·형식 오류 → `급여 내역을 불러오지 못했습니다. 다시 시도해 주세요.` 401·403은 공통 인터셉터.

## 검증 순서

1. `yarn harness:api:gate app-feed-log-query-all-admin-by-date`
2. `yarn verify:api app-feed-log-query-all-admin-by-date`
3. 회귀: `yarn verify:e2e feed-list`

## 승인 시 확정 필요

1. 범위를 `/feeds` 4층 탭으로 옮기는 것(전체 활동은 전용 API).
