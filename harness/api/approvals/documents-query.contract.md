# API Contract — DOCUMENTS_QUERY

## Source

- API ID 검색 결과: exact match 1건
- Notion database/data source: `e58e8d82-...` / `a34e8d82-...`
- Resolved page: https://app.notion.com/p/345e8d82a45083208dbb81c3cdeef04e
- Requested page: 없음(데이터베이스 인덱스)
- Checked at: 2026-07-29 / Exact match count: 1

## Basic Information

| API ID          | Name                    | Method | Full Path       | Content-Type     |
| --------------- | ----------------------- | ------ | --------------- | ---------------- |
| DOCUMENTS_QUERY | 자료실 자료 상세조회 기능 | GET    | /documents/{id} | application/json |

## Authentication and Authorization

| Required | Type   | Roles       |
| -------- | ------ | ----------- |
| true     | Bearer | USER, ADMIN |

## Request Headers

| Name          | Required | Example                 |
| ------------- | -------- | ----------------------- |
| Authorization | true     | `Bearer <access-token>` |

## Path Parameters

| Name | Type    | Required | Example | Description |
| ---- | ------- | -------- | ------- | ----------- |
| id   | integer | true     | 1       | 자료 id     |

## Query Parameters / Request Body

없음 / 없음

## Success Responses

### HTTP 201 — 자료 상세 (명세 표기상 201)

```json
{
  "id": 1,
  "title": "자료 제목",
  "type": "PDF",
  "createdAt": "2026-02-06T19:56:53.62201",
  "files": [{ "fileName": "파일 이름", "fileKey": "파일 키" }]
}
```

필드: `id`(integer), `title`(string), `type`(string), `createdAt`(datetime), `files`(array<object>: `fileName` string, `fileKey` string).

## Error Responses

공통 바디 `{ message, status, timestamp, description }`

| Status | 대표 message                     |
| ------ | -------------------------------- |
| 401    | 만료된 토큰입니다.               |
| 404    | 존재하지 않는 자료입니다.        |
| 500    | 예상하지 못한 에러가 발생했습니다. |

## Notes

- 성공 코드가 명세에 201로 표기됨(GET). 프론트는 상태코드에 의존하지 않고 바디만 사용.

## Backend Questions

없음
