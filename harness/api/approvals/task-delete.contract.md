# API Contract — TASK_DELETE

## Source

- API ID 검색 결과: exact match 1건
- Notion database:
  `https://app.notion.com/p/3ed7a4d6147480a6acdfd303ab9531c8`
- Notion data source:
  `collection://9df7a4d6-1474-839c-abb2-070e88bf667e`
- Resolved page:
  `https://app.notion.com/p/1707a4d6147483c9ae1b81e7043f72c3`
- Requested page:
  `https://app.notion.com/p/1707a4d6147483c9ae1b81e7043f72c3`
- Checked at: `2026-10-02T18:44:51+09:00`

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- | --- |
| `TASK_DELETE` | 업무지시 삭제 기능 | 할당한 업무지시를 취소하는 기능 | `DELETE` | `/tasks/{id}` | `application/json` |

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
  "message": "업무지시가 삭제되었습니다."
}
```

- response body와 `message`는 required, nullable false

## Error Responses

- HTTP 400: 유효하지 않은 요청
- HTTP 401: 토큰이 잘못되었거나 파싱할 수 없음
- HTTP 403: 권한 없음 (`message` 예시는 빈 문자열)
- HTTP 404: 존재하지 않는 업무지시
- HTTP 409: 해당 업무에 대한 업무보고가 이미 존재함
  (`message` 예시 `해당 업무에 대한 업무 보고가 이미 존재합니다.`)
- HTTP 500: 예상하지 못한 서버 오류
- 공통 필드: `message`(string), `status`(integer), `timestamp`(datetime),
  `description`(string)
- 오류 body와 모든 필드는 required, nullable false

## Validation and Constraints

- Path `id`는 required, nullable false인 양의 integer이다.
- Query Parameters와 Request Body는 없다.
- DELETE request에 body를 보내지 않는다.

## Notes

- 2026-08-29 사용자의 "간단한 삭제부터" 결정에 따라 승인된 삭제 계약
  (`CLOSE_DAT_DELETE`, `NOTICE_DELETE`, `DOCUMENTS_DELETE`)과 같은 규칙으로
  Header·path·response 필드 속성을 동결했다. 자세한 근거는
  `task-delete.notion-source.md`의 사용자 결정 항목을 따른다.
- 성공 Status는 Notion 원문 `200`을 그대로 유지했다.
- HTTP 오류 예시의 JSON 주석은 문서 표기이며 Contract JSON에는 포함하지 않는다.
- 실제 서버 테스트는 비활성화한다.
- 2026-10-02 Notion 명세에 추가된 409(업무보고가 이미 있는 업무지시 삭제 거부)를
  반영했다(#222). Notion 원문은 409 설명을 `업무지시를 찾을 수 없습니다.`로
  404 와 같게 적었으나, `message` 예시가 업무보고 존재를 말하므로 그 뜻으로 동결했다.

## Backend Questions

없음 (상세 페이지에 Header 섹션과 Required/Nullable이 보완되면 재검토)
