# API Contract — NOTICE_DELETE

## Source

- API ID 검색 결과: exact match 1건
- Notion database:
  `https://app.notion.com/p/392bfdfeff94801597c3e8a1d2173825`
- Notion data source:
  `collection://392bfdfe-ff94-8042-bc6e-000bcd5da71f`
- Resolved page:
  `https://app.notion.com/p/392bfdfeff948006a204f99c5df39bf3`
- Requested page:
  `https://app.notion.com/p/392bfdfeff948006a204f99c5df39bf3`
- Checked at: `2026-07-28T09:18:05Z`

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- | --- |
| `NOTICE_DELETE` | 공지사항 삭제 기능 | 공지를 삭제하는 기능 | `DELETE` | `/notice/{id}` | `application/json` |

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

없음

## Request Example

없음

## Success Responses

### HTTP 200

```json
{
  "message": "공지 삭제가 완료되었습니다."
}
```

- response body와 `message`는 nullable false
- `message`는 required

## Error Responses

- HTTP 400: 유효하지 않은 요청
- HTTP 401: 만료된 토큰
- HTTP 404: 존재하지 않는 공지사항
- HTTP 500: 예상하지 못한 서버 오류
- 공통 필드: `message`, `status`, `timestamp`, `description`
- 오류 body와 모든 필드는 required 또는 nullable false

## Validation and Constraints

- Path `id`는 required, nullable false인 양의 integer이다.
- Query Parameters와 Request Body는 없다.
- DELETE request에 body를 보내지 않는다.

## Notes

- 2026-07-28 사용자 결정으로 승인된 `NOTICE_UPDATE`의
  path/auth/response 규칙과 `NOTICE_QUERY`의 오류 응답 규칙을 동일하게
  적용했다.
- HTTP 오류 예시의 JSON 주석은 문서 표기이며 Contract JSON에는 포함하지 않는다.
- 실제 서버 테스트는 비활성화한다.
- 백엔드 명세가 보완되면 임시 동결값을 재검토한다.

## Backend Questions

없음
