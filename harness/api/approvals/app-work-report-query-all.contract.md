# API Contract — APP_WORK_REPORT_QUERY_ALL

## Source

- API ID 검색 결과: `APP_WORK_REPORT_QUERY_ALL` exact match 1건
- Notion database/data source: https://app.notion.com/p/3da7a4d6147480d28d51d71665c28b22 / `collection://e567a4d6-1474-82c4-8267-879439b48892`
- Resolved page: https://app.notion.com/p/7fe7a4d614748333990f8111b19db064
- Requested page: 없음
- Checked at: 2026-09-13T21:15:00+09:00
- Exact match count: 1

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| ------ | ---- | ----------- | ------ | --------- | ------------ |
| `APP_WORK_REPORT_QUERY_ALL` | 직원 업무 전체 조회 | 직원 업무 전체 조회 | `GET` | `/work-report` | `application/json` |

## Authentication and Authorization

| Required | Type | Roles |
| -------- | ---- | ----- |
| true | Bearer | `ADMIN` |

## Request Headers

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `Authorization` | string | true | false | `"Bearer <access-token>"` | JWT 액세스 토큰 |

## Path Parameters

없음

## Query Parameters

| Field | Type | Required | Nullable | Default | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ------- | ----------- |
| `page` | integer | false | false | `1` | `5` | 현재 페이지(1부터 시작) |
| `size` | integer | false | false | `10` | `15` | 페이지 사이즈 |
| `sort` | string | false | false | `"id,DESC"` | `"finishDate,ASC"` | 정렬기준,방향. 방향은 ASC/DESC |
| `status` | enum | false | false | 없음 | `"PENDING"` | 업무 상태 필터 — 허용값 `PENDING`, `APPROVED`, `REJECTED` |

## Request Body

없음

## Request Example

`GET /work-report?page=1&size=10&status=PENDING`

## Success Responses

### `200`

업무보고 목록 페이지

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `reports` | array\<object\> | true | false | — | 업무보고 목록. 비어 있을 수 있다. |
| `reports[].id` | integer | true | false | `33` | 업무보고 id |
| `reports[].taskId` | integer | true | false | `12` | 업무지시 id |
| `reports[].name` | string | true | false | `"이강희"` | 담당자 이름 |
| `reports[].title` | string | true | false | `"9월 정기 안전점검"` | 업무지시 제목 |
| `reports[].status` | enum | true | false | `"REJECTED"` | 심사 상태 — 허용값 `PENDING`, `APPROVED`, `REJECTED` |
| `reports[].priority` | enum | true | false | `"HIGH"` | 업무지시 중요도 — 허용값 `HIGH`, `MEDIUM`, `LOW` |
| `reports[].finishDate` | string | true | false | `"2026-09-05"` | 업무지시 완료기한 (`yyyy-MM-dd`) |
| `totalPageSize` | integer | true | false | `3` | 총 페이지 수 |
| `pendingCount` | integer | true | false | `3` | 심사대기 건수. `status` 필터와 무관 |
| `approvedCount` | integer | true | false | `3` | 승인 건수. `status` 필터와 무관 |
| `rejectedCount` | integer | true | false | `2` | 반려 건수. `status` 필터와 무관 |

## Error Responses

| Status | Message | Body |
| ------ | ------- | ---- |
| `400` | 요청이 유효하지 않습니다. | `{ message, status, timestamp, description }` |
| `401` | 만료된 토큰입니다. | `{ message, status, timestamp, description }` |
| `500` | 예상하지 못한 에러가 발생했습니다. | `{ message, status, timestamp, description }` |

## Validation and Constraints

- 명세에 응답 필드별 Required·Nullable 표기가 없다. 200 예시 관측에 근거해 모두 required·non-null로 동결했다.
- Query parameter는 모두 optional이다. `page`/`size`/`sort`는 기본값이 있고 `status`는 기본값이 없다.
- 응답 `priority` 허용값은 같은 카테고리 `APP_WORK_REPORT_QUERY_DETAIL` 페이지 ENUM 표를 적용했다.
- 응답 `status` 허용값은 같은 페이지 `status` query parameter 허용값을 적용했다.

## Notes

- 탭 건수는 `pendingCount`/`approvedCount`/`rejectedCount`를 그대로 쓴다. 목록 `reports`로 다시 세지 않는다.
- `page`는 1부터 시작한다(Notion 원문, 2026-09-13 개발자 확인). 업무지시 목록(`GET /tasks`)의 0부터와 다르다.
- 화면은 `size=10`(2026-09-13 개발자 결정)을 보내고 `sort`는 보내지 않는다.
- `reports[].taskId`, `reports[].title`은 현재 목록 표에 쓰지 않는다.

## Backend Questions

1. `page`가 1부터인지 확인해 달라. 업무지시 목록 staging 요청은 `page=0`부터였다.
2. 응답 `priority`의 허용값을 이 페이지에도 적어 달라(`HIGH`/`MEDIUM`/`LOW`로 가정).
3. 응답 필드 Required·Nullable을 표기해 달라.
4. 예시 `totalPageSize: 3`은 건수 합 8·기본 `size` 10이면 `1`이다(예시 정정).
5. ADMIN 전용인데 `403`이 정의되어 있지 않다. 누락인가 의도인가?
