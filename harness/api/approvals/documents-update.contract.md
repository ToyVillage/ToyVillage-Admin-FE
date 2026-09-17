# API Contract — DOCUMENTS_UPDATE

## Source
- Exact match 1건 / DB `ed4e8d82-...` / DS `b53e8d82-...`
- Resolved: https://app.notion.com/p/690e8d82a45082b79e2b01696dabf1d4 / Checked at 2026-09-17

## Basic Information

| API ID | Name | Method | Full Path | Content-Type |
| ------ | ---- | ------ | --------- | ------------ |
| DOCUMENTS_UPDATE | 자료실 자료 수정 기능 | PUT | /documents/{id} | application/json |

## Authentication

| Required | Type | Roles |
| -------- | ---- | ----- |
| true | Bearer | ADMIN |

## Request Headers

| Name | Required | Example |
| ---- | -------- | ------- |
| Authorization | true | `Bearer <access-token>` |

## Path Parameters

| Name | Type | Required | Example |
| ---- | ---- | -------- | ------- |
| id | integer | true | 1 |

## Query Parameters
없음

## Request Body (required)

| Name | Type | Required | Allowed | Description |
| ---- | ---- | -------- | ------- | ----------- |
| title | string | true | — | 비어 있을 수 없음 |
| type | enum | true | PDF, JPG, PNG, OTHER | 자료 타입 |
| files | array<string> | true | — | 파일 키 목록(최소 1개) |

## Success Responses
### 201 — 자료 수정 성공
```json
{ "message": "자료 수정 성공" }
```

## Error Responses

| Status | 대표 message |
| ------ | ------------ |
| 400 | 자료 제목은 비어있을 수 없습니다. (외 2) |
| 401 | 만료된 토큰입니다. |
| 404 | 존재하지 않는 자료입니다. / 존재하지 않는 파일입니다. |
| 500 | 예상하지 못한 에러가 발생했습니다. |

## Notes
- files 는 file key 목록(create와 동일).
- `type` enum: Notion UPDATE 상세 페이지는 아직 `JPEG/JPG` 로 표기되어 있으나, DOCUMENTS_CREATE·DOCUMENTS_QUERY_ALL(types) 명세와
  스테이징 실제 서버 응답(2026-09-17 개발자 확인)은 모두 `JPG` 다. Contract·코드는 `JPG` 를 기준으로 한다.

## Backend Questions
- Notion DOCUMENTS_UPDATE 상세 페이지의 `type` enum 표기를 `JPEG/JPG` → `JPG` 로 수정 요청.
