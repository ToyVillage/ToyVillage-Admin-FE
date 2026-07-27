# API Contract — NOTICE_QUERY_ALL

## Source

- API ID 검색 결과: exact match 1건
- Notion database: `https://app.notion.com/p/392bfdfeff94801597c3e8a1d2173825`
- Notion data source: `collection://392bfdfe-ff94-8042-bc6e-000bcd5da71f`
- Resolved page: `https://app.notion.com/p/392bfdfeff94803692deef24a3408890`
- Requested page: `https://app.notion.com/p/392bfdfeff94803692deef24a3408890`
- Checked at: `2026-07-27`

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- | --- |
| `NOTICE_QUERY_ALL` | 공지사항 전체 조회 | 공지사항을 전체 조회하는 기능 | `GET` | `/notice` | `application/json` |

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

| Name | Type | Required | Nullable | Default | Constraints |
| --- | --- | --- | --- | --- | --- |
| `page` | integer | true | false | `0` | minimum 0 |
| `size` | integer | true | false | `10` | positive integer |

## Request Body

없음

## Request Example

`GET /notice?page=0&size=10`

## Success Responses

### HTTP 200

```json
[
  {
    "id": 1,
    "title": "공지사항 제목",
    "kind": "공지사항 분류",
    "createAt": "2026-07-04"
  }
]
```

- 빈 결과는 `[]`
- 배열과 모든 필드는 required, nullable false
- `kind` Allowed Values는 사용자 결정에 따라 임시로 `공지사항 분류` 하나만 고정

## Error Responses

- HTTP 401: 만료된 토큰
- HTTP 403: 접근 권한 없음
- HTTP 500: 예상하지 못한 서버 오류
- 공통 필드: `message`, `status`, `timestamp`, `description`
- 공통 필드는 required, nullable false

## Validation and Constraints

- `page`는 0부터 시작한다.
- `size`는 양의 정수이다.
- `createAt`은 현재 명세 예시의 `YYYY-MM-DD` 문자열을 사용한다.

## Notes

- Notion 누락값은 2026-07-27 사용자 결정으로 임시 동결했다.
- 백엔드 명세가 보완되면 `kind`, `id`, `createAt`, 페이지네이션 제약을 재검토한다.

## Backend Questions

1. `kind`의 실제 전체 enum 값
2. `id`가 `number`인지 `integer`인지
3. `createAt` 키와 날짜 형식이 맞는지
4. `page`, `size`의 최대값 및 생략 시 서버 기본값
5. HTTP 500 예시의 잘못된 backtick 수정
