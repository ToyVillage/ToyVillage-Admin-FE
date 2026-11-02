# API Test Scenarios — app-all-activities-work-log-query-all

공통 사전 조건: 오늘은 2026-10-27(화)로 고정한다. `support/activity-api` 가짜 서버가 `GET **/all-activities/...`에 응답한다.
기본 데이터는 2026-10-20 기록(업무일지 5건, 퍼블리싱 mock과 같은 값)이고 다른 날짜는 빈 배열이다.
오류 body는 Contract 형식 `{ message, status, timestamp, description }`.
`/activity?tab=work-log&date=2026-10-20`으로 진입한다.

## Mock S1 — 요청 형식

- 기대 결과: GET `/all-activities/work-log` 1회, Bearer 헤더, query는 `date=2026-10-20`만. 먹이 급여·관찰일지 API는 부르지 않는다.

## Mock S2 — 열 매핑

- Mock response: 2건 `{ workLogId: 7, writeAt: "2026-10-20T12:40:00", templateTitle: "사육장 청소일지", title: "파충류관 사육장 청소", authorName: "이서준", fileCount: 2 }`, `{ workLogId: 8, writeAt: "2026-10-20T13:00:00", fileCount: 0 }`
- 기대 결과: 첫 행이 `12:40` `사육장 청소일지` `파충류관 사육장 청소` `이서준`, 첨부 칸은 퍼블리싱과 같은 `2개` 표기. 첨부 0이면 `-`.

## Mock S3 — 작성시간 정렬

- Mock response: `writeAt` 순서가 뒤섞인 3건(`15:00`, `00:00`, `08:30`)
- 기대 결과: 작성시간 오름차순 `00:00` `08:30` `15:00`(DB 변경 전 기록의 `00:00`도 그대로 표시).

## Mock S4 — 빈 날짜

- 기대 결과: 2026-10-21로 이동하면 빈 상태 `이 날짜에 올라온 업무일지가 없어요`. 2026-10-21 요청 1회.

## Mock S5 — 서버 오류(500)·응답 형식 오류

- Mock response: 500 / 200 `{}`
- 기대 결과: `업무일지를 불러오지 못했어요. 다시 시도해 주세요.`(alert). 표 머리 행은 보이고 행·빈 상태 문구 없음.
