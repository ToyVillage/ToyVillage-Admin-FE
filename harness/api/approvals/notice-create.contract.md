# API Contract — NOTICE_CREATE

## Source

- API ID 검색 결과: exact match 1건
- Notion database: `https://app.notion.com/p/392bfdfeff94801597c3e8a1d2173825`
- Notion data source: `collection://392bfdfe-ff94-8042-bc6e-000bcd5da71f`
- Resolved page: `https://app.notion.com/p/392bfdfeff948095b9dcc0b918607afd`
- Requested page: 없음
- Checked at: `2026-07-28T19:40:11+09:00`
- Supplemental request example:
  `https://app.notion.com/p/3a8bfdfeff9480e38f94da6eeb3b9b64`

## Basic Information

| API ID          | Name               | Description              | Method | Full Path | Content-Type       |
| --------------- | ------------------ | ------------------------ | ------ | --------- | ------------------ |
| `NOTICE_CREATE` | 공지사항 추가 기능 | 공지사항을 추가하는 기능 | `POST` | `/notice` | `application/json` |

## Authentication and Authorization

| Required | Type   | Roles   |
| -------- | ------ | ------- |
| true     | Bearer | `ADMIN` |

## Request Headers

| Name            | Type   | Required | Nullable | Example                 |
| --------------- | ------ | -------- | -------- | ----------------------- |
| `Authorization` | string | true     | false    | `Bearer <access-token>` |

## Path Parameters

없음

## Query Parameters

없음

## Request Body

| Name      | Type   | Required | Nullable | Example         | Allowed Values |
| --------- | ------ | -------- | -------- | --------------- | -------------- |
| `title`   | string | true     | false    | `공지사항 제목` | 없음           |
| `kind`    | enum   | true     | false    | `ALL`           | `ALL`          |
| `content` | string | true     | false    | `공지사항 내용` | 없음           |
| `files`   | array<string> | true | false | `[]`, `["file-key-1"]` | 없음 |

## Request Example

```json
{
  "title": "공지사항 제목",
  "kind": "ALL",
  "content": "공지사항 내용",
  "files": ["file-key-1", "file-key-2"]
}
```

## Success Responses

### HTTP 200 또는 201

- Response Body: 없음
- 실제 서버의 `200 OK`와 문서의 `201`을 생성 성공으로 판단한다.

## Error Responses

- HTTP 400: 요청이 유효하지 않음
- HTTP 401: 만료된 토큰
- HTTP 404: 존재하지 않는 공지사항 분류
- HTTP 500: 예상하지 못한 서버 오류
- 공통 필드: `message`, `status`, `timestamp`, `description`
- 오류 body와 모든 필드는 required 또는 nullable false

## Validation and Constraints

- Request Body의 `title`, `kind`, `content`, `files`는 모두 required,
  nullable false
- `kind` Allowed Values는 백엔드 enum `ALL(kindName: "전체")` 확인 후 `ALL`
  하나만 고정
- `files`는 FILE_CREATE 성공 response의 `fileKey` 배열이다.
- 첨부파일이 없으면 `files: []`를 전달한다.

## Notes

- Notion에 누락된 `kind` 실제 값은 2026-07-28 백엔드 enum 확인으로 `ALL`로
  동결했다.
- API ID가 없는 보조 `post 예시` 페이지의 `files` 명세를 2026-07-28 사용자
  결정으로 NOTICE_CREATE Contract에 동결했다.
- 실제 생성 성공 뒤 목록에서 생성 데이터가 확인됐지만 기존 성공 body 검증으로
  프론트가 실패 처리한 증거에 따라 성공 response body는 사용하지 않는다.
- 실제 서버에서 확인한 `200 OK`와 문서에 명시된 `201`을 모두 성공 status로
  동결했다.
- FILE_CREATE 응답은 백엔드 머지 PR #36의 실제 DTO인 `fileKey`를 사용한다.
- FILE_CREATE Contract와 함께 승인·구현한다.
- 실제 서버 테스트는 비활성화한다.
- 백엔드 명세가 보완되면 임시 동결값을 재검토한다.

## Backend Questions

없음
