# API Contract — APP_FEED_LOG_QUERY_ALL_ADMIN_BY_DATE

## Source

- 개발자 지시(2026-10-28): **staging Swagger만 기준**으로 삼는다. Notion 행(`https://app.notion.com/p/590e8d82a45083c4a0fd010bd90cc5f0`)은 API ID만 빌려 쓴다.
- Swagger: `https://api-stag.toyvillage.kr/v3/api-docs`(App) `GET /feed-log/admin`, operationId `getFeedLogList_1`, tag `feed-log-controller`
- 원본: `app-feed-log-query-all-admin-by-date.swagger-source.json` (checkedAt 2026-10-28)
- `source.apiIdMatchCount: 0` + `source.swagger` (Swagger만 기준)

## Basic Information

| API ID | Name | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- |
| APP_FEED_LOG_QUERY_ALL_ADMIN_BY_DATE | 관리자 날짜별 급여일지 목록 조회 | GET | /feed-log/admin | application/json |

## Authentication and Authorization

| Required | Type | Roles |
| --- | --- | --- |
| true | Bearer | ADMIN |

- Swagger 전역 `bearerAuth`. 역할은 Swagger에 없어 같은 컨트롤러 관리자 API와 맞춰 ADMIN.

## Request Headers

| Name | Required | Example |
| --- | --- | --- |
| Authorization | true | `Bearer <access-token>` |

## Path Parameters

없음

## Query Parameters

| Name | Type | Required | Nullable | Example | Description |
| --- | --- | --- | --- | --- | --- |
| date | string(date) | true | false | 2026-10-20 | 조회 날짜 |
| animalTaxonomic | enum `MAMMALS`\|`REPTILES`\|`FISH`\|`BIRDS` | false | false | — | `/feeds`는 보내지 않는다(4층·5층 탭 수정안) |
| page | integer(int32, min 0) | true | false | 1 | Swagger는 `pageable` 필수 객체. `/feeds`와 같은 1-based로 보낸다(개발자 결정) |
| size | integer(int32, min 1) | true | false | 10 | `/feeds` 목록 페이지 크기 10. `totalPageSize`로 페이지네이션 |
| sort | array<string> | false | false | — | 보내지 않는다 |

## Request Body

없음

## Success Responses

`200` — `FeedLogAdminQueryListResponse`

| Name | Type | Required | Nullable | Example | Description |
| --- | --- | --- | --- | --- | --- |
| feedLogs | array<object> | true | false | — | 이 페이지의 급여일지 |
| feedLogs.feedLogId | integer(int64) | true | false | 1 | 행 key |
| feedLogs.staffName | string | true | false | 이승현 | 급여자 |
| feedLogs.animalKind | string | true | false | 이구아나 | 일반명 |
| feedLogs.animalName | string | true | false | 초록 | 개체명 |
| feedLogs.animalDeleted | boolean | true | false | false | 화면은 구분 없이 표시(개발자 결정) |
| feedLogs.feedType | string | true | false | 청경채 | 먹이 종류 |
| feedLogs.feedAmount | number(float) | true | false | 150 | 급여량 |
| feedLogs.remainingAmount | number(float) | true | **true** | 20 | 잔량. 잔량 도입 전 기록은 null 가능(`/feeds`와 같은 가정) |
| feedLogs.feedUnit | enum `GML`\|`KGL` | true | false | GML | `GML`→`g/ml`, `KGL`→`kg/l`(개발자 결정) |
| feedLogs.feedDateTime | datetime | true | false | 2026-10-20T08:40:00 | 급여시간(`HH:mm`) |
| feedLogs.significant | string | **false** | **true** | 탈피 진행 중 | **Swagger에 없음.** 백엔드 추가 요청 중(개발자 결정). 없으면 `-` |
| totalPageSize | integer(int32) | true | false | 1 | 총 페이지 수 |

- required·nullable은 Swagger에 표기가 없어 위처럼 정했다(개발자 결정 범위: `remainingAmount` nullable, `significant` optional).

## Error Responses

공통 오류 바디 `message`·`status`·`timestamp`·`description`

| Status | Description |
| --- | --- |
| 403 | 토큰 없음/만료/권한 없음(이 서버는 만료 토큰도 403 — 공통 인터셉터가 재발급) |
| 405 | 지원하지 않는 메서드 형식입니다. |
| 500 | 내부 서버 오류가 발생했습니다. |

## Validation and Constraints

- `date`는 `YYYY-MM-DD`.

## Notes

- Swagger와의 차이 `feedLogs.significant`는 `swagger-known-diffs.json`에 사유와 함께 기록했다.

## Backend Questions

1. 목록 응답에 `significant`(특이사항)를 넣어 달라(앱 4층 입력 칸, 전체 활동 표 열).
2. `page`가 0-based인지 1-based인지 확인 필요(`/feeds`는 1-based로 동작 중).
3. 정렬 기준(급여시간 오름차순 등) 명시 요청.
4. 필드별 nullable 명시 요청(`remainingAmount`).
