# API Contract — RESERVATION_ADMIN_UPDATE

## Source

- API ID 검색 결과: exact match 1건
- Notion database/data source: `ebee8d82-…` / `a14e8d82-…`
- Resolved page: https://app.notion.com/p/44ae8d82a45082e39cf001383de8a204
- Checked at: 2026-08-29 · Exact match count: 1

## Basic Information

| API ID | Name | Method | Full Path | Content-Type |
| ------ | ---- | ------ | --------- | ------------ |
| RESERVATION_ADMIN_UPDATE | 단체예약 수정 | PATCH | /reservation/{reservationId} | application/json |

## Authentication and Authorization

| Required | Type | Roles |
| -------- | ---- | ----- |
| true | Bearer (JWT) | ADMIN |

## Request Headers

| Name | Required | Example |
| ---- | -------- | ------- |
| Authorization | true | `Bearer <access-token>` |

## Path Parameters

| Name | Type | Required | Example | Description |
| ---- | ---- | -------- | ------- | ----------- |
| reservationId | integer | true | 1 | 수정할 단체예약 id(LONG) |

## Query Parameters

없음

## Request Body (required) — 생성과 동일(전체 필드 재전송)

`RESERVATION_ADMIN_CREATE`와 동일한 16필드(title/location/counselDate/reservationName/leaderPhoneNumber/reservationCount/leaderCount/money/visitDate/visitTime/exitTime/visitSiteCount/visitSiteDate/visitSiteTime/visitSiteExitTime/appAdminIds?). 타입·제약 동일.

- `appAdminIds` 기준으로 배정 **통째 교체**(생략/빈배열 → 전체 해제).
- `reservationDate`/`reservationTime`은 최초 생성 시각 유지, `status`는 날짜 변경 시 재계산.

## Request Example

`PATCH /reservation/1` — body는 생성 예시와 동일.

## Success Responses

### HttpStatus 200

- `message` (string) — 예: "단체예약 수정이 완료되었습니다."

## Error Responses

| Status | Message | Description |
| ------ | ------- | ----------- |
| 400 | 요청이 유효하지 않습니다. / 퇴장 시간… / 사전답사일… | 필수·범위 / RESERVATION_INVALID_TIME / RESERVATION_INVALID_DATE |
| 401 | 만료된 토큰입니다. | 만료된 토큰 |
| 403 | 접근할 수 있는 권한이 없습니다. | 권한 없음 |
| 404 | 존재하지 않는 단체예약 목록입니다. / 존재하지 않는 앱 관리자입니다. | RESERVATION_NOT_FOUND / 없는 직원 id |
| 500 | 내부 서버 오류가 발생했습니다. | 서버 오류 |

공통 오류 형태: `{ message: string, status: integer, timestamp: datetime, description: string }`

## Validation and Constraints

- 퇴장 시간 > 입장 시간(방문·사전답사). 사전답사일 ≤ 방문일. 글자수/인원/금액 범위는 서버 검증.

## Notes

- 성공 후 목록 복귀 + `['reservations']` 무효화. 바디/타입은 생성 계약과 공유.

## Backend Questions

없음 (단, 상세조회 응답에 사전답사 필드 부재 — project-analysis 참조)
