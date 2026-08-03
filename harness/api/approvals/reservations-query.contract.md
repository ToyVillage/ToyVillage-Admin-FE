# API Contract — RESERVATION_QUERY

## Source

- API ID 검색 결과: exact match 1건
- Notion database/data source: `e33e8d82-...` / `9bbe8d82-...` ("API 명세서 (1)", 최신)
- Resolved page: https://app.notion.com/p/ee2e8d82a45082ed9c6e017bdc2060dd
- Requested page: 없음 (제공 URL은 데이터베이스 뷰 인덱스)
- Checked at: 2026-08-03
- Exact match count: 1

## Basic Information

| API ID            | Name              | Method | Full Path         | Content-Type     |
| ----------------- | ----------------- | ------ | ----------------- | ---------------- |
| RESERVATION_QUERY | 단체예약 단일조회 기능 | GET    | /reservation/{id} | application/json |

## Authentication and Authorization

| Required | Type   | Roles       |
| -------- | ------ | ----------- |
| true     | Bearer | USER, ADMIN |

## Request Headers

| Name          | Type   | Required | Example                 |
| ------------- | ------ | -------- | ----------------------- |
| Authorization | string | true     | `Bearer <access-token>` |

## Path Parameters

| Name | Type    | Required | Description        |
| ---- | ------- | -------- | ------------------ |
| id   | integer | true     | 예약(Reservation)의 id |

## Query Parameters

없음

## Request Body

없음

## Request Example

`GET /reservation/1`

## Success Responses

### HTTP 200 — 예약 상세 객체

```json
{
  "id": 1,
  "reservationName": "예약인 성함",
  "leaderCount": 5,
  "reservationCount": 20,
  "location": "위치",
  "visitDate": "2026-07-12T09:41:00.123",
  "exitTime": "09:14:14",
  "visitSiteDate": "2026-07-12T09:41:00.123",
  "visitSiteTime": "09:14:14",
  "visitSiteExitTime": "09:14:14",
  "visitSiteCount": 3,
  "money": 1000
}
```

필드: `id`(integer), `reservationName`(string), `leaderCount`(integer), `reservationCount`(integer), `location`(string), `visitDate`(datetime), `exitTime`(string HH:mm:ss), `visitSiteDate`(datetime), `visitSiteTime`(string HH:mm:ss), `visitSiteExitTime`(string HH:mm:ss), `visitSiteCount`(integer), `money`(integer, 명세 타입/설명 미기재).

## Error Responses

공통 바디: `{ message, status, timestamp, description }`

| Status | 대표 message                       |
| ------ | ---------------------------------- |
| 401    | 만료된 토큰입니다.                 |
| 403    | 접근할 수 있는 권한이 없습니다.    |
| 404    | 존재하지 않는 예약입니다           |
| 500    | 예상하지 못한 에러가 발생했습니다. |

## Validation and Constraints

- `id`는 양의 정수. 응답은 단일 객체(배열 아님).

## Notes

- 목록 UI가 쓰는 `단체명`, `상태(사전답사 라벨)`, `인솔자 연락처`는 응답에 없음(임시 매핑 B에서 빈 값).

## Backend Questions

1. `단체명` / `상태(사전답사 라벨)` / `인솔자 연락처` 응답 추가 여부.
2. `money` 타입·의미(입장료?) 확정.
3. 200 예시 JSON `visitSiteCount` 뒤 콤마 누락(유효 JSON 아님) 수정.
4. 명세서 DB 정본 지정(중복 3개).
