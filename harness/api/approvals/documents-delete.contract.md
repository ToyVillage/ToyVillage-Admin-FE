# API Contract — DOCUMENTS_DELETE

## Source
- Exact match 1건 / DB `e58e8d82-...` / DS `a34e8d82-...`
- Resolved: https://app.notion.com/p/88ee8d82a45083d0ba5b812c40c1eece / Checked at 2026-07-29

## Basic Information
| API ID | Name | Method | Full Path | Content-Type |
| ------ | ---- | ------ | --------- | ------------ |
| DOCUMENTS_DELETE | 자료실 자료 삭제 기능 | DELETE | /documents/{id} | application/json |

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

## Query Parameters / Request Body
없음 / 없음

## Success Responses
### 200 — 자료 삭제 성공
```json
{ "message": "자료 삭제 성공" }
```

## Error Responses
| Status | 대표 message |
| ------ | ------------ |
| 401 | 만료된 토큰입니다. |
| 404 | 존재하지 않는 자료입니다. |
| 500 | 예상하지 못한 에러가 발생했습니다. |

## Backend Questions
없음
