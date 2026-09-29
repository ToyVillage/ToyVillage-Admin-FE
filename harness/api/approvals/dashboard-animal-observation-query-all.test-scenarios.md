# Test Scenarios — dashboard-animal-observation-query-all (DASHBOARD_ANIMAL_OBSERVATION_QUERY_ALL)

파일: `tests/e2e/api/dashboard-animal-observation-query-all.spec.ts` (Playwright `page.route()` mock)

사전 조건: 로그인 세션(`accessToken=test-access-token`)과 `mockDashboardApi(page)`로 대시보드 7개 조회를 기본 응답으로 막는다. `page.clock.setFixedTime(2026-09-03T12:30:00)`.
route 패턴은 `^https://[^/]+/dashboard/<path>(?:\?.*)?$`.

## S1: 진입 시 GET /dashboard/animal-observations?page=1&size=3 을 Bearer 토큰으로 1회 호출한다

- `page=1`, `size=3`, `sort` 없음

## S2: content 를 `개체관리` 카드 행으로 표시한다

- content `[{animalObservationId:31,animalId:7,title:"식욕 저하 관찰",createdAt:"2026-09-03T09:30:00"}, {animalObservationId:30,animalId:7,title:"건강 상태 양호",createdAt:"2026-09-01T10:05:00"}]`
- 행 1 `식욕 저하 관찰` / `3시간 전`, 행 2 `건강 상태 양호` / `2026.09.01`

## S3: 4건 이상 내려와도 3행만 표시한다

## S4: 빈 content → `최근 관찰 기록이 없습니다.`

## S5: 400 → 대시보드 오류 상태

## S6: 500 → 대시보드 오류 상태

## S7: 응답 형식 오류 → 오류 상태

- `content` 누락, 항목 필드 타입 불일치, `animalObservationId`·`animalId` 누락

## S8: 행을 누르면 종 ID를 찾아 관찰 상세로 이동한다

- `mockAnimalManageApi(page, { animals: observationAnimals(), observations: observationFixture() })` (개체 7 = 종 1, 관찰 31 `식욕 감소`)
- content `animalObservationId:31, animalId:7` 행 클릭 → `/individuals/7/observations/31` → `GET /animal-manage/7` → URL `/species/1/individuals/7/observations/31`, 제목 `식욕 감소` 표시
- 뒤로 가기 시 대시보드(`/`)로 돌아간다(`replace` 이동)

## S9: 경유 경로 — 개체 조회 중 로딩 문구

- `GET /animal-manage/7` 지연 → `관찰 기록을 불러오는 중입니다.`

## S10: 경유 경로 — 개체 404 → `관찰 기록을 찾을 수 없습니다.`

## S11: 경유 경로 — 개체 500 → `관찰 기록을 불러오지 못했습니다. 다시 시도해 주세요.`

## S12: 경유 경로 — id가 양의 정수가 아니면 요청 없이 찾을 수 없음

- `/individuals/abc/observations/31` → `GET /animal-manage/*` 호출 0회, `관찰 기록을 찾을 수 없습니다.`

## 범위 밖

- 실제 staging 서버 호출
- 정렬 보정(서버 순서를 그대로 표시)
