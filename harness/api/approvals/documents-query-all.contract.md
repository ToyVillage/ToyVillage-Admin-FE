# API Contract — DOCUMENTS_QUERY_ALL

## Source

- API ID 검색 결과: exact match 1건
- Notion database/data source: `e58e8d82-...` / `a34e8d82-...` ("API 명세서 (1)")
- Resolved page: https://app.notion.com/p/8b2e8d82a4508302884f0154f961a748
- Requested page: 없음 (제공 URL은 데이터베이스 인덱스)
- Checked at: 2026-07-28
- Exact match count: 1

## Basic Information

| API ID              | Name                    | Description                     | Method | Full Path  | Content-Type     |
| ------------------- | ----------------------- | ------------------------------- | ------ | ---------- | ---------------- |
| DOCUMENTS_QUERY_ALL | 자료실 자료 전체조회 기능 | 자료를 시간순으로 전체조회하는 기능 | GET    | /documents | application/json |

## Authentication and Authorization

| Required | Type   | Roles       |
| -------- | ------ | ----------- |
| true     | Bearer | USER, ADMIN |

## Request Headers

| Name          | Type   | Required | Example                 |
| ------------- | ------ | -------- | ----------------------- |
| Authorization | string | true     | `Bearer <access-token>` |

## Path Parameters

없음

## Query Parameters

| Name           | Type    | Required | Default | Allowed   | Description             |
| -------------- | ------- | -------- | ------- | --------- | ----------------------- |
| page           | integer | false    | 0       | —         | page 번호 (0부터)       |
| size           | integer | false    | 10      | —         | page 사이즈             |
| keyword        | string  | false    | 없음    | —         | 제목 검색 키워드        |
| orderDirection | enum    | false    | 없음    | ASC, DESC | 정렬 방향               |

## Request Body

없음

## Request Example

`GET /documents?page=0&size=10&keyword=자료&orderDirection=DESC`

## Success Responses

### HTTP 200 — 자료 객체 배열 (빈 배열 가능)

```json
[{ "id": 1, "title": "자료 제목", "type": "PDF", "createdAt": "2026-02-06T19:56:53.62201" }]
```

아이템 필드: `id`(integer), `title`(string), `type`(enum PDF/JPEG/JPG/PNG/OTHER), `createdAt`(datetime).

## Error Responses

공통 바디: `{ message, status, timestamp, description }`

| Status | 대표 message                     |
| ------ | -------------------------------- |
| 401    | 만료된 토큰입니다.               |
| 404    | 존재하지 않는 자료입니다.        |
| 500    | 예상하지 못한 에러가 발생했습니다. |

## Validation and Constraints

- page ≥ 0(기본 0), size ≥ 1(기본 10), orderDirection ∈ {ASC, DESC}, keyword 제목 부분 일치.

## Notes

- 응답은 래퍼 없는 배열(총 개수 메타 없음).

## Backend Questions

없음
