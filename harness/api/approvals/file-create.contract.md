# API Contract — FILE_CREATE

## Source

- API ID 검색 결과: exact match 1건
- Notion database: `https://app.notion.com/p/392bfdfeff94801597c3e8a1d2173825`
- Notion data source: `collection://392bfdfe-ff94-8042-bc6e-000bcd5da71f`
- Resolved page: `https://app.notion.com/p/3a6bfdfeff9480fab18bc0b5bbc20b5b`
- Requested page: 없음
- Checked at: `2026-07-28T19:33:56+09:00`

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- | --- |
| `FILE_CREATE` | 파일 업로드 | 파일을 업로드 하는 기능 | `POST` | `/file` | `multipart/form-data` |

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

없음

## Request Body

| Name | Type | Required | Nullable | Example | Constraints |
| --- | --- | --- | --- | --- | --- |
| `files` | object | true | false | browser `File` | 요청당 파일 1개, 최대 50MB |

multipart binary part의 field 이름은 Notion 명세의 `files`를 그대로 사용한다.
UI에서 여러 파일을 선택하면 파일 수만큼 요청을 분리한다.

## Request Example

```text
Content-Type: multipart/form-data
files=<binary>
```

## Success Responses

### HTTP 201

```json
{
  "key": "1931797c-89c0-4392-83d9-3cfe9abf0998image_name.png",
  "fileUrl": ""
}
```

- response body와 `key`, `fileUrl`은 required, nullable false

## Error Responses

- HTTP 400: 잘못된 요청
- HTTP 401: 유효하지 않은 토큰 또는 만료된 토큰
- HTTP 403: 로그인 필요
- HTTP 404: 존재하지 않는 페이지
- HTTP 500: 예상하지 못한 서버 오류
- 공통 필드: `message`, `status`, `timestamp`, `description`
- 오류 body와 모든 필드는 required, nullable false

## Validation and Constraints

- 요청 한 번에는 파일 하나만 전송한다.
- 파일 하나의 최대 크기는 50MB다.
- 401 response body의 `status`는 section status와 일치하는 `401`로 동결한다.
- 허용 확장자/MIME type 제한은 추가하지 않는다.

## Notes

- Header, request, response의 Required/Nullable은 2026-07-28 사용자 결정으로
  기존 API Contract 규칙과 동일하게 동결했다.
- multipart `file`은 하네스 타입의 `object`로 정규화한다.
- 실제 서버 테스트는 비활성화한다.
- 자료실 업로드는 범위 밖이다.

## Backend Questions

FILE_CREATE 자체 질문은 없음.

공지 생성과 연결하려면 현재 승인된 NOTICE_CREATE Contract에 없는
`files: string[]` 필드를 별도로 확정하고 재승인해야 한다.
