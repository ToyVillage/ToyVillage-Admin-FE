# API Contract — NOTICE_UPDATE

## Source

- API ID 검색 결과: exact match 1건
- Notion database: `https://app.notion.com/p/392bfdfeff94801597c3e8a1d2173825`
- Notion data source: `collection://392bfdfe-ff94-8042-bc6e-000bcd5da71f`
- Resolved page: `https://app.notion.com/p/392bfdfeff948081821dc459cd7b808c`
- Requested page: `https://app.notion.com/p/392bfdfeff948081821dc459cd7b808c`
- Checked at: `2026-07-28T17:44:19+09:00`

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- | --- |
| `NOTICE_UPDATE` | 공지사항 수정 기능 | 공지내용을 업데이트하는 기능 | `PUT` | `/notice/{id}` | `application/json` |

## Authentication and Authorization

| Required | Type | Roles |
| --- | --- | --- |
| true | Bearer | `ADMIN` |

## Request Headers

| Name | Type | Required | Nullable | Example |
| --- | --- | --- | --- | --- |
| `Authorization` | string | true | false | `Bearer <access-token>` |

## Path Parameters

| Name | Type | Required | Nullable | Example | Constraints |
| --- | --- | --- | --- | --- | --- |
| `id` | integer | true | false | `1` | positive integer |

## Query Parameters

없음

## Request Body

| Name | Type | Required | Nullable | Example | Allowed Values |
| --- | --- | --- | --- | --- | --- |
| `title` | string | true | false | `공지사항 제목` | 없음 |
| `kind` | enum | true | false | `ALL` | `ALL` |
| `content` | string | true | false | `공지사항 내용` | 없음 |

## Request Example

```json
{
  "title": "공지사항 제목",
  "kind": "ALL",
  "content": "공지사항 내용"
}
```

## Success Responses

### HTTP 200

```json
{
  "message": "공지 수정 성공"
}
```

- response body와 `message`는 nullable false
- `message`는 required

## Error Responses

- HTTP 400: 존재하지 않는 공지사항 분류
- HTTP 401: 만료된 토큰
- HTTP 403: 접근 권한 없음
- HTTP 404: 존재하지 않는 공지사항
- HTTP 500: 예상하지 못한 서버 오류
- 공통 필드: `message`, `status`, `timestamp`, `description`
- 오류 body와 모든 필드는 required 또는 nullable false

## Validation and Constraints

- Path `id`는 required, nullable false인 양의 integer이다.
- Request Body의 `title`, `kind`, `content`는 모두 required, nullable false이다.
- `kind` Allowed Values는 기존에 확인한 백엔드 enum을 따라 `ALL` 하나로 동결한다.
- 첨부파일은 Request Body에 포함하지 않는다.

## Notes

- 2026-07-28 사용자 결정으로 `NOTICE_CREATE`의 body/response 규칙과
  `NOTICE_QUERY`의 path/auth/error 규칙을 동일하게 적용했다.
- HTTP 500 예시의 불필요한 backtick은 문서 오타로 무시한다.
- 실제 서버 테스트는 비활성화한다.
- 백엔드 명세가 보완되면 임시 동결값을 재검토한다.

## Backend Questions

없음
