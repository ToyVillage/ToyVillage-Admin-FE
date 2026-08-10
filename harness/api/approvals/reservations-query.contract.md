# API Contract — RESERVATION_ADMIN_QUERY

## Source

- API ID 검색 결과: exact match 1건
- Notion database/data source: `82ee8d82-...` / `148e8d82-...` ("API 명세서 1", 2026-08-10 개정)
- Resolved page: https://app.notion.com/p/a0fe8d82a4508392af2b811864e8146c
- Checked at: 2026-08-10
- Exact match count: 1

## Basic Information

| API ID                  | Name             | Method | Full Path         | Content-Type     |
| ----------------------- | ---------------- | ------ | ----------------- | ---------------- |
| RESERVATION_ADMIN_QUERY | 관리자 단체예약 상세 조회 | GET    | /reservation/{id} | application/json |

## Authentication and Authorization

| Required | Type   | Roles |
| -------- | ------ | ----- |
| true     | Bearer | ADMIN |

## Path Parameters

| Name | Type    | Required | Description        |
| ---- | ------- | -------- | ------------------ |
| id   | integer | true     | 조회할 단체예약 ID |

## Query Parameters / Request Body

없음 / 없음

## Request Example

`GET /reservation/1`

## Success Responses

### HTTP 200 — 예약 상세 객체

```json
{
  "counselDate": "2026-07-02",
  "visitDate": "2026-07-13",
  "visitTime": "13:01:00",
  "exitTime": "15:00:00",
  "reservationName": "홍길동",
  "reservationCount": 20,
  "location": "대전광역시 유성구 장동",
  "title": "대덕소프트웨어마이스터고",
  "money": 200000,
  "status": "사전답사 완료",
  "leaderCount": 3,
  "leaderPhoneNumber": "010-7753-9698"
}
```

## UI 매핑 (ReservationInfoCard)

| API 필드            | UI(ReservationDetail) |
| ------------------- | --------------------- |
| counselDate         | consultDate (상담일)  |
| visitDate           | reserveDate (예약일)  |
| visitTime           | reserveTime (예약 시작) |
| exitTime            | reserveTimeEnd (예약 종료) |
| reservationName     | reserverName (예약인) |
| reservationCount    | headcount (전체 인원) |
| location            | region / regionDetail (지역) |
| title               | groupName (단체명)    |
| money               | admissionFee (입장료) |
| status              | surveyStatus (상태)   |
| leaderCount         | guideCount (인솔자 인원) |
| leaderPhoneNumber   | guideContact (인솔자 연락처) |

## Error Responses

공통 바디: `{ message, status, timestamp, description }`

| Status | 대표 message                     |
| ------ | -------------------------------- |
| 401    | 만료된 토큰입니다.               |
| 403    | 접근할 수 있는 권한이 없습니다.  |
| 404    | 존재하지 않는 단체예약 목록입니다. |
| 500    | 내부 서버 오류가 발생했습니다.   |

## Notes

- 응답에 `id` 없음 → 요청 path의 `id` 사용.
- 이전 임시 매핑(B)의 빈 값(단체명·상태·인솔자 연락처)이 실제 필드로 해소됨.

## Backend Questions

없음.
