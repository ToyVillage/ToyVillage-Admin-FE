# Test Scenarios — dashboard-animal-observation-query-all (DASHBOARD_ANIMAL_OBSERVATION_QUERY_ALL)

파일: `tests/e2e/api/dashboard-animal-observation-query-all.spec.ts` (Playwright `page.route()` mock)

사전 조건: 로그인 세션(`accessToken=test-access-token`)과 `mockDashboardApi(page)`로 대시보드 7개 조회를 기본 응답으로 막는다. `page.clock.setFixedTime(2026-09-03T12:30:00)`.
route 패턴은 `^https://[^/]+/dashboard/<path>(?:\?.*)?$`.

## S1: 진입 시 GET /dashboard/animal-observations?page=1&size=3 을 Bearer 토큰으로 1회 호출한다

- `page=1`, `size=3`, `sort` 없음

## S2: content 를 `개체관리` 카드 행으로 표시한다

- content `[{title:"식욕 저하 관찰",createdAt:"2026-09-03T09:30:00"}, {title:"건강 상태 양호",createdAt:"2026-09-01T10:05:00"}]`
- 행 1 `식욕 저하 관찰` / `3시간 전`, 행 2 `건강 상태 양호` / `2026.09.01`

## S3: 4건 이상 내려와도 3행만 표시한다

## S4: 빈 content → `최근 관찰 기록이 없습니다.`

## S5: 400 → 대시보드 오류 상태

## S6: 500 → 대시보드 오류 상태

## S7: 응답 형식 오류 → 오류 상태

- `content` 누락 또는 항목 필드 타입 불일치

## 범위 밖

- 실제 staging 서버 호출
- 정렬 보정(서버 순서를 그대로 표시)
