# API Contract — NOTICE_QUERY_ALL

## Source

- API ID 검색 결과: exact match 1건
- Notion database: `https://app.notion.com/p/3dd7a4d6147480feb564ce3b172329f5`
- Notion data source: `collection://4817a4d6-1474-820e-ace3-072e3d0100a7`
- Resolved page: `https://app.notion.com/p/2637a4d614748217a4c00116ddf381f5`
- Requested page: `https://app.notion.com/p/2637a4d614748217a4c00116ddf381f5`
- Checked at: `2026-09-17`

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

## Request Body

없음

## Request Example

`GET /notice?page=1&size=10`

## Success Responses

### HTTP 200

```json
{
  "notices": [
    {
      "id": 1,
      "title": "공지사항 제목",
      "kind": "공지사항 분류",
      "createdAt": "2026-07-04"
    }
  ],
  "totalPageSize": 2
}
```

- 빈 결과는 `{ "notices": [], "totalPageSize": <number> }`
- `notices`, `totalPageSize`와 항목의 모든 필드는 required, nullable false
- `kind` Allowed Values는 사용자 결정에 따라 임시로 `공지사항 분류` 하나만 고정

## Error Responses

- HTTP 401: 만료된 토큰
- HTTP 403: 접근 권한 없음
- HTTP 500: 예상하지 못한 서버 오류
- 공통 필드: `message`, `status`, `timestamp`, `description`
- 공통 필드는 required, nullable false

## Validation and Constraints

- `page`는 1부터 시작한다(명세 본문. 기본값 `0` 표기와 충돌 → 2026-09-17 사용자 결정).
- `size`는 양의 정수이다.
- `createdAt`은 `YYYY-MM-DD` 문자열이다(스테이징 응답 키. 명세 예시 `createAt`과 충돌 → 2026-09-17 사용자 결정).

## Notes

- Notion 누락값은 2026-07-27 사용자 결정으로 임시 동결했다.
- 백엔드 명세가 보완되면 `kind`, `id`, `createAt`, 페이지네이션 제약을 재검토한다.

## Backend Questions

1. `kind`의 실제 전체 enum 값
2. `id`가 `number`인지 `integer`인지
3. 명세 예시 `createAt`을 실제 응답 `createdAt`으로 고칠지
4. `page` 기본값 `0` 표기를 1부터 시작 설명과 맞출지, `size` 최대값
5. HTTP 500 예시의 잘못된 backtick 수정
