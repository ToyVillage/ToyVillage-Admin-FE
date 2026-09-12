# API Contract — TASK_CREATE

## Source

- API ID 검색 결과: `TASK_CREATE` exact match 1건
- Notion database/data source: https://app.notion.com/p/3d67a4d614748030af5dc94e59b3d9b7 / `collection://65d7a4d6-1474-82e1-8615-07f152254595`
- Resolved page: https://app.notion.com/p/8ec7a4d6147483eb8aca81eddb519f97
- Requested page: 없음
- Checked at: 2026-09-09T20:10:00+09:00
- Exact match count: 1

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| ------ | ---- | ----------- | ------ | --------- | ------------ |
| `TASK_CREATE` | 업무지시 작성 기능 | 직원에게 업무를 할당하는 기능 | `POST` | `/tasks` | `application/json` |

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

없음

## Request Body

required: true

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `title` | string | true | false | `"9월 정기 안전점검"` | 업무지시의 제목 |
| `content` | string | true | false | `"놀이기구 전수 점검 후 체크리스트를 제출해주세요."` | 업무지시 내용 |
| `assigneeIds` | array\<integer\> | true | false | `[3, 4, 6, 7, 19]` | 업무지시를 할당할 유저의 id 리스트 |
| `finishDate` | string | true | false | `"2026-09-05"` | 마감기한 날짜. 시간 지정 없이 날짜만. |
| `priority` | enum | true | false | `"HIGH"` | 업무지시의 중요도 — 허용값 `HIGH`, `MEDIUM`, `LOW` |
| `files` | array\<string\> | true | false | `["2026/08/24/checklist_a1b2c3.xlsx"]` | 첨부파일 키 목록. 첨부파일이 없으면 빈 배열. |

## Request Example

```json
{
  "title": "9월 정기 안전점검",
  "content": "놀이기구 전수 점검 후 체크리스트를 제출해주세요.",
  "assigneeIds": [
    3,
    4,
    6,
    7,
    19
  ],
  "finishDate": "2026-09-05",
  "priority": "HIGH",
  "files": [
    "2026/08/24/checklist_a1b2c3.xlsx"
  ]
}
```

## Success Responses

### `201`

업무지시 등록 성공

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `message` | string | true | false | `"업무지시가 등록되었습니다."` | 결과 메시지 |

## Error Responses

| Status | Message | Body |
| ------ | ------- | ---- |
| `400` | 요청이 유효하지 않습니다. | `{ message, status, timestamp, description }` |
| `401` | 만료된 토큰입니다. | `{ message, status, timestamp, description }` |
| `403` | (빈 메시지) | `{ message, status, timestamp, description }` |
| `500` | 예상하지 못한 에러가 발생했습니다. | `{ message, status, timestamp, description }` |

## Validation and Constraints

`priority`는 `HIGH`/`MEDIUM`/`LOW`. `finishDate`는 `yyyy-MM-dd`. `files`는 첨부가 없으면 빈 배열. 필드별 Required 표기 누락분은 Backend Questions 참고.

## Notes

- 요청의 `assigneeIds`는 `TEAM_QUERY_TREE`(`GET /team/tree`) 응답의
  `members[].id`다. 그 연동이 선행되어야 한다.
- 첨부파일 키는 승인된 `FILE_CREATE`(`POST /file`) 응답의 `fileKey`다.
- `assigneeIds`의 타입 표기는 `api-input-contract.md`의 기본 타입 목록에 없는
  `array<integer>`를 썼다. 명세가 `LIST<LONG>`이라 `array<object>`로 적으면
  구현을 오도하기 때문이다.

## Backend Questions

1. `assigneeIds`, `finishDate`, `files`에 Required 표기가 없다. 각각 필수인가?
   (`assigneeIds`는 `하나는 무조건 포함되어야함` 설명만 있다.)
2. `Content-Type`이 Body Example 코드블록에만 있다. `application/json`으로
   확정해도 되는가?
3. 페이지 하단 `ENUM` 절의 `assigneeType`(ALL/EMPLOYEE/TEAM) 표는 요청 필드가
   `assigneeIds`로 바뀌면서 쓰이지 않는다. 삭제해도 되는가?
