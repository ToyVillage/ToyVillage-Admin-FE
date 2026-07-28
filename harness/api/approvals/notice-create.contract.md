# API Contract — NOTICE_CREATE

## Source

- API ID 검색 결과: exact match 1건
- Notion database: `https://app.notion.com/p/392bfdfeff94801597c3e8a1d2173825`
- Notion data source: `collection://392bfdfe-ff94-8042-bc6e-000bcd5da71f`
- Resolved page: `https://app.notion.com/p/392bfdfeff948095b9dcc0b918607afd`
- Requested page: 없음
- Checked at: `2026-07-28T16:02:02+09:00`

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- | --- |
| `NOTICE_CREATE` | 공지사항 추가 기능 | 공지사항을 추가하는 기능 | `POST` | `/notice` | `application/json` |

## Authentication and Authorization

| Required | Type | Roles |
| --- | --- | --- |
| true | Bearer | `ADMIN` |

## Request Headers

| Name | Type | Required | Nullable | Example |
| --- | --- | --- | --- | --- |
| `Authorization` | string | true | false | `Bearer <access-token>` |

## Path Parameters

없음

## Query Parameters

없음

## Request Body

| Name | Type | Required | Nullable | Example | Allowed Values |
| --- | --- | --- | --- | --- | --- |
| `title` | string | true | false | `공지사항 제목` | 없음 |
| `kind` | enum | true | false | `공지사항 분류` | `공지사항 분류` |
| `content` | string | true | false | `공지사항 내용` | 없음 |

## Request Example

```json
{
  "title": "공지사항 제목",
  "kind": "공지사항 분류",
  "content": "공지사항 내용"
}
```

## Success Responses

### HTTP 201

```json
{
  "message": "공지 생성 성공"
}
```

- response body와 `message`는 required, nullable false

## Error Responses

- HTTP 400: 요청이 유효하지 않음
- HTTP 401: 만료된 토큰
- HTTP 404: 존재하지 않는 공지사항 분류
- HTTP 500: 예상하지 못한 서버 오류
- 공통 필드: `message`, `status`, `timestamp`, `description`
- 오류 body와 모든 필드는 required 또는 nullable false

## Validation and Constraints

- Request Body의 `title`, `kind`, `content`는 모두 required, nullable false
- `kind` Allowed Values는 사용자 결정에 따라 임시로 `공지사항 분류` 하나만 고정
- 첨부파일은 Request Body에 포함하지 않는다.

## Notes

- Notion 누락값은 2026-07-28 사용자 결정으로 임시 동결했다.
- 실제 서버 테스트는 비활성화한다.
- 백엔드 명세가 보완되면 임시 동결값을 재검토한다.

## Backend Questions

없음
