# API Contract — CLOSE_DAT_DELETE

## Source

- API ID 검색 결과: exact match 1건
- Notion database:
  `https://app.notion.com/p/3ab7a4d6147480ad9017d80be2c11449`
- Notion data source:
  `collection://ecf7a4d6-1474-83e4-91c7-077a08b7cc37`
- Resolved page:
  `https://app.notion.com/p/63e7a4d61474822e936a016d4bf84fb6`
- Requested page:
  `https://app.notion.com/p/63e7a4d61474822e936a016d4bf84fb6`
- Checked at: `2026-07-28T14:17:13Z`

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- | --- |
| `CLOSE_DAT_DELETE` | 휴관일 삭제 기능 | 휴관일을 삭제하는 기능 | `DELETE` | `/close-day/{id}` | `application/json` |

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

### HTTP 201

```json
{
  "message": "휴관일이 삭제되었습니다."
}
```

- response body와 `message`는 nullable false
- `message`는 required

## Error Responses

- HTTP 400: 유효하지 않은 요청
- HTTP 401: 만료된 토큰
- HTTP 404: 존재하지 않는 휴관일
- HTTP 500: 예상하지 못한 서버 오류
- 공통 필드: `message`, `status`, `timestamp`, `description`
- 오류 body와 모든 필드는 required 또는 nullable false

## Validation and Constraints

- Path `id`는 required, nullable false인 양의 integer이다.
- Query Parameters와 Request Body는 없다.
- DELETE request에 body를 보내지 않는다.

## Notes

- 2026-07-28 사용자의 “알아서 하고 승인할 테니 다른 세션에서 개발” 결정에
  따라 같은 도메인의 승인된 CloseDat 계약과 승인된 `NOTICE_DELETE`의
  path/auth/response 필드 규칙을 적용했다.
- Notion에 명시된 DELETE 성공 상태 `201`은 그대로 유지했다.
- HTTP 오류 예시의 JSON 주석은 문서 표기이며 Contract JSON에는 포함하지 않는다.
- 실제 서버 테스트는 비활성화한다.
- 백엔드 명세가 보완되면 임시 동결값을 재검토한다.

## Backend Questions

없음
