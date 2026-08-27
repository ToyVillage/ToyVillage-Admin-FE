# API Contract — RESERVATION_ADMIN_QUERY_ALL

## Source

- API ID 검색 결과: exact match 1건
- Notion database/data source: `ebee8d82-a450-83cd-b954-01879bf64735` / `a14e8d82-a450-83d9-b811-87e1c3508076`
- Resolved page: https://app.notion.com/p/fb3e8d82a450832a9f1981b76e8da3e4
- Requested page: (사용자 제공 URL은 상세 페이지를 포함하는 데이터베이스 뷰 — null 처리)
- Checked at: 2026-08-27
- Exact match count: 1

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| ------ | ---- | ----------- | ------ | --------- | ------------ |
| RESERVATION_ADMIN_QUERY_ALL | 관리자 단체예약 전체 조회 | 관리자 단체예약을 전체조회 하는 기능 | GET | /reservation | application/json |

## Authentication and Authorization

| Required | Type | Roles |
| -------- | ---- | ----- |
| true | Bearer (JWT) | ADMIN |

## Request Headers

| Name | Type | Required | Nullable | Example | Description |
| ---- | ---- | -------- | -------- | ------- | ----------- |
| Authorization | string | true | false | `Bearer <access-token>` | JWT 액세스 토큰, ADMIN 전용 |

## Path Parameters

없음

## Query Parameters

| Name | Type | Required | Nullable | Default | Allowed Values | Description |
| ---- | ---- | -------- | -------- | ------- | -------------- | ----------- |
| status | enum | false | false | (없음) | BEFORE_SITE_VISIT, SITE_VISIT_COMPLETED, VISIT_COMPLETED | 상태 필터, 생략 시 전체 |
| title | string | false | false | (없음) | — | 단체명 부분 일치, 공백뿐이면 전체 |
| sort | enum | false | false | RESERVATION_DATE | COUNSEL_DATE, RESERVATION_DATE | 정렬 기준(내림차순, 동률 시 id 내림차순) |
| page | integer | false | false | 0 | — | 페이지 번호(0부터) |
| size | integer | false | false | 3 | — | 페이지 크기(프론트 미전송 권장) |

## Request Body

없음

## Request Example

`GET /reservation?status=BEFORE_SITE_VISIT&title=대구&sort=COUNSEL_DATE&page=0`

## Success Responses

### HttpStatus 200

- `beforeVisitSite` (integer) — 사전답사 전 전체 개수(필터 무관)
- `doneVisitSite` (integer) — 사전답사 완료 전체 개수(필터 무관)
- `doneVisit` (integer) — 방문 완료 전체 개수(필터 무관)
- `reservationAdminQueryListObjectResponse` (object, Spring Page)
  - `content[]` (array<object>)
    - `id` (integer), `title` (string), `counselDate` (string, yyyy-MM-dd), `reservationDate` (string, yyyy-MM-dd), `reservationTime` (string, HH:mm:ss), `location` (string), `count` (integer), `status` (enum: 사전답사 전 / 사전답사 완료 / 방문 완료)
  - `pageable` (object): pageNumber, pageSize, offset, paged, unpaged
  - `totalPages`, `totalElements`, `size`, `number`, `first`, `last`, `numberOfElements`, `empty`

> 상태 카운트(beforeVisitSite/doneVisitSite/doneVisit)는 상태 필터와 무관하게 항상 전체 기준이며, 목록만 필터로 걸러진다. 조회 시점에 오늘 날짜 기준으로 각 예약 상태가 먼저 갱신된 뒤 집계된다.

## Error Responses

| Status | Message | Description |
| ------ | ------- | ----------- |
| 400 | 요청이 유효하지 않습니다. | status, sort 에 정의되지 않은 값 |
| 401 | 만료된 토큰입니다. | 만료된 토큰 |
| 403 | 접근할 수 있는 권한이 없습니다. | 권한 없음 |
| 500 | 내부 서버 오류가 발생했습니다. | 서버 오류 |

공통 오류 형태: `{ message: string, status: integer, timestamp: datetime, description: string }`

## Validation and Constraints

- `status`, `sort` 는 정의된 enum 외 값 전송 시 400.
- `title` 은 공백만 있으면 전체 조회로 처리.
- `page` 는 0부터 시작.

## Notes

- 기존 `RESERVATION_QUERY_ALL`(roles USER/ADMIN, 평평한 배열 응답)과는 별개 계약. 리스트 페이지는 상태 카운트/서버 필터/정렬/검색/페이지네이션이 필요하므로 본 ADMIN 계약을 사용한다.

## Backend Questions

없음
