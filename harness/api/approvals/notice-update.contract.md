# API Contract — NOTICE_UPDATE

## Source

- API ID 검색 결과: exact match 1건(Notion, 2026-09-18 04:53 최신 갱신본)
- Notion database: `https://app.notion.com/p/392bfdfeff94801597c3e8a1d2173825`
- Resolved page: `https://app.notion.com/p/ed87a4d61474838ca72701ec8fa73080`
- Checked at: `2026-09-18T15:30:00+09:00`
- **Swagger(실제 staging 서버) 재확인**: `https://api-stag.toyvillage.kr/v3/api-docs/app`, checked `2026-09-18T15:30:00+09:00`

## ⚠️ Notion과 Swagger 불일치 (사용자 결정으로 Swagger 채택)

- Notion은 여전히 `kind`(enum, `ALL` 고정)로 남아 있다.
- Swagger(staging 실제 배포)는 `teamIds`(array of int64)를 받는다.
- 2026-09-18 사용자 결정: Swagger를 근거로 Contract를 갱신한다.

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

| Name      | Type           | Required | Nullable | Example  | Allowed Values |
| --------- | -------------- | -------- | -------- | -------- | -------------- |
| `title`   | string         | true     | false    | `공지사항 제목` | 없음    |
| `teamIds` | array<integer> | true     | false    | `[1, 2]` | 없음           |
| `content` | string         | true     | false    | `공지사항 내용` | 없음    |
| `files`   | array<string>  | true     | false    | `["file-key-1"]` | 없음   |

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

### HTTP 200

```json
{
  "message": "공지 수정 성공"
}
```

- response body와 `message`는 nullable false
- `message`는 required

## Error Responses

- HTTP 401: 만료된 토큰
- HTTP 403: 접근 권한 없음
- HTTP 404: 존재하지 않는 공지사항, 팀 또는 파일(Swagger 예시 3종 확인: `NOTICE_NOT_FOUND`, `TEAM_NOT_FOUND`, `FILE_NOT_FOUND` — 모두 404, 메시지만 다름)
- HTTP 500: 예상하지 못한 서버 오류
- 공통 필드: `message`, `status`, `timestamp`, `description`
- 오류 body와 모든 필드는 required 또는 nullable false

## Validation and Constraints

- Path `id`는 required, nullable false인 양의 integer이다.
- Request Body의 `title`, `teamIds`, `content`, `files`는 모두 required, nullable false이다.
- `teamIds`는 팀 조회 API가 준 팀의 id만 담는다. 전체 공개는 빈 배열
- 존재하지 않는 팀 id가 섞이면 404 `TEAM_NOT_FOUND`(Swagger 확인, NOTICE_CREATE와 동일)
- `files`는 수정 후 공지에 남길 첨부 전체의 `fileKey` 목록이다. 기존 첨부 중 남긴 키와 `FILE_CREATE`로 새로 받은 키를 화면 순서대로 담는다. 첨부가 없으면 빈 배열
- 없는 `fileKey`가 섞이면 404 `FILE_NOT_FOUND`(Swagger 예시)

## Notes

- 2026-07-28 동결분(NOTICE_CREATE·NOTICE_QUERY와 동일 규칙 적용)은 그대로 유지한다.
- `kind` → `teamIds` 변경만 2026-09-18 Swagger 재확인으로 갱신했다.
- 2026-09-19(#164): Swagger상 수정도 생성과 같은 `NoticeRequestDto`(`title`, `teamIds`, `content`, `files`)를 받는다. 7월 동결 때 제외한 `files`를 요청에 포함한다.
- Swagger는 `files`가 기존 첨부를 교체하는지 명시하지 않는다. 화면에 남은 첨부 전체를 보내므로 교체로 처리된다고 본다.
- 실제 서버 테스트는 비활성화한다.

## Backend Questions

- Notion `NOTICE_UPDATE` 문서를 `teamIds`(array of int64) 기준으로 갱신 요청.
