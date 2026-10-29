# API Test Scenarios — app-fifth-floor-feed-log-query-history-admin

공통 사전 조건: `support/feed-api`의 `mockFeedApi`가 5층 가짜 서버를 함께 띄운다. 5층 기본 데이터는 퍼블리싱 mock과 같다 —
오늘 12건(급여일지 id 1–12, 10번 = 오스카 · 오돌이, 개체 id 10, 펠렛 15 GML, 박도현) + 오돌이 어제 1건(id 101, 이서준).
나머지 개체 id는 500번대. 개체 조회는 `support/animal-manage-api`. 오류 body는 Contract 형식 `{ message, status, timestamp, description }`.

## Mock S1 — 요청 형식

- 사용자 동작: `/feeds/fifth-floor/animals/10` 진입
- 기대 결과: GET `/feed-log/fifth-floor/admin/history/10` 1회, Bearer 헤더. 4층 이력 API는 부르지 않는다.

## Mock S2 — 열 매핑·단위·최신순

- Mock response: `feedLogs` 3건을 날짜 오름차순으로 응답(어제 `냉동새우 1.5 KGL 이서준`, 오늘 `펠렛 15 GML 박도현`, 그저께 `펠렛 10 GML 박도현`)
- 기대 결과: 행이 오늘 → 어제 → 그저께 순서. 1행 `YYYY.MM.DD`(오늘) `펠렛` `15 g/ml` `박도현`, 2행 급여량 `1.5 kg/l`. `3건`.

## Mock S3 — 이력 없음(404)·빈 배열

- Mock response: 404 / 200 `{ feedLogs: [] }`
- 기대 결과: `급여 이력이 없습니다.`, `0건`. 오류 카드는 없다.

## Mock S4 — 서버 오류(500)·응답 형식 오류

- Mock response: 첫 요청 500 → 다시 시도 시 정상 / 200 `{}`
- 기대 결과: 오류 카드, `다시 시도`로 회복.

## Mock S5 — 행 클릭

- 사용자 동작: 1행 클릭
- 기대 결과: `/feeds/fifth-floor/<그 행 feedLogId>`로 간다.

## Mock S6 — 개체 상세에서 5층 이력 찾기

- 사전 조건: 4층 이력 404, 5층 이력 1건 이상(개체 10 = 딸기)
- 사용자 동작: `/species/<종>/individuals/10`에서 `먹이 급여 기록 확인하기`
- 기대 결과: 4층 → 5층 순으로 조회하고 `/feeds/fifth-floor/animals/10`으로 간다. 5층도 404면 `급여 기록이 없습니다` 토스트, 5층 500이면 `급여 기록을 불러오지 못했습니다` 토스트.
