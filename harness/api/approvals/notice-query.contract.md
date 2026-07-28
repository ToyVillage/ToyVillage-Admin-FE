# API Contract — NOTICE_QUERY

## Source

- API ID 검색 결과: exact match 1건
- Notion database: `https://app.notion.com/p/392bfdfeff94801597c3e8a1d2173825`
- Notion data source: `collection://392bfdfe-ff94-8042-bc6e-000bcd5da71f`
- Resolved page: `https://app.notion.com/p/392bfdfeff94803d8009ca9ec7920250`
- Requested page: `https://app.notion.com/p/392bfdfeff94803d8009ca9ec7920250`
- Checked at: `2026-07-28T15:29:24+09:00`

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- | --- |
| `NOTICE_QUERY` | 공지사항 단일 조회 기능 | 공지사항을 id로 단일 조회하는 기능 | `GET` | `/notice/{id}` | `application/json` |

## Authentication and Authorization

| Required | Type | Roles |
| --- | --- | --- |
| true | Bearer | `USER`, `ADMIN` |

## Request Headers

| Name | Type | Required | Nullable | Example |
| --- | --- | --- | --- | --- |
| `Authorization` | string | true | false | `Bearer <access-token>` |

## Path Parameters

| Name | Type | Required | Nullable | Default | Constraints |
| --- | --- | --- | --- | --- | --- |
| `id` | integer | true | false | 없음 | positive integer |

## Query Parameters

없음

## Request Body

없음

## Request Example

`GET /notice/1`

## Success Responses

### HTTP 200

```json
{
  "id": 1,
  "title": "공지사항 제목",
  "kind": "공지사항 분류",
  "content": "공지사항 내용",
  "createAt": "2026-07-04"
}
```

- 응답 객체와 모든 필드는 required, nullable false
- `kind` Allowed Values는 사용자 결정에 따라 임시로 `공지사항 분류` 하나만 고정

## Error Responses

- HTTP 401: 만료된 토큰
- HTTP 403: 접근 권한 없음
- HTTP 404: 존재하지 않는 공지사항
- HTTP 500: 예상하지 못한 서버 오류
- 공통 필드: `message`, `status`, `timestamp`, `description`
- 공통 필드는 required, nullable false

## Validation and Constraints

- `id`는 양의 integer이다.
- `createAt`은 `YYYY-MM-DD` 문자열이다.

## Notes

- Notion 누락값은 2026-07-28 사용자 결정으로 `notice-query-all` 승인 조건과 동일하게 동결했다.
- HTTP 500 예시의 불필요한 backtick은 문서 오타로 무시한다.

## Backend Questions

1. `kind`의 실제 전체 enum 값
2. `id`와 `createAt`의 구조화된 타입·제약
