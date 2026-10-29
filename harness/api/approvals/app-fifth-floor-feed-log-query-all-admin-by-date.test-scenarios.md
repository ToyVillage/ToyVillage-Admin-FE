# API Test Scenarios — app-fifth-floor-feed-log-query-all-admin-by-date

공통 사전 조건: `support/feed-api`의 `mockFeedApi`가 5층 가짜 서버를 띄운다(오늘 12건, 1행 `아로와나 · 아로 냉동새우 30 GML 박도현`).
2026-10-29 범위 변경: 전체 활동 시나리오(S1–S6)는 `app-all-activities-feed-log-query-fifth-floor`로 옮겼다. 번호는 그대로 둔다.

## Mock S7 — `/feeds` 요청 형식

- 사용자 동작: `/feeds?floor=5` 진입
- 기대 결과: GET `/feed-log/fifth-floor/admin` 1회, Bearer, query `date=<오늘>`·`page=1`·`size=10`. `animalTaxonomic`·`sort` 없음. 4층 목록 API(`/feed-log/admin`)는 부르지 않는다.

## Mock S8 — `/feeds` 페이지네이션

- 사용자 동작: `다음 페이지`
- 기대 결과: `page=2` 요청, 2행(`오순이`·`자이언`). `다음 페이지` 비활성.

## Mock S9 — `/feeds` 열 매핑과 단위

- 기대 결과: 1행 `아로와나` `아로` `냉동새우` `30 g/ml` `박도현`. 12번 행(`자이언트구라미`)은 `1.2 kg/l`.

## Mock S10 — `/feeds` 조회 실패

- Mock response: 500 / 200 `{}`
- 기대 결과: `급여 내역을 불러오지 못했습니다. 다시 시도해 주세요.`

