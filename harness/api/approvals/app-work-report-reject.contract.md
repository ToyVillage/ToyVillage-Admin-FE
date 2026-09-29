# API Contract — APP_WORK_REPORT_REJECT

## Source

- API ID 검색 결과: `APP_WORK_REPORT_REJECT` exact match 1건
- Notion database/data source: https://app.notion.com/p/3da7a4d6147480d28d51d71665c28b22 / `collection://e567a4d6-1474-82c4-8267-879439b48892`
- Resolved page: https://app.notion.com/p/9907a4d6147482f5aca5817f40955fa8
- Requested page: 없음
- Checked at: 2026-09-13T21:15:00+09:00
- Exact match count: 1

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| ------ | ---- | ----------- | ------ | --------- | ------------ |
| `APP_WORK_REPORT_REJECT` | 직원 업무 보고 반려 | 직원 업무 보고 반려 기능 | `PATCH` | `/work-report/reject/{workReportId}` | `application/json` |

## Authentication and Authorization

| Required | Type | Roles |
| -------- | ---- | ----- |
| true | Bearer | `ADMIN` |

## Request Headers

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `Authorization` | string | true | false | `"Bearer <access-token>"` | JWT 액세스 토큰 |

## Path Parameters

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `workReportId` | integer | true | false | `5` | 업무보고 id (양의 정수) |

## Query Parameters

없음

## Request Body

Required: true

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `rejectionReason` | string | true | false | `"안전 점검 항목 일부가 누락되었습니다."` | 반려 사유. 1000자 이하 |

## Request Example

```json
{ "rejectionReason": "안전 점검 항목 일부가 누락되었습니다." }
```

## Success Responses

### `200`

업무보고 반려 성공

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `message` | string | true | false | `"업무 보고가 반려되었습니다."` | 결과 메시지 |

## Error Responses

| Status | Message | Body |
| ------ | ------- | ---- |
| `400` | 반려 사유를 입력해주세요. | `{ message, status, timestamp, description }` |
| `400` | 반려 사유를 1000자 이하로 입력해주세요. | `{ message, status, timestamp, description }` |
| `401` | 만료된 토큰입니다. | `{ message, status, timestamp, description }` |
| `404` | 존재하지 않는 업무관리입니다. | `{ message, status, timestamp, description }` |
| `409` | 이미 반려된 업무관리입니다. | `{ message, status, timestamp, description }` |
| `500` | 예상하지 못한 에러가 발생했습니다. | `{ message, status, timestamp, description }` |

## Validation and Constraints

- `rejectionReason`: required, 1000자 이하.
- Nullable 표기는 없지만 required 필드라 non-null로 동결했다.
- 성공 status는 `200`만 성공으로 본다.

## Notes

- 프런트는 앞뒤 공백을 제거한 사유를 보내고, 비면 요청하지 않는다(기존 모달 동작).
- 모달 입력은 1000자까지만 받는다.
- 서버 `message`는 화면에 표시하지 않고 기존 결과 토스트 문구를 쓴다.

## Backend Questions

1. 1000자 기준이 공백 제거 전인지 후인지, 공백만 보내면 400인지.
2. 승인된 보고를 반려하면 성공인지 409인지.
3. ADMIN 전용인데 `403`이 정의되어 있지 않다.
