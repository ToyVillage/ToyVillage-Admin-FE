# API Contract — APP_FIFTH_FLOOR_FEED_LOG_QUERY_ADMIN

## Source

- Notion 검색(`5층`·`FIFTH`) 0건 → 개발자가 준 staging Swagger만 기준(개발자 지시 2026-10-28 "무조건 스웨거대로"). API ID는 제안값.
- Swagger: `https://api-stag.toyvillage.kr/v3/api-docs`(App) `GET /feed-log/fifth-floor/admin/{feedLogId}`, operationId `getAdminFeedLogDetail`, tag `fifth-floor-feed-log-controller`
- 원본: `app-fifth-floor-feed-log-query-admin.swagger-source.json` (checkedAt 2026-10-29)
- `source.apiIdMatchCount: 0` + `source.swagger`

## Basic Information

| API ID | Name | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- |
| APP_FIFTH_FLOOR_FEED_LOG_QUERY_ADMIN | 관리자 5층 급여일지 상세 조회 | GET | /feed-log/fifth-floor/admin/{feedLogId} | application/json |

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
| feedLogId | integer(int64) | true | 10 | 5층 급여일지 id |

## Query Parameters

없음

## Request Body

없음

## Request Example

`GET /feed-log/fifth-floor/admin/10`

## Success Responses

`200` — `FifthFloorFeedLogAdminDetailResponse`

| Name | Type | Required | Nullable | Example | Description |
| --- | --- | --- | --- | --- | --- |
| animalId | integer(int64) | true | false | 10 | 개체 id. `급여 이력 보기` 이동 |
| staffName | string | true | false | 박도현 | 급여자 |
| animalKind | string | true | false | 오스카 | 일반명 |
| animalName | string | true | false | 오돌이 | 개체명 |
| animalDeleted | boolean | true | false | false | 구분 없이 표시 |
| animalImageUrl | object(fileName, fileKey) | false | true | — | 쓰지 않음 |
| feedType | string | true | false | 펠렛 | 먹이 종류 |
| feedAmount | number(float) | true | false | 15 | 급여량 |
| feedUnit | enum `GML`\|`KGL` | true | false | GML | `GML`→`g/ml`, `KGL`→`kg/l`. 수정 요청에 원본 |
| feedDate | string(date) | true | false | 2026-10-29 | 급여일 `YYYY.MM.DD`. 수정 요청에 원본 |

## Error Responses

| Status | Description |
| --- | --- |
| 403 | 토큰 없음/만료/권한 없음(공통 인터셉터) |
| 404 | 해당 급여일지를 찾을 수 없습니다. → `/feeds`(또는 들어온 곳)로 돌아간다 |
| 405 | 지원하지 않는 메서드 형식입니다. |
| 500 | 내부 서버 오류가 발생했습니다. |

## Validation and Constraints

- `feedLogId`는 양의 정수. 아니면 요청하지 않고 `/feeds`로 돌아간다(퍼블리싱 동작).

## Notes

- Swagger와 차이 없음. 필드 필수 여부는 Swagger에 없어 5층 목록과 같이 필수로 둔다(`animalImageUrl`만 선택).

## Backend Questions

1. Notion 명세 DB에 이 API를 추가해 달라(제안 ID `APP_FIFTH_FLOOR_FEED_LOG_QUERY_ADMIN`).
2. 접근 역할·필드 nullable 명시 요청.
