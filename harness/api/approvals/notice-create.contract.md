# API Contract — NOTICE_CREATE

## Source

- API ID 검색 결과: exact match 1건(Notion, 2026-09-18 04:53 최신 갱신본)
- Notion database: `https://app.notion.com/p/392bfdfeff94801597c3e8a1d2173825`
- Resolved page: `https://app.notion.com/p/f887a4d614748223bb7101208a754836`
- Checked at: `2026-09-18T15:30:00+09:00`
- **Swagger(실제 staging 서버) 재확인**: `https://api-stag.toyvillage.kr/v3/api-docs/app`, checked `2026-09-18T15:30:00+09:00`

## ⚠️ Notion과 Swagger 불일치 (사용자 결정으로 Swagger 채택)

- Notion은 여전히 `kind`(enum, `ALL` 고정)로 남아 있다.
- Swagger(staging 실제 배포)는 `teamIds`(array of int64)를 받는다. 여러 팀을 지정할 수 있고, 전체 공개는 빈 배열이다.
- 2026-09-18 사용자 결정: Swagger를 근거로 Contract를 갱신한다. Notion 갱신은 백엔드에 별도로 요청한다(Backend Questions 참고).

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

| Name      | Type          | Required | Nullable | Example                | Allowed Values |
| --------- | ------------- | -------- | -------- | ----------------------- | -------------- |
| `title`   | string        | true     | false    | `공지사항 제목`         | 없음           |
| `teamIds` | array<integer>| true     | false    | `[1, 2]`                | 없음           |
| `content` | string        | true     | false    | `공지사항 내용`         | 없음           |
| `files`   | array<string> | true     | false    | `[]`, `["file-key-1"]`  | 없음           |

## Request Example

```json
{
  "title": "공지사항 제목",
  "teamIds": [1, 2],
  "content": "공지사항 내용",
  "files": ["file-key-1", "file-key-2"]
}
```

## Success Responses

### HTTP 200 또는 201

- Response Body: 없음
- 실제 서버의 `200 OK`와 문서의 `201`을 생성 성공으로 판단한다(기존 동결 유지).

## Error Responses

- HTTP 400: 요청이 유효하지 않음(기존 Notion 동결 유지. Swagger는 400을 문서화하지 않지만 `@Valid` 검증 실패 시 Spring 기본 처리로 발생 가능해 유지한다)
- HTTP 401: 만료된 토큰(기존 Notion 동결 유지. Swagger는 401을 문서화하지 않지만 JWT 필터가 전역으로 붙어 있어 유지한다)
- HTTP 404: 존재하지 않는 팀(Swagger `TEAM_NOT_FOUND` 예시로 갱신, 메시지 `존재하지 않는 팀입니다.`. `FILE_NOT_FOUND`도 같은 404로 옴)
- HTTP 500: 예상하지 못한 서버 오류
- 공통 필드: `message`, `status`, `timestamp`, `description`
- 오류 body와 모든 필드는 required 또는 nullable false

## Validation and Constraints

- Request Body의 `title`, `teamIds`, `content`, `files`는 모두 required, nullable false
- `teamIds`는 팀 조회 API(`GET /team`)가 준 팀의 id만 담는다. 전체 공개는 빈 배열
- 존재하지 않는 팀 id가 섞이면 404 `TEAM_NOT_FOUND`(Swagger 확인)
- `files`는 FILE_CREATE 성공 response의 `fileKey` 배열이다. 첨부파일이 없으면 `files: []`

## Notes

- 2026-07-28 동결분(성공 status 200/201 이중 인정, FILE_CREATE 연계)은 그대로 유지한다.
- `kind` → `teamIds` 변경만 2026-09-18 Swagger 재확인으로 갱신했다.
- 실제 서버 테스트는 비활성화한다.

## Backend Questions

- Notion `NOTICE_CREATE` 문서를 `teamIds`(array of int64) 기준으로 갱신 요청.
