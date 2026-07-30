# API Contract — DOCUMENTS_UPDATE

## Source
- Exact match 1건 / DB `e58e8d82-...` / DS `a34e8d82-...`
- Resolved: https://app.notion.com/p/10ce8d82a45082e482df8153ce781768 / Checked at 2026-07-29

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
| type | enum | true | PDF, JPEG/JPG, PNG, OTHER | 자료 타입 |
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

## Backend Questions
없음
