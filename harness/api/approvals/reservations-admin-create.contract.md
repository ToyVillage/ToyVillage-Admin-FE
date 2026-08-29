# API Contract — RESERVATION_ADMIN_CREATE

## Source

- API ID 검색 결과: exact match 1건
- Notion database/data source: `ebee8d82-…` / `a14e8d82-…`
- Resolved page: https://app.notion.com/p/6f5e8d82a45083b0843a81da29f9eaae
- Checked at: 2026-08-29 · Exact match count: 1

## Basic Information

| API ID | Name | Method | Full Path | Content-Type |
| ------ | ---- | ------ | --------- | ------------ |
| RESERVATION_ADMIN_CREATE | 단체예약 생성 | POST | /reservation | application/json |

## Authentication and Authorization

| Required | Type | Roles |
| -------- | ---- | ----- |
| true | Bearer (JWT) | ADMIN |

## Request Headers

| Name | Required | Example |
| ---- | -------- | ------- |
| Authorization | true | `Bearer <access-token>` |

## Path Parameters / Query Parameters

없음 / 없음

## Request Body (required)

| Name | Type | Required | Constraints |
| ---- | ---- | -------- | ----------- |
| title | string | true | 50자 이하 |
| location | string | true | 50자 이하 |
| counselDate | string(yyyy-MM-dd) | true | |
| reservationName | string | true | 20자 이하 |
| leaderPhoneNumber | string | true | 15자 이하 |
| reservationCount | integer | true | 1 이상 |
| leaderCount | integer | true | 0 이상 |
| money | integer | true | 0 이상 |
| visitDate | string(yyyy-MM-dd) | true | |
| visitTime | string(HH:mm) | true | |
| exitTime | string(HH:mm) | true | 입장보다 뒤 |
| visitSiteCount | integer | true | 0 이상 |
| visitSiteDate | string(yyyy-MM-dd) | true | 방문일 이하 |
| visitSiteTime | string(HH:mm) | true | |
| visitSiteExitTime | string(HH:mm) | true | 입장보다 뒤 |
| appAdminIds | array\<integer\> | false | 생략/빈배열 → 배정 없음, 중복 1회 |

> `reservationDate`/`reservationTime`/`status`는 요청에 포함하지 않음(서버 자동).

## Request Example

```json
{ "title": "대구유치원", "location": "대구광역시", "counselDate": "2026-08-16", "reservationName": "이승현", "leaderPhoneNumber": "010-0000-0000", "reservationCount": 12, "leaderCount": 3, "money": 48000, "visitDate": "2026-08-20", "visitTime": "10:00", "exitTime": "18:00", "visitSiteCount": 8, "visitSiteDate": "2026-08-16", "visitSiteTime": "10:00", "visitSiteExitTime": "15:00", "appAdminIds": [3, 7] }
```

## Success Responses

### HttpStatus 201

- `message` (string) — 예: "단체예약 생성이 완료되었습니다."

## Error Responses

| Status | Message | Description |
| ------ | ------- | ----------- |
| 400 | 요청이 유효하지 않습니다. | 필수/글자수/범위 |
| 400 | 퇴장 시간은 입장 시간보다 빠를 수 없습니다. | RESERVATION_INVALID_TIME |
| 400 | 사전답사일은 방문일보다 늦을 수 없습니다. | RESERVATION_INVALID_DATE |
| 401 | 만료된 토큰입니다. | 만료된 토큰 |
| 403 | 접근할 수 있는 권한이 없습니다. | 권한 없음 |
| 404 | 존재하지 않는 앱 관리자입니다. | appAdminIds 에 없는 직원 id |
| 500 | 내부 서버 오류가 발생했습니다. | 서버 오류 |

공통 오류 형태: `{ message: string, status: integer, timestamp: datetime, description: string }`

## Validation and Constraints

- 퇴장 시간 > 입장 시간(방문·사전답사). 사전답사일 ≤ 방문일. 글자수/인원/금액 범위는 서버 검증.

## Notes

- 생성 후 목록 복귀 + `['reservations']` 무효화.

## Backend Questions

없음 (단, 생성 페이지의 배정 직원 후보 소스는 프론트 결정 사항 — 아래 project-analysis 참조)
