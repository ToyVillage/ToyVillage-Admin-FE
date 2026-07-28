# API Contract — CLOSE_DAT_QUERY_BY_DATE

## Source

- API ID 검색 결과: exact match 1건
- Notion database:
  `https://app.notion.com/p/3ab7a4d6147480ad9017d80be2c11449`
- Notion data source:
  `collection://ecf7a4d6-1474-83e4-91c7-077a08b7cc37`
- Resolved page:
  `https://app.notion.com/p/d2f7a4d6147483c1999d01a455f1e146`
- Requested page:
  `https://app.notion.com/p/d2f7a4d6147483c1999d01a455f1e146`
- Checked at: `2026-07-28T21:39:34+09:00`

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- | --- |
| `CLOSE_DAT_QUERY_BY_DATE` | 휴관일 날짜별 조회 | 휴관일 날짜별 조회 기능 | `GET` | `/close-day` | `application/json` |

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

| Name | Type | Required | Nullable | Default | Example | Constraints |
| --- | --- | --- | --- | --- | --- | --- |
| `date` | string | true | false | 없음 | `2026-07-25` | `YYYY-MM-DD`, 실제 달력 날짜 |

## Request Body

없음

## Request Example

`GET /close-day?date=2026-07-25`

## Success Responses

### HTTP 200

```json
[
  {
    "id": 1,
    "title": "정기 휴관",
    "startCloseTime": "2024-03-10",
    "endCloseTime": "2024-03-11"
  }
]
```

- 결과가 없으면 `[]`
- 배열과 모든 필드는 required, nullable false
- `id`는 positive integer
- 날짜 문자열은 `YYYY-MM-DD`

## Error Responses

- HTTP 400: 잘못된 요청
- HTTP 401: 만료된 토큰
- HTTP 404: 휴관일을 찾을 수 없음
- HTTP 500: 예상하지 못한 서버 오류
- 공통 필드: `message`, `status`, `timestamp`, `description`
- 공통 필드는 required, nullable false

## Validation and Constraints

- query `date`는 존재하는 달력 날짜의 `YYYY-MM-DD` 문자열이다.
- `id`는 양의 정수이다.
- `startCloseTime`, `endCloseTime`은 `YYYY-MM-DD` 문자열이다.
- `startCloseTime`은 `endCloseTime`보다 늦지 않아야 한다.

## Notes

- Notion query parameter 하위 문서의 `/logs`는 2026-07-28 사용자 결정으로
  오타로 처리하고 database endpoint `/close-day`를 사용한다.
- Notion의 성공 상태 `201`은 사용자 결정으로 `200`으로 동결한다.
- 결과 없음은 사용자 결정으로 HTTP 200의 빈 배열 `[]`로 동결한다.
- Notion에 누락된 Required/Nullable은 같은 응답 구조의 기존 승인 Contract와
  사용자 결정을 기준으로 required, nullable false로 동결한다.
- Path Parameters와 Request Body는 사용자 결정으로 없음으로 동결한다.

## Backend Questions

1. Notion의 `/logs`, 성공 상태 `201`, 누락된 Required/Nullable과 빈 결과
   동작을 위 승인 Contract에 맞게 정정한다.
