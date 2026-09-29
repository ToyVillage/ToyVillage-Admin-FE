# API Contract — CLOSE_DAT_QUERY_ALL

## Source

- API ID 검색 결과: exact match 1건
- Notion database: `https://app.notion.com/p/3ab7a4d6147480ad9017d80be2c11449`
- Notion data source: `collection://ecf7a4d6-1474-83e4-91c7-077a08b7cc37`
- Resolved page: `https://app.notion.com/p/27e7a4d61474838a8e26015785f2c4d7`
- Requested page: `https://app.notion.com/p/27e7a4d61474838a8e26015785f2c4d7`
- Checked at: `2026-07-28T21:22:30+09:00`

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- | --- |
| `CLOSE_DAT_QUERY_ALL` | 휴관일 전체조회 | 입력 없이 휴관일을 전체적으로 조회 | `GET` | `/close-day` | `application/json` |

## Authentication and Authorization

| Required | Type | Roles |
| --- | --- | --- |
| true | Bearer | `USER`, `ADMIN` |

## Request Headers

| Name | Type | Required | Nullable | Example |
| --- | --- | --- | --- | --- |
| `Authorization` | string | true | false | `Bearer <access-token>` |

## Path Parameters

없음

## Query Parameters

없음

## Request Body

없음

## Request Example

`GET /close-day`

## Success Responses

### HTTP 200

```json
[
  {
    "id": 1,
    "title": "정기 휴관",
    "startCloseTime": "2026-07-09",
    "endCloseTime": "2026-07-09"
  }
]
```

- 빈 결과는 `[]`
- 배열과 모든 필드는 required, nullable false
- `id`는 positive integer
- 날짜 문자열은 `YYYY-MM-DD`

## Error Responses

- HTTP 400: 유효하지 않은 요청
- HTTP 401: 만료된 토큰
- HTTP 404: 휴관일을 찾을 수 없음
- HTTP 500: 예상하지 못한 서버 오류
- 공통 필드: `message`, `status`, `timestamp`, `description`
- 공통 필드는 required, nullable false

## Validation and Constraints

- `id`는 양의 정수이다.
- `startCloseTime`, `endCloseTime`은 `YYYY-MM-DD` 문자열이다.
- `startCloseTime`은 `endCloseTime`보다 늦지 않아야 한다.

## Notes

- Notion의 성공 상태 `201`은 2026-07-28 사용자 결정으로 `200`으로 동결했다.
- Notion 누락값은 같은 사용자 지시에 따라 JSON 예시와 기존 API 계약 규칙으로
  보수적으로 동결했다.
- 백엔드 명세가 보완되면 임시 동결값을 재검토한다.

## Backend Questions

1. Notion 성공 상태를 `200`으로 정정한다.
2. 필드 Required/Nullable과 빈 배열 동작을 상세 명세에 명시한다.
