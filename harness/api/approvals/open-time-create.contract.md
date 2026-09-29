# API Contract — OPEN_TIME_CREATE

## Source

- API ID 검색 결과: exact match 1건
- Notion database: `https://app.notion.com/p/3dd7a4d6147480feb564ce3b172329f5`
- Notion data source: `collection://4817a4d6-1474-820e-ace3-072e3d0100a7`
- Resolved page: `https://app.notion.com/p/0787a4d6147482a7a8d901673f696684`
- Requested page: `https://app.notion.com/p/0787a4d6147482a7a8d901673f696684`
- Checked at: `2026-09-17`

## Basic Information

| API ID | Name | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- |
| `OPEN_TIME_CREATE` | 운영 시간 등록 기능 | `POST` | `/open-time` | `application/json` |

## Authentication and Authorization

| Required | Type | Roles |
| --- | --- | --- |
| true | Bearer | `ADMIN` |

## Path Parameters

없음

## Query Parameters

없음

## Request Body

| Name | Type | Required | Nullable | Example | Constraints |
| --- | --- | --- | --- | --- | --- |
| `openDate` | string | true | false | 예시 참고 | `YYYY-MM-DD` |
| `startOpenTime` | string | true | false | 예시 참고 | `HH:mm:ss` |
| `endOpenTime` | string | true | false | 예시 참고 | `HH:mm:ss`, 시작보다 늦음(화면 검증) |

## Request Example

```json
{
  "openDate": "2026-07-21",
  "startOpenTime": "09:00:00",
  "endOpenTime": "18:00:00"
}
```

## Success Responses

### HTTP 201

```json
{
  "message": "운영시간이 생성되었습니다."
}
```

- `message`는 required, nullable false string
- 201 외 status는 성공으로 처리하지 않는다.

## Error Responses

- HTTP 400: 요청이 유효하지 않음
- HTTP 401: 만료된 토큰
- HTTP 404: 대상 없음 (Notion 예시 문구는 `존재하지 않는 공지사항 분류 항목입니다.`)
- HTTP 500: 예상하지 못한 서버 오류
- 공통 필드: `message`, `status`, `timestamp`, `description` (required, nullable false)

## Notes

- Notion 원문에 필드 표가 없어 request/response 예시 JSON 기준으로 필드를 required, nullable false로 동결했다.
- 시간 형식은 명세 예시 그대로 사용한다(등록 `HH:mm:ss`, 수정 `HH:mm`) — 2026-09-17 사용자 결정.

## Backend Questions

1. 등록(`HH:mm:ss`)과 수정(`HH:mm`)의 시간 형식이 다른 것이 의도인지
2. 404 예시 문구(공지사항 분류)를 운영시간 문구로 정정할지
3. `OPEN_TIME_QUERY_BY_DATE`의 명세 path(`/open-time/{open-time-id}`)와 실제 사용 중인 `/open-time/date?date=` 정리
