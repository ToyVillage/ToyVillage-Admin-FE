# API Contract — APP_WORK_REPORT_APPROVE

## Source

- API ID 검색 결과: `APP_WORK_REPORT_APPROVE` exact match 1건
- Notion database/data source: https://app.notion.com/p/3da7a4d6147480d28d51d71665c28b22 / `collection://e567a4d6-1474-82c4-8267-879439b48892`
- Resolved page: https://app.notion.com/p/75b7a4d61474825c951e018e869562fd
- Requested page: 없음
- Checked at: 2026-09-13T21:15:00+09:00
- Exact match count: 1

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| ------ | ---- | ----------- | ------ | --------- | ------------ |
| `APP_WORK_REPORT_APPROVE` | 직원 업무 보고 승인 | 직원 업무 보고 승인 기능 | `PATCH` | `/work-report/approve/{workReportId}` | `application/json` |

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

없음

## Request Example

`PATCH /work-report/approve/32` (body 없음)

## Success Responses

### `200`

업무보고 승인 성공

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `message` | string | true | false | `"업무 보고가 승인되었습니다."` | 결과 메시지 |

## Error Responses

| Status | Message | Body |
| ------ | ------- | ---- |
| `401` | 만료된 토큰입니다. | `{ message, status, timestamp, description }` |
| `404` | 존재하지 않는 업무관리입니다. | `{ message, status, timestamp, description }` |
| `409` | 이미 승인된 업무관리입니다. | `{ message, status, timestamp, description }` |
| `500` | 예상하지 못한 에러가 발생했습니다. | `{ message, status, timestamp, description }` |

## Validation and Constraints

- Request 절에 Body가 없어 요청 body 없음으로 동결했다.
- 성공 status는 `200`만 성공으로 본다.

## Notes

- 모든 담당자의 업무보고가 승인되면 해당 업무지시 상태가 `COMPLETED`로 바뀐다(Notion 개요). 업무관리 캐시(`['tasks']`)를 함께 무효화한다.
- 서버 `message`는 화면에 표시하지 않고 기존 결과 토스트 문구를 쓴다.

## Backend Questions

1. 반려된 보고를 승인하면 성공인지 409인지.
2. ADMIN 전용인데 `403`이 정의되어 있지 않다.
