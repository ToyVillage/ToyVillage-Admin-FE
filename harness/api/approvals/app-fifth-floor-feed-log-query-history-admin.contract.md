# API Contract — APP_FIFTH_FLOOR_FEED_LOG_QUERY_HISTORY_ADMIN

## Source

- Notion 검색(`5층`·`FIFTH`) 0건 → 개발자가 준 staging Swagger만 기준(개발자 지시 2026-10-28 "무조건 스웨거대로"). API ID는 제안값.
- Swagger: `https://api-stag.toyvillage.kr/v3/api-docs`(App) `GET /feed-log/fifth-floor/admin/history/{animalManageId}`, operationId `getAdminFeedLogHistory`, tag `fifth-floor-feed-log-controller`
- 원본: `app-fifth-floor-feed-log-query-history-admin.swagger-source.json` (checkedAt 2026-10-29)
- `source.apiIdMatchCount: 0` + `source.swagger`

## Basic Information

| API ID | Name | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- |
| APP_FIFTH_FLOOR_FEED_LOG_QUERY_HISTORY_ADMIN | 관리자 5층 개체별 급여 이력 조회 | GET | /feed-log/fifth-floor/admin/history/{animalManageId} | application/json |

## Authentication and Authorization

| Required | Type | Roles |
| --- | --- | --- |
| true | Bearer | ADMIN |

- 역할은 Swagger에 없어 5층 목록(`APP_FIFTH_FLOOR_FEED_LOG_QUERY_ALL_ADMIN_BY_DATE`)과 맞췄다.

## Request Headers

| Name | Required | Example |
| --- | --- | --- |
| Authorization | true | `Bearer <access-token>` |

## Path Parameters

| Name | Type | Required | Example | Description |
| --- | --- | --- | --- | --- |
| animalManageId | integer(int64) | true | 10 | 개체 id |

## Query Parameters

없음

## Request Body

없음

## Request Example

`GET /feed-log/fifth-floor/admin/history/10`

## Success Responses

`200` — `FifthFloorFeedLogHistoryResponse`

| Name | Type | Required | Nullable | Example | Description |
| --- | --- | --- | --- | --- | --- |
| feedLogs | array<object> | true | false | — | 그 개체의 급여일지 전체 |
| feedLogs.feedLogId | integer(int64) | true | false | 10 | 행 key, 상세 이동 |
| feedLogs.staffName | string | true | false | 박도현 | 급여자 |
| feedLogs.feedType | string | true | false | 펠렛 | 먹이 종류 |
| feedLogs.feedAmount | number(float) | true | false | 15 | 급여량 |
| feedLogs.feedUnit | enum `GML`\|`KGL` | true | false | GML | 단위 |
| feedLogs.feedDate | string(date) | true | false | 2026-10-29 | 급여일. 화면에서 최신순 정렬 |

## Error Responses

| Status | Description |
| --- | --- |
| 403 | 토큰 없음/만료/권한 없음(공통 인터셉터) |
| 404 | 이력 없음으로 본다(빈 표) — 4층 이력과 같은 규칙 |
| 405 | 지원하지 않는 메서드 형식입니다. |
| 500 | 내부 서버 오류가 발생했습니다. |

## Validation and Constraints

- `animalManageId`는 양의 정수.

## Notes

- Swagger와 차이 없음. 404의 뜻·정렬 기준은 Swagger에 없다.

## Backend Questions

1. Notion 명세 DB에 이 API를 추가해 달라(제안 ID `APP_FIFTH_FLOOR_FEED_LOG_QUERY_HISTORY_ADMIN`).
2. 404가 '개체 없음'인지 '이력 없음'인지, 이력이 없을 때 200 빈 배열인지 명시 요청. 정렬 기준 명시 요청.
