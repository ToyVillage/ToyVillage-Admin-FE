# Test Scenarios — dashboard-overall-operations-query (DASHBOARD_OVERALL_OPERATIONS_QUERY)

파일: `tests/e2e/api/dashboard-overall-operations-query.spec.ts` (Playwright `page.route()` mock)

사전 조건: 로그인 세션(`accessToken=test-access-token`)과 `mockDashboardApi(page)`로 대시보드 7개 조회를 기본 응답으로 막는다. `page.clock.setFixedTime(2026-09-03T12:30:00)`.
route 패턴은 `^https://[^/]+/dashboard/<path>(?:\?.*)?$`.

## S1: 진입 시 GET /dashboard/overall-operations 를 Bearer 토큰으로 1회 호출한다

## S2: 상태별 건수를 도넛 범례와 합계에 표시한다

- `{TOTAL:18, IN_PROGRESS:7, COMPLETED:9, EXPIRED:2}`
- `전체 업무` 영역 도넛 img 이름: `전체 업무 18건: 완료 9, 진행중 7, 지연 2`

## S3: 모두 0이면 `전체 업무 0건`

## S4: 500 → 대시보드 오류 상태

## S5: 응답 형식 오류 → 오류 상태

- `COMPLETED` 누락 또는 음수

## 범위 밖

- 실제 staging 서버 호출
