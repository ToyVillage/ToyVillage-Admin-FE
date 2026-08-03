# API Contract — RESERVATION_PERMISSION_DELETE

## Source

- API ID 검색 결과: exact match 1건
- Notion database/data source: `e33e8d82-...` / `9bbe8d82-...` ("API 명세서 (1)", 최신)
- Resolved page: https://app.notion.com/p/429e8d82a450828088fc81602bdc19a0
- Requested page: 없음 (제공 URL은 데이터베이스 뷰 인덱스)
- Checked at: 2026-08-03
- Exact match count: 1

## Basic Information

| API ID                        | Name             | Method | Full Path                                        | Content-Type     |
| ----------------------------- | ---------------- | ------ | ------------------------------------------------ | ---------------- |
| RESERVATION_PERMISSION_DELETE | 단체예약 권한 삭제 기능 | DELETE | /reservation/permission/{reservationId}/{userId} | application/json |

## Authentication and Authorization

| Required | Type   | Roles |
| -------- | ------ | ----- |
| true     | Bearer | ADMIN |

## Path Parameters

| Name          | Type    | Required | Description             |
| ------------- | ------- | -------- | ----------------------- |
| reservationId | integer | true     | 예약 id                 |
| userId        | integer | true     | 권한을 제거할 직원 user id |

## Query Parameters / Request Body

없음 / 없음

## Request Example

`DELETE /reservation/permission/1/2`

## Success Responses

### HTTP 200

```json
{ "message": "단체예약 삭제가 완료되었습니다." }
```

## Error Responses

공통 바디: `{ message, status, timestamp, description }`

| Status | 대표 message                     |
| ------ | -------------------------------- |
| 400    | 요청이 유효하지 않습니다.        |
| 401    | 만료된 토큰입니다.               |
| 404    | 존재하지 않는 단체예약입니다.    |
| 500    | 예상하지 못한 에러가 발생했습니다. |

## Notes

- 삭제엔 `userId`가 필요하나 RESERVATION_PERMISSION_QUERY_ALL 응답이 `userId`를 주지 않아 실제 연동엔 선행 보강 필요(임시 매핑 B의 합성 id 전달).
- 오류에 403 없음.

## Backend Questions

1. 권한 목록(RESERVATION_PERMISSION_QUERY_ALL) 응답에 `userId` 추가 — 삭제 연동 필수.
