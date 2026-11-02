# API Contract — APP_FIFTH_FLOOR_FEED_LOG_QUERY_ALL_ADMIN_BY_DATE

## Source

- Notion 검색(`5층`·`FIFTH`) 0건 → 개발자가 준 staging Swagger만 기준(개발자 지시 2026-10-28). API ID는 제안값.
- Swagger: `https://api-stag.toyvillage.kr/v3/api-docs`(App) `GET /feed-log/fifth-floor/admin`, operationId `getFeedLogList`, tag `fifth-floor-feed-log-controller`
- 원본: `app-fifth-floor-feed-log-query-all-admin-by-date.swagger-source.json` (checkedAt 2026-10-28)
- `source.apiIdMatchCount: 0` + `source.swagger`

## Basic Information

| API ID | Name | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- |
| APP_FIFTH_FLOOR_FEED_LOG_QUERY_ALL_ADMIN_BY_DATE | 관리자 날짜별 5층 급여일지 목록 조회 | GET | /feed-log/fifth-floor/admin | application/json |

## Authentication and Authorization

| Required | Type | Roles |
| --- | --- | --- |
| true | Bearer | ADMIN |

- 역할은 Swagger에 없어 4층 관리자 목록과 맞췄다.

## Request Headers

| Name | Required | Example |
| --- | --- | --- |
| Authorization | true | `Bearer <access-token>` |

## Path Parameters

없음

## Query Parameters

4층(`APP_FEED_LOG_QUERY_ALL_ADMIN_BY_DATE`)과 같다: `date`(필수), `animalTaxonomic`(보내지 않음), `page`(1-based, 1부터), `size`(`/feeds` 5층 탭 10), `sort`(보내지 않음).

## Request Body

없음

## Success Responses

`200` — `FifthFloorFeedLogAdminQueryListResponse`

| Name | Type | Required | Nullable | Example | Description |
| --- | --- | --- | --- | --- | --- |
| feedLogs | array<object> | true | false | — | 이 페이지의 급여일지 |
| feedLogs.feedLogId | integer(int64) | true | false | 1 | 행 key |
| feedLogs.staffName | string | true | false | 박도현 | 급여자 |
| feedLogs.animalKind | string | true | false | 아로와나 | 일반명 |
| feedLogs.animalName | string | true | false | 아로 | 개체명 |
| feedLogs.animalDeleted | boolean | true | false | false | 구분 없이 표시 |
| feedLogs.feedType | string | true | false | 냉동새우 | 먹이 종류 |
| feedLogs.feedAmount | number(float) | true | false | 30 | 급여량 |
| feedLogs.feedUnit | enum `GML`\|`KGL` | true | false | GML | `GML`→`g/ml`, `KGL`→`kg/l` |
| feedLogs.feedDate | string(date) | true | false | 2026-10-20 | 화면에 쓰지 않음 |
| totalPageSize | integer(int32) | true | false | 1 | 총 페이지 수 |

## Error Responses

| Status | Description |
| --- | --- |
| 403 | 토큰 없음/만료/권한 없음(공통 인터셉터) |
| 405 | 지원하지 않는 메서드 형식입니다. |
| 500 | 내부 서버 오류가 발생했습니다. |

## Validation and Constraints

- `date`는 `YYYY-MM-DD`.

## Notes

- Swagger와 차이 없음.

## Backend Questions

1. Notion 명세 DB에 이 API를 추가해 달라(제안 ID `APP_FIFTH_FLOOR_FEED_LOG_QUERY_ALL_ADMIN_BY_DATE`).
2. 접근 역할, `page` 기준, 정렬 기준(등록 순서인지), 필드 nullable 명시 요청.
