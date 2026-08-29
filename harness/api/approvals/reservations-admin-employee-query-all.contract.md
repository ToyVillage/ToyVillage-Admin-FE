# API Contract — RESERVATION_ADMIN_EMPLOYEE_QUERY_ALL

## Source

- API ID 검색 결과: exact match 1건
- Notion database/data source: `ebee8d82-a450-83cd-b954-01879bf64735` / `a14e8d82-a450-83d9-b811-87e1c3508076`
- Resolved page: https://app.notion.com/p/345e8d82a45082d0af3501ecbba09049
- Checked at: 2026-08-29
- Exact match count: 1

## Basic Information

| API ID | Name | Method | Full Path | Content-Type |
| ------ | ---- | ------ | --------- | ------------ |
| RESERVATION_ADMIN_EMPLOYEE_QUERY_ALL | 단체예약 직원 배정 목록 조회 | GET | /reservation/{reservationId}/employee | application/json |

## Authentication and Authorization

| Required | Type | Roles |
| -------- | ---- | ----- |
| true | Bearer (JWT) | ADMIN |

## Request Headers

| Name | Required | Example | Description |
| ---- | -------- | ------- | ----------- |
| Authorization | true | `Bearer <access-token>` | 관리자 액세스 토큰 |

## Path Parameters

| Name | Type | Required | Example | Description |
| ---- | ---- | -------- | ------- | ----------- |
| reservationId | integer | true | 1 | 조회할 단체예약 id(LONG) |

## Query Parameters

| Name | Type | Required | Default | Description |
| ---- | ---- | -------- | ------- | ----------- |
| name | string | false | (없음) | 직원 이름 부분 일치 검색어(생략 시 전체, 두 목록 모두 필터) |

## Request Body

없음

## Request Example

`GET /reservation/1/employee?name=이승`

## Success Responses

### HttpStatus 200

- `assigned` (array<object>) — 배정된 직원: `{ appAdminId: integer, name: string }`
- `assignable` (array<object>) — 배정 가능한 직원: `{ appAdminId: integer, name: string }`

> EMPLOYEE 권한 계정만(관리자 제외), 이름 오름차순. 검색어가 있으면 두 목록 모두 필터.

## Error Responses

| Status | Message | Description |
| ------ | ------- | ----------- |
| 401 | 만료된 토큰입니다. | 만료된 토큰 |
| 403 | 접근할 수 있는 권한이 없습니다. | 권한 없음 |
| 404 | 존재하지 않는 단체예약 목록입니다. | RESERVATION_NOT_FOUND |
| 500 | 내부 서버 오류가 발생했습니다. | 서버 오류 |

공통 오류 형태: `{ message: string, status: integer, timestamp: datetime, description: string }`

## Validation and Constraints

- `reservationId`는 양의 정수(LONG). `name`은 선택.

## Notes

- 편집 폼 권한 섹션의 배정됨/배정가능 표시·검색을 이 응답으로 채운다. 배정 추가/취소 mutation은 별도 API.

## Backend Questions

없음
