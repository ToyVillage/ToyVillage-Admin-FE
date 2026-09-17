# Test Scenarios — dashboard-feed-log-query-all (DASHBOARD_FEED_LOG_QUERY_ALL)

파일: `tests/e2e/api/dashboard-feed-log-query-all.spec.ts` (Playwright `page.route()` mock)

사전 조건: 로그인 세션(`accessToken=test-access-token`)과 `mockDashboardApi(page)`로 대시보드 7개 조회를 기본 응답으로 막는다. `page.clock.setFixedTime(2026-09-03T12:30:00)`.
route 패턴은 `^https://[^/]+/dashboard/<path>(?:\?.*)?$`.

## S1: 진입 시 GET /dashboard/feed-logs?page=1&size=3 을 Bearer 토큰으로 1회 호출한다

- `page=1`, `size=3`, `sort` 없음

## S2: content 를 `먹이 급여 관리` 카드 행으로 표시한다

- content `[{feedLogId:31,animalKind:"사자",animalName:"라이언",feedDateTime:"2026-09-03T09:30:00"}, {feedLogId:30,animalKind:"호랑이",animalName:"타이거",feedDateTime:"2026-09-02T16:10:00"}]`
- 행 1 `사자 · 라이언` / `2026.09.03 09:30`, 행 2 `호랑이 · 타이거` / `2026.09.02 16:10`

## S3: 4건 이상 내려와도 3행만 표시한다

## S4: 빈 content → `최근 먹이 급여 기록이 없습니다.`

## S5: 400 → 대시보드 오류 상태

## S6: 500 → 대시보드 오류 상태

## S7: 응답 형식 오류 → 오류 상태

- `content` 누락, 항목 필드 타입 불일치, `feedLogId` 누락

## S8: 행을 누르면 급여 상세로 이동한다

- `mockFeedApi(page)`로 급여 상세 조회를 막는다. content `feedLogId:2` 행 클릭 → URL `/feeds/2`

## 범위 밖

- 실제 staging 서버 호출
- 정렬 보정(서버 순서를 그대로 표시)
