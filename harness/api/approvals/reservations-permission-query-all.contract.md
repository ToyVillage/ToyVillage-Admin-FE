# API Contract — RESERVATION_PERMISSION_QUERY_ALL

## Source

- API ID 검색 결과: exact match 1건
- Notion database/data source: `e33e8d82-...` / `9bbe8d82-...` ("API 명세서 (1)", 최신)
- Resolved page: https://app.notion.com/p/f1fe8d82a450824287b201c7fa96aa53
- Requested page: 없음 (제공 URL은 데이터베이스 뷰 인덱스)
- Checked at: 2026-08-03
- Exact match count: 1

## Basic Information

| API ID                           | Name             | Method | Full Path                               | Content-Type     |
| -------------------------------- | ---------------- | ------ | --------------------------------------- | ---------------- |
| RESERVATION_PERMISSION_QUERY_ALL | 단체예약 권한 조회 기능 | GET    | /reseravtion/permission/{reservationId} | application/json |

※ Full Path의 `reseravtion`은 명세 오타로 추정(백엔드 확인 필요).

## Authentication and Authorization

| Required | Type   | Roles |
| -------- | ------ | ----- |
| true     | Bearer | ADMIN |

## Path Parameters

| Name          | Type    | Required | Description |
| ------------- | ------- | -------- | ----------- |
| reservationId | integer | true     | 예약 id     |

## Query Parameters / Request Body

없음 / 없음

## Request Example

`GET /reseravtion/permission/1`

## Success Responses

### HTTP 200 — 권한 보유 직원명 배열 (빈 배열 가능)

```json
[{ "name": "직원명" }, { "name": "직원명" }]
```

아이템 필드: `name`(string). ※ 직원 `id`/`role`은 응답에 없음.

## Error Responses

공통 바디: `{ message, status, timestamp, description }`

| Status | 대표 message                       |
| ------ | ---------------------------------- |
| 401    | 만료된 토큰입니다.                 |
| 403    | 접근할 수 있는 권한이 없습니다.    |
| 404    | 존재하지 않는 예약입니다           |
| 500    | 예상하지 못한 에러가 발생했습니다. |

## Notes

- 응답에 직원 `id`가 없어 UI 키/제거용 식별자를 합성해야 함(임시 B). 권한 제거(RESERVATION_PERMISSION_DELETE)는 `userId` 필요 → 본 응답으로 불가.

## Backend Questions

1. 엔드포인트 오타 `reseravtion` → `reservation` 확정.
2. 응답에 직원 `id`(userId) 포함 여부(권한 제거 연동에 필요).
3. 접근권한 ADMIN 확정(상세 Header/Response의 User 언급은 복붙 오류로 보임).
