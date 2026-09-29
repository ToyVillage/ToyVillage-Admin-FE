# API Contract — DOCUMENTS_QUERY_ALL

## Source

- API ID 검색 결과: exact match 1건
- Notion database/data source: `ed4e8d82-a450-830a-afc9-812bfcd1234a` / `b53e8d82-a450-8355-b0f9-8702915ee325` ("API 명세서")
- Resolved page: https://app.notion.com/p/4dbe8d82a45082eea37e015087edcba6
- Requested page: 없음 (제공 URL은 데이터베이스 인덱스)
- Checked at: 2026-09-17
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

| Name           | Type         | Required | Default | Allowed              | Description             |
| -------------- | ------------ | -------- | ------- | -------------------- | ----------------------- |
| page           | integer      | false    | 0       | —                    | page 번호 (0부터)       |
| size           | integer      | false    | 10      | —                    | page 사이즈             |
| keyword        | string       | false    | 없음    | —                    | 제목 검색 키워드        |
| orderDirection | enum         | false    | 없음    | ASC, DESC            | 정렬 방향               |
| types          | array\<enum\> | false    | 없음    | PDF, JPG, PNG, OTHER | 자료 type 필터(복수 선택) |

## Request Body

없음

## Request Example

`GET /documents?page=0&size=10&keyword=자료&orderDirection=DESC&types=PDF&types=JPG`

## Success Responses

### HTTP 200 — 자료 목록 + 전체 페이지 수

```json
{
  "documents": [
    { "id": 1, "title": "자료 제목", "type": "PDF", "createdAt": "2026-02-06T19:56:53.62201" }
  ],
  "totalPageSize": 3
}
```

필드: `documents`(array<object>: `id` integer, `title` string, `type` enum PDF/JPG/PNG/OTHER, `createdAt` datetime), `totalPageSize`(integer, 전체 페이지 수). 값이 없으면 `documents: []`.

## Error Responses

공통 바디: `{ message, status, timestamp, description }`

| Status | 대표 message                     |
| ------ | -------------------------------- |
| 401    | 만료된 토큰입니다.               |
| 404    | 존재하지 않는 자료입니다.        |
| 500    | 예상하지 못한 에러가 발생했습니다. |

## Validation and Constraints

- page ≥ 0(기본 0), size ≥ 1(기본 10), orderDirection ∈ {ASC, DESC}, keyword 제목 부분 일치.
- types 미지정이면 전체 type 조회. 값은 `PDF`, `JPG`, `PNG`, `OTHER`.

## Notes

- `types` 는 목록 파라미터다. `types[]=` 가 아니라 `types=PDF&types=JPG` 형태로 반복 전송한다.
- 페이지 경계는 응답 `totalPageSize`(전체 페이지 수)로 판단한다. 이전 명세에 있던 "배열 길이로 다음 페이지 추정" 규칙은 제거됐다.
- 원문 `page` 기본값은 `1`로 적혀 있으나 같은 항목이 "0부터 시작"이라고 설명해 모순이다. 프론트는 항상 `page`를 명시 전송한다.

## Backend Questions

- DOCUMENTS_UPDATE 상세 페이지의 `type` enum 표기만 아직 `JPEG/JPG` 다. 실제 서버는 전부 `JPG`(2026-09-17 개발자 확인)이므로 Notion 표기 수정 필요.
