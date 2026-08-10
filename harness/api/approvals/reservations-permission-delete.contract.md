# API Contract — RESERVATION_PERMISSION_DELETE

## Source

- API ID 검색 결과: exact match 1건
- Notion database/data source: `82ee8d82-...` / `148e8d82-...` ("API 명세서 1", 2026-08-10 개정)
- Resolved page: https://app.notion.com/p/f14e8d82a450828dbdf701586b32435b
- Checked at: 2026-08-10
- Exact match count: 1

## Basic Information

| API ID                        | Name             | Method | Full Path                                        | Content-Type     |
| ----------------------------- | ---------------- | ------ | ------------------------------------------------ | ---------------- |
| RESERVATION_PERMISSION_DELETE | 단체예약 조회 권한 삭제 기능 | DELETE | /reservation/permission/{reservationId}/{appAdminId} | application/json |

## Authentication and Authorization

| Required | Type   | Roles |
| -------- | ------ | ----- |
| true     | Bearer | ADMIN |

## Path Parameters

| Name          | Type    | Required | Description                |
| ------------- | ------- | -------- | -------------------------- |
| reservationId | integer | true     | 권한을 삭제할 단체예약 ID  |
| appAdminId    | integer | true     | 조회 권한을 삭제할 직원 계정 ID |

## Query Parameters / Request Body

없음 / 없음

## Request Example

`DELETE /reservation/permission/1/2`

## Success Responses

### HTTP 204 — No Content (본문 없음)

## Error Responses

공통 바디: `{ message, status, timestamp, description }`

| Status | 대표 message                       |
| ------ | ---------------------------------- |
| 401    | 만료된 토큰입니다.                 |
| 403    | 접근할 수 있는 권한이 없습니다.    |
| 404    | 존재하지 않는 단체예약 조회 권한입니다. |
| 500    | 내부 서버 오류가 발생했습니다.     |

## Notes

- 개정 명세에서 param `userId`→`appAdminId`, 응답 `200 {message}`→`204 No Content`. 권한 목록이 `appAdminId`를 주므로 실제 삭제 성립.

## Backend Questions

없음.
