# API Contract — OPEN_TIME_QUERY_BY_DATE

## Source

- API ID 검색 결과: exact match 1건
- Notion database:
  `https://app.notion.com/p/3ac7a4d61474809c982ff365f93be801`
- Notion data source:
  `collection://a4d7a4d6-1474-83f0-811f-87efefb2710a`
- Resolved page:
  `https://app.notion.com/p/cc17a4d6147482608f9b016d9277ca5c`
- Requested page:
  `https://app.notion.com/p/cc17a4d6147482608f9b016d9277ca5c`
- Checked at: `2026-07-30T16:24:09+09:00`

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- | --- |
| `OPEN_TIME_QUERY_BY_DATE` | 운영 시간 날짜별 조회 | 운영시간 날짜별 조회 기능 | `GET` | `/open-time/{open-time-id}` | `application/json` |

## Authentication and Authorization

| Required | Type | Roles |
| --- | --- | --- |
| true | Bearer | `USER`, `ADMIN` |

## Request Headers

| Name | Type | Required | Nullable | Example |
| --- | --- | --- | --- | --- |
| `Authorization` | string | true | false | `Bearer <access-token>` |

## Path Parameters

| Name | Type | Required | Nullable | Default | Example | Constraints |
| --- | --- | --- | --- | --- | --- | --- |
| `open-time-id` | string | true | false | 없음 | `2026-07-01` | `YYYY-MM-DD`, 실제 달력 날짜 |

## Query Parameters

없음

## Request Body

없음

## Request Example

`GET /open-time/2026-07-01`

## Success Responses

### HTTP 201

```json
{
  "id": 1,
  "openDate": "2026-07-21",
  "startOpenTime": "09:00:00",
  "endOpenTime": "18:00:00"
}
```

- 응답 객체와 모든 필드는 required, nullable false
- `id`는 positive integer
- `openDate`는 `YYYY-MM-DD`
- `startOpenTime`, `endOpenTime`은 `HH:mm:ss`

## Error Responses

- HTTP 400: 잘못된 요청
- HTTP 401: 만료된 토큰
- HTTP 404: 해당 운영시간을 찾을 수 없음
- HTTP 500: 예상하지 못한 서버 오류
- 공통 필드: `message`, `status`, `timestamp`, `description`
- 공통 필드는 required, nullable false

## Validation and Constraints

- path의 `open-time-id`는 존재하는 달력 날짜의 `YYYY-MM-DD` 문자열이다.
- `id`는 양의 정수이다.
- `openDate`는 존재하는 달력 날짜의 `YYYY-MM-DD` 문자열이다.
- 시간 문자열은 `HH:mm:ss` 형식이다.

## Notes

- `{open-time-id}`에 숫자 ID가 아니라 route date를 전달하는 것으로
  2026-07-30 사용자 결정으로 동결한다.
- 성공 status `201`, query parameter 없음, request body 없음은 2026-07-30
  사용자 결정으로 동결한다.
- Notion에 누락된 Required/Nullable과 오류 형식은 기존 승인 Contract와
  2026-07-30 사용자 결정을 기준으로 동결한다.
- Notion의 잘못된 `404` 공지사항 문구는 운영시간 조회 오류로 정정한다.

## Backend Questions

1. Notion의 path parameter 이름과 누락된 필드 정의를 승인 Contract에 맞게
   정정한다.
2. `404` 공지사항 분류 오류 문구를 운영시간 조회 오류 문구로 정정한다.
