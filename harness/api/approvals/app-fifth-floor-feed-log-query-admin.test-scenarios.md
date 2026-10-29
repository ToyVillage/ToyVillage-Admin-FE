# API Test Scenarios — app-fifth-floor-feed-log-query-admin

공통 사전 조건: `support/feed-api`의 `mockFeedApi`가 5층 가짜 서버를 함께 띄운다. 5층 기본 데이터는 퍼블리싱 mock과 같다 —
오늘 12건(급여일지 id 1–12, 10번 = 오스카 · 오돌이, 개체 id 10, 펠렛 15 GML, 박도현) + 오돌이 어제 1건(id 101, 이서준).
나머지 개체 id는 500번대. 개체 조회는 `support/animal-manage-api`. 오류 body는 Contract 형식 `{ message, status, timestamp, description }`.

## Mock S1 — 요청 형식

- 사용자 동작: `/feeds/fifth-floor/10` 진입
- 기대 결과: GET `/feed-log/fifth-floor/admin/10` 1회, Bearer 헤더. 4층 API(`/feed-log/admin/…`)는 부르지 않는다.

## Mock S2 — 칸 매핑과 단위

- Mock response: 기본(오스카 · 오돌이, 펠렛 15 GML, `feedDate` 오늘, 박도현) / `{ feedAmount: 1.2, feedUnit: "KGL" }`로 바꾼 응답
- 기대 결과: 대상 개체 `오스카 · 오돌이`, 급여일 `YYYY.MM.DD`(오늘), 급여자 `박도현`, 먹이 종류 `펠렛`, 급여량 `15 g/ml` / `1.2 kg/l`.
  잔량·특이사항 칸은 없다.

## Mock S3 — 급여 이력 보기

- 사용자 동작: `급여 이력 보기`
- 기대 결과: 응답 `animalId`(10)로 `/feeds/fifth-floor/animals/10`에 간다.

## Mock S4 — 없는 기록(404)

- Mock response: 404
- 기대 결과: `/feeds`로 돌아간다.

## Mock S5 — 서버 오류(500)·응답 형식 오류

- Mock response: 첫 요청 500 → 다시 시도 시 정상 / 200 `{}`
- 기대 결과: `정보를 불러오지 못했습니다` 오류 카드, `다시 시도`로 회복. 형식 오류도 오류 카드.
