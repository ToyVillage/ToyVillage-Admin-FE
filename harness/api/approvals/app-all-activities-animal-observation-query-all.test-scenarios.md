# API Test Scenarios — app-all-activities-animal-observation-query-all

공통 사전 조건: 오늘은 2026-10-27(화)로 고정한다. `support/activity-api` 가짜 서버가 `GET **/all-activities/...`에 응답한다.
기본 데이터는 2026-10-20 기록(4층 22건 · 5층 24건 · 관찰일지 5건, 퍼블리싱 mock과 같은 값)이고 다른 날짜는 빈 배열이다.
오류 body는 Contract 형식 `{ message, status, timestamp, description }`.
`/activity?tab=observation&date=2026-10-20`으로 진입한다.

## Mock S1 — 요청 형식

- 기대 결과: GET `/all-activities/animal-observation` 1회, Bearer 헤더, query는 `date=2026-10-20`만. 먹이 급여 API는 부르지 않는다.

## Mock S2 — 열 매핑

- Mock response: 1건 `{ animalObservationId: 7, animalManageId: 3, animalKind: "라쿤", animalName: "보미", animalDeleted: false, createdAt: "2026-10-20T11:20:00", title: "왼쪽 앞발 절뚝임", authorName: "이서준", fileCount: 2 }`
- 기대 결과: 행이 `11:20` `라쿤` `보미` `왼쪽 앞발 절뚝임` `이서준`, 첨부 칸은 퍼블리싱과 같은 2개 표기. 첨부 0이면 퍼블리싱의 0개 표기.

## Mock S3 — 작성시간 정렬

- Mock response: `createdAt` 순서가 뒤섞인 3건
- 기대 결과: 작성시간 오름차순.

## Mock S4 — 빈 날짜

- 기대 결과: 2026-10-21로 이동하면 빈 상태 `이 날짜에 올라온 관찰일지가 없어요`.

## Mock S5 — 서버 오류(500)·응답 형식 오류

- Mock response: 500 / 200 `{}`
- 기대 결과: `관찰일지를 불러오지 못했어요. 다시 시도해 주세요.`(alert). 행·빈 상태 문구 없음.
