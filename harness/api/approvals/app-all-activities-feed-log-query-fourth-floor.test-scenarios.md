# API Test Scenarios — app-all-activities-feed-log-query-fourth-floor

공통 사전 조건: 오늘은 2026-10-27(화)로 고정한다. `support/activity-api` 가짜 서버가 `GET **/all-activities/...`에 응답한다.
기본 데이터는 2026-10-20 기록(4층 22건 · 5층 24건 · 관찰일지 5건, 퍼블리싱 mock과 같은 값)이고 다른 날짜는 빈 배열이다.
오류 body는 Contract 형식 `{ message, status, timestamp, description }`.
`/activity?tab=feed&date=2026-10-20&floor=4`로 진입한다.

## Mock S1 — 요청 형식

- 기대 결과: GET `/all-activities/feed-log/fourth-floor` 1회, Bearer 헤더, query는 `date=2026-10-20`만. `/feed-log/admin`·5층 API는 부르지 않는다.

## Mock S2 — 열 매핑과 단위

- Mock response: 1건 `{ animalKind: "물범", animalName: "바다", feedDateTime: "2026-10-20T16:22:00", feedType: "고등어", feedAmount: 2.5, remainingAmount: 0.3, feedUnit: "KGL", significant: "콧잔등 상처", staffName: "김유영", animalDeleted: false }`
- 기대 결과: 행이 `물범` `바다` `16:22` `고등어` `2.5 kg/l` `0.3 kg/l` `콧잔등 상처` `김유영`. 기본 데이터 1행은 `150 g/ml`·`20 g/ml`.

## Mock S3 — 특이사항·잔량이 없을 때

- Mock response: `significant` 없음 1건, `significant: null` 1건, `remainingAmount: null` 1건
- 기대 결과: 특이사항 `-`, 잔량 null은 `-`.

## Mock S4 — 급여시간 정렬

- Mock response: `feedDateTime` 순서가 뒤섞인 3건
- 기대 결과: 급여시간 오름차순.

## Mock S5 — 빈 날짜

- 사용자 동작: 다음 날짜(2026-10-21)
- 기대 결과: GET `date=2026-10-21` 1회, 빈 상태 `이 날짜에 올라온 먹이 급여 기록이 없어요`.

## Mock S6 — 서버 오류(500)·응답 형식 오류

- Mock response: 500 / 200 `{}`(배열 아님)
- 기대 결과: `먹이 급여 기록을 불러오지 못했어요. 다시 시도해 주세요.`(alert). 행·빈 상태 문구 없음.

## Mock S7 — 삭제된 개체

- Mock response: `animalDeleted: true` 1건
- 기대 결과: 다른 행과 같은 모양.
