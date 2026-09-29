# API Contract — NOTICE_QUERY

## Source

- API ID 검색 결과: exact match 1건(Notion, 2026-09-18 04:53 최신 갱신본)
- Notion database: `https://app.notion.com/p/392bfdfeff94801597c3e8a1d2173825`
- Resolved page: `https://app.notion.com/p/ca77a4d614748259bd558101afbd5065`
- Checked at: `2026-09-18T15:30:00+09:00`
- **Swagger(실제 staging 서버) 재확인**: `https://api-stag.toyvillage.kr/v3/api-docs/app` (`NoticeDetailResponse`), checked `2026-09-18T15:30:00+09:00`

## ⚠️ Notion과 Swagger 불일치 (사용자 결정으로 Swagger 채택)

- Notion은 여전히 `kind`(string)로 남아 있다.
- Swagger(staging 실제 배포)는 `teams: {id, name}[]`를 준다.
- 2026-09-18 사용자 결정: Swagger를 근거로 Contract를 갱신한다.

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- | --- |
| `NOTICE_QUERY` | 공지사항 단일 조회 기능 | 공지사항을 id로 단일 조회하는 기능 | `GET` | `/notice/{id}` | `application/json` |

## Authentication and Authorization

| Required | Type | Roles |
| --- | --- | --- |
| true | Bearer | `USER`, `ADMIN` |

## Request Headers

| Name | Type | Required | Nullable | Example |
| --- | --- | --- | --- | --- |
| `Authorization` | string | true | false | `Bearer <access-token>` |

## Path Parameters

| Name | Type | Required | Nullable | Default | Constraints |
| --- | --- | --- | --- | --- | --- |
| `id` | integer | true | false | 없음 | positive integer |

## Query Parameters

없음

## Request Body

없음

## Request Example

`GET /notice/1`

## Success Responses

### HTTP 200

```json
{
  "id": 1,
  "title": "공지사항 제목",
  "teams": [{ "id": 1, "name": "동물 관리팀" }],
  "content": "공지사항 내용",
  "createdAt": "2026-07-04",
  "files": [
    {
      "fileName": "notice.pdf",
      "fileKey": "1931797c-89c0-4392-83d9-3cfe9abf0998notice.pdf"
    }
  ]
}
```

- 응답 객체와 모든 필드는 required, nullable false
- `teams`는 전체 공개면 빈 배열이다. 각 항목의 `id`, `name`은 required non-null
- `files` 각 항목의 `fileName`, `fileKey`는 required, nullable false string

## Error Responses

- HTTP 401: 만료된 토큰
- HTTP 403: 접근 권한 없음
- HTTP 404: 존재하지 않는 공지사항
- HTTP 500: 예상하지 못한 서버 오류
- 공통 필드: `message`, `status`, `timestamp`, `description`
- 공통 필드는 required, nullable false

## Validation and Constraints

- `id`는 양의 integer이다.
- `createdAt`은 `YYYY-MM-DD` 문자열이다.

## Notes

- 2026-07-28 동결분(`createAt`→`createdAt`, `files: FileResponse[]` 등 PR #94 실제 응답 반영)은 그대로 유지한다.
- `kind` → `teams` 변경만 2026-09-18 Swagger 재확인으로 갱신했다.

## Backend Questions

- Notion `NOTICE_QUERY` 문서를 `teams: {id, name}[]` 기준으로 갱신 요청.
