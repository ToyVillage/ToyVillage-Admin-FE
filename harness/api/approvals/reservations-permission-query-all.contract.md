# API Contract — RESERVATION_PERMISSION_QUERY_ALL

## Source

- API ID 검색 결과: exact match 1건
- Notion database/data source: `82ee8d82-...` / `148e8d82-...` ("API 명세서 1", 2026-08-10 개정)
- Resolved page: https://app.notion.com/p/3f8e8d82a45082c5ab4801b1cc347a95
- Checked at: 2026-08-10
- Exact match count: 1

## Basic Information

| API ID                           | Name             | Method | Full Path                              | Content-Type     |
| -------------------------------- | ---------------- | ------ | -------------------------------------- | ---------------- |
| RESERVATION_PERMISSION_QUERY_ALL | 단체예약 조회 권한 목록 조회 | GET    | /reservation/permission/{reservationId} | application/json |

## Authentication and Authorization

| Required | Type   | Roles |
| -------- | ------ | ----- |
| true     | Bearer | ADMIN |

## Path Parameters

| Name          | Type    | Required | Description                |
| ------------- | ------- | -------- | -------------------------- |
| reservationId | integer | true     | 권한 목록을 조회할 단체예약 ID |

## Query Parameters / Request Body

없음 / 없음

## Request Example

`GET /reservation/permission/1`

## Success Responses

### HTTP 200 — 직원 계정 배열 (빈 배열 가능)

```json
[{ "appAdminId": 2, "name": "김직원" }, { "appAdminId": 3, "name": "이직원" }]
```

아이템 필드: `appAdminId`(integer), `name`(string). → UI Staff `{ id: String(appAdminId), name }`.

## Error Responses

공통 바디: `{ message, status, timestamp, description }`

| Status | 대표 message                     |
| ------ | -------------------------------- |
| 401    | 만료된 토큰입니다.               |
| 403    | 접근할 수 있는 권한이 없습니다.  |
| 404    | 존재하지 않는 단체예약 목록입니다. |
| 500    | 내부 서버 오류가 발생했습니다.   |

## Notes

- 개정 명세에서 엔드포인트 오타(`reseravtion`)가 정정되고 `appAdminId`가 추가됨.

## Backend Questions

없음.
