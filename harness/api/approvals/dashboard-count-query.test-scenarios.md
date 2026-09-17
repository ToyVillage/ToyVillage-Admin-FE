# Test Scenarios — dashboard-count-query (DASHBOARD_COUNT_QUERY)

파일: `tests/e2e/api/dashboard-count-query.spec.ts` (Playwright `page.route()` mock)

사전 조건: 로그인 세션(`accessToken=test-access-token`)과 `mockDashboardApi(page)`로 대시보드 7개 조회를 기본 응답으로 막는다. `page.clock.setFixedTime(2026-09-03T12:30:00)`.
route 패턴은 `^https://[^/]+/dashboard/<path>(?:\?.*)?$`.

## S1: 진입 시 GET /dashboard/count 를 Bearer 토큰으로 1회 호출한다

- method GET, 쿼리 없음, `authorization: Bearer test-access-token`

## S2: 200 응답 건수를 KPI 카드에 표시한다

- `{feedLogCount:24, animalCount:3, workReportCount:12, workLogCount:8}`
- `먹이 급여 기록 24`, `개체 관리 3`, `업무보고 12`, `작성된 일지 8`

## S3: 0건도 0으로 표시한다

## S4: 500 → 대시보드 오류 상태

- `대시보드를 불러오지 못했습니다.` 표시, KPI 카드 없음

## S5: 응답 형식 오류 → 오류 상태

- 숫자 대신 문자열 또는 필드 누락

## S6: 응답 대기 중 로딩 문구

- count route 지연 → `대시보드를 불러오는 중입니다.`

## 공통 화면 연결 (네 spec 공유, 이 파일에서 검증)

### S7: 재사용 API 3개를 대시보드 조건으로 호출한다

- `GET /close-day` 1회
- `GET /work-report?page=1&size=3` — `status` 없음
- `GET /work-log?date=2026-09-03&page=0&size=3`

### S8: 재사용 API 응답을 카드에 표시한다

- 업무보고 행: `reports[].title` + 심사 상태 배지
- 업무일지 행: `templateTitle` / `writer`
- 휴관일: 이번 달 일정만 목록에 표시

### S9: 재사용 API 하나가 500이면 대시보드 오류 상태

### S10: 휴관일·업무보고·업무일지 행을 누르면 각 상세로 이동한다

- 휴관일 행(id 1) → `/notices/guide/1`
- 업무보고 행(id 7) → `/task-reports/7`
- 업무일지 행(workLogId 9) → `/work-logs/9`

### S11: 먹이 급여·개체관리 행은 링크다

- 먹이 급여 행(feedLogId 1) href `/feeds/1`
- 개체관리 행(animalObservationId 1, animalId 5) href `/individuals/5/observations/1`
- 이동 결과는 `dashboard-feed-log-query-all` S8, `dashboard-animal-observation-query-all` S8에서 검증한다.

## 범위 밖

- 실제 staging 서버 호출 (real_server.enabled=false)
- 카드 이동·레이아웃 (퍼블리싱 `dashboard` 시나리오)
- 401 재발급 (공통 `app-auth-reissue`)
