# API Contract — DASHBOARD_OVERALL_OPERATIONS_QUERY

## Source

- Notion 데이터베이스 `API 명세서 토이빌리지` (`https://app.notion.com/p/3de7a4d6147480e18466e66547493b25`, `collection://9717a4d6-1474-822a-8703-074d4cfad636`, 2026-09-17 개발자가 새로 옮긴 DB)
- Resolved page: https://app.notion.com/p/69f7a4d6147483a7a0af016398c9189d
- Requested page: 없음
- Checked at: 2026-09-17
- Exact match count: 1 (카테고리 `대시보드` 4건 중 API ID 정확 일치 1건)
- staging Swagger(`/v3/api-docs`, `dash-board-controller`)의 Method·Path·응답 필드와 일치함을 확인했다.

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- | --- |
| DASHBOARD_OVERALL_OPERATIONS_QUERY | 대시보드 주간 업무 현황 조회 | 이번 주 업무지시의 전체·진행중·완료·기한초과 건수를 조회하는 기능 | GET | /dashboard/overall-operations | application/json |

## Authentication and Authorization

| Required | Type | Roles |
| --- | --- | --- |
| true | Bearer | ADMIN |

- Notion `접근권한` ADMIN, `토큰 여부` 체크. 관리자 액세스 토큰만 허용.

## Request Headers

| Name | Type | Required | Nullable | Default | Example | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `Authorization` | string | true | false | 없음 | `Bearer {accessToken}` | JWT 액세스 토큰. 관리자(ADMIN) 토큰만 허용 — Bearer scheme |

## Path Parameters

없음

## Query Parameters

없음

## Request Body

없음

## Request Example

`GET /dashboard/overall-operations`

## Success Responses

### HTTP 200 — 주간 업무 현황 (이번 주 일요일 00:00 이상 ~ 다음 주 일요일 00:00 미만)

| Name | Type | Required | Nullable | Default | Example | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `TOTAL` | integer | true | false | 없음 | `18` | 전체 건수 — IN_PROGRESS + COMPLETED + EXPIRED |
| `IN_PROGRESS` | integer | true | false | 없음 | `7` | 진행중 건수 |
| `COMPLETED` | integer | true | false | 없음 | `9` | 완료 건수 |
| `EXPIRED` | integer | true | false | 없음 | `2` | 기한초과 건수 |

- 명세에 필드별 required·nullable 표기가 없어 200 예시에 모든 필드가 값으로 존재하는 것을 근거로 required·non-null로 기록했다.

## Error Responses

| Status | 설명 | Body |
| --- | --- | --- |
| 401 | 만료된 토큰 | `{ message, status, timestamp, description }` |
| 403 | 인증 토큰이 없거나 유효하지 않거나 관리자 권한 없음 — 본문 없이 반환될 수 있음 | 없음(본문 없이 반환될 수 있음) |
| 405 | 지원하지 않는 메서드 | `{ message, status, timestamp, description }` |
| 500 | 내부 서버 오류 | `{ message, status, timestamp, description }` |


## Validation and Constraints

- 명세에 별도 제약 없음.

## Notes

- 집계 기간은 이번 주 일요일 00:00 이상부터 다음 주 일요일 00:00 미만까지다.
- `TOTAL`은 `IN_PROGRESS + COMPLETED + EXPIRED`의 합계다.
