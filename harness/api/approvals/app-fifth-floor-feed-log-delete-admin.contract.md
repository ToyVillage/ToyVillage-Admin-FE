# API Contract — APP_FIFTH_FLOOR_FEED_LOG_DELETE_ADMIN

## Source

- Notion 검색(`5층`·`FIFTH`) 0건 → 개발자가 준 staging Swagger만 기준(개발자 지시 2026-10-28 "무조건 스웨거대로"). API ID는 제안값.
- Swagger: `https://api-stag.toyvillage.kr/v3/api-docs`(App) `DELETE /feed-log/fifth-floor/admin/{feedLogId}`, operationId `deleteFeedLog`, tag `fifth-floor-feed-log-controller`
- 원본: `app-fifth-floor-feed-log-delete-admin.swagger-source.json` (checkedAt 2026-10-29)
- `source.apiIdMatchCount: 0` + `source.swagger`

## Basic Information

| API ID | Name | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- |
| APP_FIFTH_FLOOR_FEED_LOG_DELETE_ADMIN | 관리자 5층 급여일지 삭제 | DELETE | /feed-log/fifth-floor/admin/{feedLogId} | application/json |

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

`DELETE /feed-log/fifth-floor/admin/10`

## Success Responses

`200` — 본문 없음(Swagger에 응답 본문 정의 없음). 본문은 읽지 않는다.

## Error Responses

| Status | Description |
| --- | --- |
| 403 | 토큰 없음/만료/권한 없음(공통 인터셉터) |
| 404 | 해당 급여일지를 찾을 수 없습니다. → 삭제 실패 토스트 |
| 405 | 지원하지 않는 메서드 형식입니다. |
| 500 | 내부 서버 오류가 발생했습니다. |

## Validation and Constraints

없음

## Notes

- Swagger와 차이 없음.

## Backend Questions

1. Notion 명세 DB에 이 API를 추가해 달라(제안 ID `APP_FIFTH_FLOOR_FEED_LOG_DELETE_ADMIN`).
2. 접근 역할, 성공 status(200·204) 명시 요청.
