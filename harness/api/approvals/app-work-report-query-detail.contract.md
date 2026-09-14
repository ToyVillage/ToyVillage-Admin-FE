# API Contract — APP_WORK_REPORT_QUERY_DETAIL

## Source

- API ID 검색 결과: `APP_WORK_REPORT_QUERY_DETAIL` exact match 1건
- Notion database/data source: https://app.notion.com/p/3da7a4d6147480d28d51d71665c28b22 / `collection://e567a4d6-1474-82c4-8267-879439b48892`
- Resolved page: https://app.notion.com/p/5627a4d6147482dbbfa701b2fb8a8447
- Requested page: 없음
- Checked at: 2026-09-13T21:15:00+09:00
- Exact match count: 1

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| ------ | ---- | ----------- | ------ | --------- | ------------ |
| `APP_WORK_REPORT_QUERY_DETAIL` | 직원 업무 상세 조회 | 직언 업무 상세 조회 | `GET` | `/work-report/detail/{workReportId}` | `application/json` |

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

`GET /work-report/detail/12`

## Success Responses

### `200`

업무보고 상세

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `id` | integer | true | false | `12` | 업무보고 id |
| `title` | string | true | false | `"9월 정기 안전점검"` | 업무지시 제목 |
| `priority` | enum | true | false | `"HIGH"` | 업무지시 중요도 — 허용값 `HIGH`, `MEDIUM`, `LOW` |
| `finishDate` | string | true | false | `"2026-09-05"` | 업무지시 만료 기한 (`yyyy-MM-dd`) |
| `taskId` | integer | true | false | `5` | 업무지시 id |
| `name` | string | true | false | `"홍길동"` | 담당자 이름 |
| `content` | string | true | false | `"동물 우리 청소와 소독을 완료했습니다."` | 업무보고 내용 |
| `note` | string | true | false | `"사료 보관함 추가 점검이 필요합니다."` | 비고. Nullable 표기 없음 |
| `files` | array\<object\> | true | false | — | 첨부 파일 목록. 비어 있을 수 있다. |
| `files[].fileName` | string | true | false | `"inspection.pdf"` | 파일 이름 |
| `files[].fileKey` | string | true | false | `"work-report/2026/08/inspection.pdf"` | 파일 키 |
| `status` | enum | true | false | `"PENDING"` | 심사 상태 — 허용값 `PENDING`, `APPROVED`, `REJECTED` |
| `rejectionReason` | string | true | true | `null` | 반려 사유 |

## Error Responses

| Status | Message | Body |
| ------ | ------- | ---- |
| `401` | 만료된 토큰입니다. | `{ message, status, timestamp, description }` |
| `404` | 존재하지 않는 업무관리입니다. | `{ message, status, timestamp, description }` |
| `500` | 예상하지 못한 에러가 발생했습니다. | `{ message, status, timestamp, description }` |

## Validation and Constraints

- 명세에 응답 필드별 Required·Nullable 표기가 없다. 200 예시 관측에 근거했고, 예시가 `null`인 `rejectionReason`만 nullable로 동결했다.
- `status` 허용값 표가 없어 `APP_WORK_REPORT_QUERY_ALL`의 `status` 허용값을 적용했다(spec `# 상태 표시` 결정).
- 화면이 쓰지 않는 `taskId`, `note`, `files[].fileKey`, `rejectionReason`은 런타임 형식 검증에서 제외한다. 특히 `note`는 null 가능성이 확인되지 않았다.

## Notes

- 화면 연결: `name`→담당자, `status`→심사 배지, `priority`→중요도 배지, `finishDate`→완료기한, `title`·`content`→내용 카드, `files[].fileName`→첨부자료.
- 업무 상세(`TASK_QUERY`)의 `reports[].workReportId`가 이 API의 `workReportId`다.

## Backend Questions

1. 응답 `status` 허용값을 적어 달라. `PENDING`/`APPROVED`/`REJECTED`로 가정했다.
2. `note`가 null일 수 있는지, `files`가 없을 때 빈 배열인지 null인지.
3. `rejectionReason`이 반려된 보고에서만 값이 있는지.
4. ADMIN 전용인데 `403`이 정의되어 있지 않다.
