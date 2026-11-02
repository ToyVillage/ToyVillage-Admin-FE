# API Test Scenarios — app-feed-log-query-all-admin-by-date

공통 사전 조건: `support/feed-api`의 `mockFeedApi`가 `GET **/feed-log/admin`에 응답한다(오늘 4층 12건, 10건씩 2쪽).
`/feeds`(4층 탭)로 진입한다. 오류 body는 Contract 형식 `{ message, status, timestamp, description }`.
2026-10-29 범위 변경: 전체 활동 시나리오는 `app-all-activities-feed-log-query-fourth-floor`로 옮겼다.

## Mock S1 — 요청 형식

- 기대 결과: GET `/feed-log/admin` 1회, Bearer 헤더, query `date=<오늘>`·`page=1`·`size=10`. `animalTaxonomic`·`sort` 없음.

## Mock S2 — 열 매핑과 단위

- Mock response: 2건 — `{ animalKind: "이구아나", animalName: "초록", feedDateTime: "<오늘>T08:40:00", feedType: "청경채", feedAmount: 150, remainingAmount: 20, feedUnit: "GML", significant: null, staffName: "이승현" }`,
  `{ animalKind: "물범", animalName: "바다", feedDateTime: "<오늘>T16:22:00", feedType: "고등어", feedAmount: 1.2, remainingAmount: null, feedUnit: "KGL", significant: "콧잔등 상처", staffName: "김유영" }`
- 기대 결과: 1행 `이구아나` `초록` `08:40` `청경채` `150 g/ml` `20 g/ml` `-` `이승현`, 2행 `물범` `바다` `16:22` `고등어` `1.2 kg/l` `-` `콧잔등 상처` `김유영`.

## Mock S3 — 단위·특이사항 필드가 없을 때

- Mock response: `feedUnit`·`significant` 필드가 없는 1건(급여량 1.2, 잔량 0)
- 기대 결과: 급여량 `1.2 kg/l`(단위 없음 → `KGL`), 특이사항 `-`.

## Mock S4 — 페이지네이션

- 사용자 동작: `다음 페이지`
- 기대 결과: `page=2`로 다시 요청, 2행. `totalPageSize`(2)보다 뒤 페이지 버튼은 없다.

## Mock S5 — 빈 날짜

- Mock response: `{ feedLogs: [], totalPageSize: 0 }`
- 기대 결과: `해당 날짜에 급여 내역이 없습니다.`, 페이지네이션 없음.

## Mock S6 — 서버 오류(500)·응답 형식 오류

- Mock response: 500 / 200 `{}`
- 기대 결과: `급여 내역을 불러오지 못했습니다. 다시 시도해 주세요.`
