# API Contract — TASK_QUERY_ALL

## Source

- API ID 검색 결과: `TASK_QUERY_ALL` exact match 1건
- Notion database/data source: https://app.notion.com/p/3d67a4d614748030af5dc94e59b3d9b7 / `collection://65d7a4d6-1474-82e1-8615-07f152254595`
- Resolved page: https://app.notion.com/p/0707a4d61474828eb8a1012a5c5ef73b
- Requested page: 없음
- Checked at: 2026-09-09T20:10:00+09:00
- Exact match count: 1

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| ------ | ---- | ----------- | ------ | --------- | ------------ |
| `TASK_QUERY_ALL` | 업무지시 전체 조회 기능 | 직원에게 할당했던 업무를 보는 기능 | `GET` | `/tasks` | `application/json` |

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

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `page` | integer | false | false | `1` | page의 번호(0부터 시작) |
| `size` | integer | false | false | `10` | page의 사이즈 |
| `sort` | string | false | false | `"finishDate,ASC"` | 정렬기준,방향 형태. 방향은 ASC/DESC. |
| `status` | enum | false | false | `"IN_PROGRESS"` | 현재 상태를 기준으로 필터링 — 허용값 `IN_PROGRESS`, `COMPLETED`, `EXPIRED` |

## Request Body

없음

## Request Example

없음

## Success Responses

### `200`

업무지시 목록 페이지

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `tasks` | array\<object\> | true | false | — | 업무지시 목록. 비어 있을 수 있다. |
| `tasks[].id` | integer | true | false | `12` | 업무지시 id |
| `tasks[].title` | string | true | false | `"9월 정기 안전점검"` | 업무 제목 |
| `tasks[].assigneeName` | string | true | false | `"이승현"` | 대표 담당자 이름 |
| `tasks[].assigneeCount` | integer | true | false | `4` | 담당자 총원 |
| `tasks[].status` | enum | true | false | `"IN_PROGRESS"` | 업무 상태(서버 계산) — 허용값 `IN_PROGRESS`, `COMPLETED`, `EXPIRED` |
| `tasks[].priority` | enum | true | false | `"HIGH"` | 업무 중요도 — 허용값 `HIGH`, `MEDIUM`, `LOW` |
| `tasks[].finishDate` | string | true | false | `"2026-09-05"` | 완료기한 |
| `totalPageSize` | integer | true | false | `3` | 총 페이지 수 |

## Error Responses

| Status | Message | Body |
| ------ | ------- | ---- |
| `400` | 요청이 유효하지 않습니다. | `{ message, status, timestamp, description }` |
| `401` | 만료된 토큰입니다. | `{ message, status, timestamp, description }` |
| `500` | 예상하지 못한 에러가 발생했습니다. | `{ message, status, timestamp, description }` |

## Validation and Constraints

명세에 응답 필드별 Required·Nullable 표기가 없다. 200 예시 관측에 근거했다. Query parameter는 모두 optional이며 `page`/`size`/`sort`는 기본값이 있다.

## Notes

- `status`는 서버가 계산해 내려주는 값이다(2026-09-09 개발자 확인).

  | 값            | 화면 탭 | 서버 판정 조건              |
  | ------------- | ------- | --------------------------- |
  | `IN_PROGRESS` | 진행중  | 미완료 + finishDate >= 오늘 |
  | `COMPLETED`   | 완료    | 담당자 전원이 APPROVED      |
  | `EXPIRED`     | 지연    | 미완료 + finishDate < 오늘  |

- `assigneeCount`는 담당자 총원이다. 목록의 `외 N명`은 `assigneeCount - 1`.
- `totalPageSize`는 총 페이지 수다. 페이지네이션에 그대로 쓴다.
- `sort`는 기본값 `id,DESC`를 쓰고 요청에 포함하지 않는다. 화면에 정렬 UI가
  없다.

## Backend Questions

1. `status` query parameter 값 목록의 첫 값이 `IN PROGRESS`로 적혀 있다
   (언더바 누락). 같은 문서 응답 예시는 `IN_PROGRESS`다. Notion 오타 수정이
   필요하다.
2. 성공 응답 예시에서 1·2번 항목의 `id`가 둘 다 `12`다(복사 흔적).
3. `403` 응답이 정의돼 있지 않다. 다른 업무지시 API는 모두 403을 정의한다.
   누락인가 의도인가?
4. `status` 파라미터 설명에 첨부된 이미지의 내용이 무엇인가? 상태 판정
   조건표라면 아래 Notes의 표와 같은지 확인이 필요하다.
5. 응답 필드의 Required·Nullable을 명세에 표기해 달라.
