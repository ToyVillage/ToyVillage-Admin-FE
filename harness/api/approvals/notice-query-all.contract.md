# API Contract — NOTICE_QUERY_ALL

## Source

- API ID 검색 결과: exact match 1건(Notion, 2026-09-18 04:53 최신 갱신본)
- Notion database: `https://app.notion.com/p/392bfdfeff94801597c3e8a1d2173825`
- Resolved page: `https://app.notion.com/p/4d37a4d6147482948b1101cb4b05b586`
- Checked at: `2026-09-18T15:30:00+09:00`
- **Swagger(실제 staging 서버) 재확인**: `https://api-stag.toyvillage.kr/v3/api-docs/app`, checked `2026-09-18T15:30:00+09:00`

## ⚠️ Notion과 Swagger 불일치 (사용자 결정으로 Swagger 채택)

- Notion은 여전히 `kind`(string)로 남아 있고 팀 필터 쿼리 파라미터가 없다.
- Swagger(staging 실제 배포)는 `teams: {id, name}[]`를 주고, `teamId`(단일 int64) 쿼리 파라미터가 새로 생겼다.
- 2026-09-18 사용자 결정: Swagger를 근거로 Contract를 갱신한다.

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- | --- |
| `NOTICE_QUERY_ALL` | 공지사항 전체 조회 | 공지사항을 전체 조회하는 기능 | `GET` | `/notice` | `application/json` |

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

| Name | Type | Required | Nullable | Default | Constraints |
| --- | --- | --- | --- | --- | --- |
| `page` | integer | true | false | `1` | minimum 1 |
| `size` | integer | true | false | `10` | positive integer |
| `teamId` | integer | false | false | 없음 | int64. 생략하면 전체 목록. 존재하지 않으면 404 `TEAM_NOT_FOUND`(Swagger 신규 확인) |

## Request Body

없음

## Request Example

`GET /notice?page=1&size=10&teamId=1`

## Success Responses

### HTTP 200

```json
{
  "notices": [
    {
      "id": 1,
      "title": "공지사항 제목",
      "teams": [{ "id": 1, "name": "동물 관리팀" }],
      "createdAt": "2026-07-04"
    }
  ],
  "totalPageSize": 2
}
```

- 빈 결과는 `{ "notices": [], "totalPageSize": <number> }`
- `notices`, `totalPageSize`와 항목의 모든 필드는 required, nullable false
- `teams`는 전체 공개면 빈 배열이다. 각 항목의 `id`, `name`은 required non-null

## Error Responses

- HTTP 401: 만료된 토큰
- HTTP 403: 접근 권한 없음
- HTTP 404: 존재하지 않는 팀(`teamId` 필터, Swagger 신규 확인)
- HTTP 500: 예상하지 못한 서버 오류
- 공통 필드: `message`, `status`, `timestamp`, `description`
- 공통 필드는 required, nullable false

## Validation and Constraints

- `page`는 1부터 시작한다(2026-09-17 사용자 결정 유지).
- `size`는 양의 정수이다.
- `createdAt`은 `YYYY-MM-DD` 문자열이다(2026-09-17 사용자 결정 유지).
- `teamId`는 한 팀만 거른다(배열 불가). 목록 필터 탭이 여러 팀을 동시에 고르는 UI를 원하면 서버 지원이 더 필요하다.

## Notes

- 2026-09-17 동결분(`page` 1-base, `createdAt` 키)은 그대로 유지한다.
- `kind` → `teams` 변경과 `teamId` 쿼리 파라미터 추가만 2026-09-18 Swagger 재확인으로 갱신했다.

## Backend Questions

- Notion `NOTICE_QUERY_ALL` 문서를 `teams: {id, name}[]`, `teamId` 쿼리 파라미터 기준으로 갱신 요청.
- 목록 필터 탭에서 여러 팀을 동시에 거르려면 `teamId`를 배열로 받을 수 있는지 확인 요청(이슈 #147).
