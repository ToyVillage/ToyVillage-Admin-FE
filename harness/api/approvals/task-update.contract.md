# API Contract — TASK_UPDATE

## Source

- API ID 검색 결과: `TASK_UPDATE` exact match 1건
- Notion database/data source: https://app.notion.com/p/3d67a4d614748030af5dc94e59b3d9b7 / `collection://65d7a4d6-1474-82e1-8615-07f152254595`
- Resolved page: https://app.notion.com/p/9da7a4d614748340a6d3013d68e37ff2
- Requested page: 없음
- Checked at: 2026-09-09T20:10:00+09:00
- Exact match count: 1

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| ------ | ---- | ----------- | ------ | --------- | ------------ |
| `TASK_UPDATE` | 업무지시 수정 기능 | 직원에게 할당한 업무를 수정하는 기능 | `PUT` | `/tasks/{id}` | `application/json` |

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
| `id` | integer | true | false | `1` | task의 id |

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
| `files` | array\<string\> | true | true | `["2026/08/24/checklist_a1b2c3.xlsx"]` | 첨부파일 키 목록. 빈 리스트는 파일 초기화, 값이 있으면 그 리스트로 대체, null이면 기존 유지. |

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
  "priority": "MEDIUM",
  "files": [
    "2026/08/24/checklist_a1b2c3.xlsx"
  ]
}
```

## Success Responses

### `200`

업무지시 수정 성공

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `message` | string | true | false | `"업무지시가 수정되었습니다."` | 결과 메시지 |

## Error Responses

| Status | Message | Body |
| ------ | ------- | ---- |
| `400` | 요청이 유효하지 않습니다. | `{ message, status, timestamp, description }` |
| `401` | 만료된 토큰입니다. | `{ message, status, timestamp, description }` |
| `403` | (빈 메시지) | `{ message, status, timestamp, description }` |
| `404` | 존재하지 않는 업무 지시입니다. | `{ message, status, timestamp, description }` |
| `500` | 예상하지 못한 에러가 발생했습니다. | `{ message, status, timestamp, description }` |

## Validation and Constraints

`priority`는 `HIGH`/`MEDIUM`/`LOW`. `finishDate`는 `yyyy-MM-dd`. `files`만 `null` 허용(기존 유지). 필드별 Required 표기 누락분은 Backend Questions 참고.

## Notes

- 요청의 `assigneeIds`는 `TEAM_QUERY_TREE` 응답의 `members[].id`이고, 수정
  화면의 기존 선택 복원은 `TASK_QUERY` 응답의 `assignees[].id`로 한다.
- `files`는 3분기다. 빈 배열은 첨부 초기화, 값이 있으면 그 목록으로 대체,
  `null`이면 기존 유지. 현재 폼은 첨부 목록 전체를 항상 다시 제출하므로
  `null`을 보내지 않는다.
- `assigneeIds`의 타입 표기는 `array<integer>`를 썼다(명세 `LIST<LONG>`).

## Backend Questions

1. `assigneeIds`, `finishDate`, `files`에 Required 표기가 없다. 각각 필수인가?
2. `assigneeIds`도 `files`처럼 `null`이면 기존 유지인가, 아니면 항상 전체
   교체인가? 현재 Contract는 전체 교체(non-nullable)로 두었다.
3. `Content-Type`이 Body Example 코드블록에만 있다. `application/json`으로
   확정해도 되는가?
4. 페이지 하단 `ENUM` 절의 `assigneeType` 표는 쓰이지 않는다. 삭제해도 되는가?
