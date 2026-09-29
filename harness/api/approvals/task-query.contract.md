# API Contract — TASK_QUERY

## Source

- API ID 검색 결과: `TASK_QUERY` exact match 1건
- Notion database/data source: https://app.notion.com/p/3d67a4d614748030af5dc94e59b3d9b7 / `collection://65d7a4d6-1474-82e1-8615-07f152254595`
- Resolved page: https://app.notion.com/p/00c7a4d61474825abd4e01c642364bd0
- Requested page: 없음
- Checked at: 2026-09-09T20:10:00+09:00
- Exact match count: 1

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| ------ | ---- | ----------- | ------ | --------- | ------------ |
| `TASK_QUERY` | 업무지시 단일 조회 기능 | 업무지시를 상세조회 하는 기능 | `GET` | `/tasks/{id}` | `application/json` |

## Authentication and Authorization

| Required | Type | Roles |
| -------- | ---- | ----- |
| true | Bearer | `ADMIN`, `USER` |

## Request Headers

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `Authorization` | string | true | false | `"Bearer <access-token>"` | JWT 액세스 토큰 |

## Path Parameters

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `id` | integer | true | false | `1` | task의 id |

## Query Parameters

없음

## Request Body

없음

## Request Example

없음

## Success Responses

### `200`

업무지시 상세

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `id` | integer | true | false | `12` | 업무지시 id |
| `title` | string | true | false | `"업무 제목"` | 업무 제목 |
| `content` | string | true | false | `"상세 업무 내용"` | 상세 업무 내용 |
| `assignees` | array\<object\> | true | false | — | 담당자 목록 |
| `assignees[].id` | integer | true | false | `2` | 담당자(유저) id |
| `assignees[].name` | string | true | false | `"이승현"` | 담당자 이름 |
| `assignees[].position` | string | true | true | `"사원"` | 담당자 직급 |
| `assigneeCount` | integer | true | false | `4` | 담당자 총원 |
| `status` | enum | true | false | `"IN_PROGRESS"` | 업무 상태(서버 계산) — 허용값 `IN_PROGRESS`, `COMPLETED`, `EXPIRED` |
| `priority` | enum | true | false | `"HIGH"` | 업무 중요도 — 허용값 `HIGH`, `MEDIUM`, `LOW` |
| `finishDate` | string | true | false | `"2026-07-03"` | 완료기한 |
| `createdAt` | string | true | false | `"2026-06-28T10:15:30"` | 생성 일시 |
| `files` | array\<object\> | true | false | — | 첨부파일 목록 |
| `files[].fileName` | string | true | false | `"당일 지침.pdf"` | 원본 파일명 |
| `files[].fileKey` | string | true | false | `"2026/06/28/guide_a1b2c3.pdf"` | 저장소 파일 키 |
| `reports` | array\<object\> | true | false | — | 담당자별 업무보고 현황 |
| `reports[].workReportId` | integer | true | true | `31` | 업무보고 id. 미제출이면 null. |
| `reports[].appAdminId` | integer | true | false | `7` | 보고 대상 직원 id |
| `reports[].name` | string | true | false | `"이승현"` | 보고 대상 직원 이름 |
| `reports[].status` | enum | true | false | `"APPROVED"` | 보고 심사 상태 — 허용값 `APPROVED`, `REJECTED`, `MISSING` |
| `progress` | object | true | false | — | 보고 진행 현황 집계 |
| `progress.total` | integer | true | false | `4` | 담당자 총원 |
| `progress.approved` | integer | true | false | `2` | 승인 수 |
| `progress.rejected` | integer | true | false | `1` | 반려 수 |
| `progress.pending` | integer | true | false | `1` | 심사대기 수 |
| `progress.missing` | integer | true | false | `0` | 미제출 수 |

## Error Responses

| Status | Message | Body |
| ------ | ------- | ---- |
| `400` | 요청이 유효하지 않습니다. | `{ message, status, timestamp, description }` |
| `401` | 만료된 토큰입니다. | `{ message, status, timestamp, description }` |
| `403` | (빈 메시지) | `{ message, status, timestamp, description }` |
| `404` | 존재하지 않는 업무 지시입니다. | `{ message, status, timestamp, description }` |
| `500` | 예상하지 못한 에러가 발생했습니다. | `{ message, status, timestamp, description }` |

## Validation and Constraints

명세에 응답 필드별 Required·Nullable 표기가 없다. 200 예시 관측에 근거해 `workReportId`와 `position`만 nullable로 두었고 나머지는 non-nullable이다.

## Notes

- `assignees[].id`는 `TEAM_QUERY_TREE` 응답의 `members[].id`와 같은 값이어야
  하며, 수정 화면의 담당자 체크 복원에 쓴다. 담당자 전원이 반환된다
  (2026-09-09 백엔드 확인).
- `status`는 서버가 계산한다. `COMPLETED`의 조건이 `담당자 전원 APPROVED`라
  클라이언트가 만들 수 없다.
- `reports`·`progress`는 상세 하단 업무보고 카드에 대응하지만 이번 범위에서는
  연결하지 않는다.
- `createdAt`은 현재 화면에 표시 위치가 없다.

## 확정된 사항 (2026-09-09 백엔드 확인)

- `assignees`는 담당자 **전원**이다. 수정 화면의 담당자 복원이 이 배열만으로
  성립한다. 예시의 `assignees` 3명 · `assigneeCount` 4 불일치는 문서 오류다.

## Backend Questions

1. `reports[].status`의 허용값 전체가 무엇인가? 예시에 `APPROVED`,
   `REJECTED`, `MISSING`이 보이고 `progress`에는 `pending`도 있는데,
   화면의 심사 상태는 `PENDING`/`APPROVED`/`REJECTED`/`RESUBMITTED`다.
   `MISSING`(미제출)과 `RESUBMITTED`(재제출)의 대응을 확정해야 한다.
2. 응답 필드의 Required·Nullable을 명세에 표기해 달라. 특히 `files`·`reports`가
   빈 배열인지 `null`인지, `assignees[].position`이 `null` 가능한지.
3. `status`의 허용값이 문서에 나열돼 있지 않다. `IN_PROGRESS`/`COMPLETED`/
   `EXPIRED`로 확정했는데 맞는가?
