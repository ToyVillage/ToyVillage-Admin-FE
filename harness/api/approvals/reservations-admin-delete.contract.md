# API Contract — RESERVATION_ADMIN_DELETE

## Source

- API ID 검색 결과: exact match 1건
- Notion database/data source: `ebee8d82-…` / `a14e8d82-…`
- Resolved page: https://app.notion.com/p/c7be8d82a45083348d7a01a12f84cd69
- Checked at: 2026-08-29 · Exact match count: 1

## Basic Information

| API ID | Name | Method | Full Path | Content-Type |
| ------ | ---- | ------ | --------- | ------------ |
| RESERVATION_ADMIN_DELETE | 단체예약 삭제 | DELETE | /reservation/{reservationId} | application/json |

## Authentication and Authorization

| Required | Type | Roles |
| -------- | ---- | ----- |
| true | Bearer (JWT) | ADMIN |

## Request Headers

| Name | Required | Example |
| ---- | -------- | ------- |
| Authorization | true | `Bearer <access-token>` |

## Path Parameters

| Name | Type | Required | Example | Description |
| ---- | ---- | -------- | ------- | ----------- |
| reservationId | integer | true | 1 | 삭제할 단체예약 id(LONG) |

## Query Parameters / Request Body

없음 / 없음

## Request Example

`DELETE /reservation/1`

## Success Responses

### HttpStatus 200

- `message` (string) — 예: "단체예약 삭제가 완료되었습니다."

## Error Responses

| Status | Message | Description |
| ------ | ------- | ----------- |
| 401 | 만료된 토큰입니다. | 만료된 토큰 |
| 403 | 접근할 수 있는 권한이 없습니다. | 권한 없음 |
| 404 | 존재하지 않는 단체예약 목록입니다. | RESERVATION_NOT_FOUND |
| 500 | 내부 서버 오류가 발생했습니다. | 서버 오류 |

공통 오류 형태: `{ message: string, status: integer, timestamp: datetime, description: string }`

## Validation and Constraints

- `reservationId`는 양의 정수(LONG). 예약에 걸린 직원 배정도 서버가 함께 삭제.

## Notes

- 성공 후 목록 복귀 + `['reservations']` 무효화.

## Backend Questions

없음
