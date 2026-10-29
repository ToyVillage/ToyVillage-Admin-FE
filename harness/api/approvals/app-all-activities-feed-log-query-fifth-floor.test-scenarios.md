# API Test Scenarios — app-all-activities-feed-log-query-fifth-floor

공통 사전 조건: 오늘은 2026-10-27(화)로 고정한다. `support/activity-api` 가짜 서버가 `GET **/all-activities/...`에 응답한다.
기본 데이터는 2026-10-20 기록(4층 22건 · 5층 24건 · 관찰일지 5건, 퍼블리싱 mock과 같은 값)이고 다른 날짜는 빈 배열이다.
오류 body는 Contract 형식 `{ message, status, timestamp, description }`.
`/activity?tab=feed&date=2026-10-20&floor=5`로 진입한다.

## Mock S1 — 요청 형식

- 기대 결과: GET `/all-activities/feed-log/fifth-floor` 1회, Bearer 헤더, query는 `date=2026-10-20`만. 4층 API·`/feed-log/fifth-floor/admin`은 부르지 않는다.

## Mock S2 — 열 매핑과 단위

- Mock response: 1건 `{ animalKind: "아로와나", animalName: "아로", feedType: "냉동새우", feedAmount: 1.5, feedUnit: "KGL", staffName: "박도현", animalDeleted: false }`
- 기대 결과: `아로와나` `아로` `냉동새우` `1.5 kg/l` `박도현`. 기본 데이터 1행은 `30 g/ml`.

## Mock S3 — 응답 순서 유지

- 기대 결과: 기본 24건이 응답 순서대로(첫 행 `아로와나`, 마지막 행 `징기스칸`).

## Mock S4 — 빈 날짜

- 기대 결과: 2026-10-21로 이동하면 빈 상태.

## Mock S5 — 서버 오류(500)·응답 형식 오류

- Mock response: 500 / 200 `{}`
- 기대 결과: `먹이 급여 기록을 불러오지 못했어요. 다시 시도해 주세요.`(alert).
