# API Contract — APP_FIFTH_FLOOR_FEED_LOG_UPDATE_ADMIN

## Source

- Notion 검색(`5층`·`FIFTH`) 0건 → 개발자가 준 staging Swagger만 기준(개발자 지시 2026-10-28 "무조건 스웨거대로"). API ID는 제안값.
- Swagger: `https://api-stag.toyvillage.kr/v3/api-docs`(App) `PUT /feed-log/fifth-floor/admin/{feedLogId}`, operationId `updateAdminFeedLog`, tag `fifth-floor-feed-log-controller`
- 원본: `app-fifth-floor-feed-log-update-admin.swagger-source.json` (checkedAt 2026-10-29)
- `source.apiIdMatchCount: 0` + `source.swagger`

## Basic Information

| API ID | Name | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- |
| APP_FIFTH_FLOOR_FEED_LOG_UPDATE_ADMIN | 관리자 5층 급여일지 수정 | PUT | /feed-log/fifth-floor/admin/{feedLogId} | application/json |

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

`FifthFloorFeedLogUpdateRequest`

| Name | Type | Required | Nullable | Example | Description |
| --- | --- | --- | --- | --- | --- |
| feedDate | string(date) | true | false | 2026-10-29 | 상세 응답 원본 그대로 |
| feedType | string(minLength 1) | true | false | 냉동새우 | 입력값 trim |
| feedAmount | number(float) | true | false | 20 | 입력 숫자 |
| feedUnit | enum `GML`\|`KGL` | true | false | GML | 상세 응답 원본 그대로 |

## Request Example

```json
{ "feedDate": "2026-10-29", "feedType": "냉동새우", "feedAmount": 20, "feedUnit": "GML" }
```

## Success Responses

`200` — `MessageResponse` `{ "message": "급여일지가 수정되었습니다." }`. `message`가 없으면 형식 오류로 본다(4층 수정과 같다).

## Error Responses

| Status | Description |
| --- | --- |
| 403 | 토큰 없음/만료/권한 없음(공통 인터셉터) |
| 404 | 해당 급여일지를 찾을 수 없습니다. → 저장 실패 표시 |
| 405 | 지원하지 않는 메서드 형식입니다. |
| 500 | 내부 서버 오류가 발생했습니다. |

## Validation and Constraints

- 화면 검증(먹이 종류·급여량 필수, 급여량 0보다 큰 숫자)을 통과해야 요청한다.

## Notes

- Swagger와 차이 없음.

## Backend Questions

1. Notion 명세 DB에 이 API를 추가해 달라(제안 ID `APP_FIFTH_FLOOR_FEED_LOG_UPDATE_ADMIN`).
2. 접근 역할 명시, 400(검증 실패) 응답 정의 요청.
