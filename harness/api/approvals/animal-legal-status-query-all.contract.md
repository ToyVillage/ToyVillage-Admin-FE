# API Contract — ANIMAL_LEGAL_STATUS_QUERY_ALL

## Source

- API ID 검색 결과: exact match 1건 (view 모드 전체 행 조회, has_more=false, 2026-09-16 23:43 KST)
- Notion database/data source: https://app.notion.com/p/3dd7a4d6147480feb564ce3b172329f5 / `collection://4817a4d6-1474-820e-ace3-072e3d0100a7`
- Resolved page: https://app.notion.com/p/3c07a4d6147482de93ce0103c34bb7b1
- Requested page: https://app.notion.com/p/3c07a4d6147482de93ce0103c34bb7b1
- Checked at: 2026-09-16T23:45:00+09:00
- Exact match count: 1

## Basic Information

| API ID                        | Name                   | Description                                  | Method | Full Path                     | Content-Type     |
| ----------------------------- | ---------------------- | -------------------------------------------- | ------ | ----------------------------- | ---------------- |
| ANIMAL_LEGAL_STATUS_QUERY_ALL | 법정지정분류 목록 조회 | 등록된 법정지정분류 전체 목록을 조회하는 기능 | GET    | /animal-manage/legal-status   | application/json |

## Authentication and Authorization

| Required | Type   | Roles       |
| -------- | ------ | ----------- |
| true     | Bearer | USER, ADMIN |

## Request Headers

| Name          | Type   | Required | Nullable | Default | Example               | Description                                              | Constraints |
| ------------- | ------ | -------- | -------- | ------- | --------------------- | -------------------------------------------------------- | ----------- |
| Authorization | string | true     | false    | 없음    | Bearer <access-token> | JWT 액세스 토큰. 관리자(ADMIN)·직원(USER) 액세스 토큰 모두 허용 | Bearer 스킴 |

## Path Parameters

없음

## Query Parameters

없음

## Request Body

없음

## Request Example

없음

## Success Responses

- `200` — 법정지정분류 전체 목록. 래핑 객체 없이 최상위 배열(`array<object>`).

항목 필드:

| Name                | Type    | Required | Nullable | Example                | Description       |
| ------------------- | ------- | -------- | -------- | ---------------------- | ----------------- |
| animalLegalStatusId | integer | true     | false    | 1                      | 법정지정분류 id   |
| kind                | string  | true     | false    | 멸종위기 야생생물 Ⅰ급  | 법정지정분류 이름 |

```json
[
  {
    "animalLegalStatusId": 1,
    "kind": "멸종위기 야생생물 Ⅰ급"
  },
  {
    "animalLegalStatusId": 2,
    "kind": "국제적 멸종위기종"
  }
]
```

## Error Responses

공통 오류 바디: `message`(string), `status`(integer), `timestamp`(string), `description`(string)

| Status | Description                     | message                         |
| ------ | ------------------------------- | ------------------------------- |
| 401    | 만료되었거나 유효하지 않은 토큰 | 만료된 토큰입니다.              |
| 403    | 접근할 수 있는 권한이 없습니다. | 접근할 수 있는 권한이 없습니다. |
| 500    | 내부 서버 오류가 발생했습니다.  | 내부 서버 오류가 발생했습니다.  |

## Validation and Constraints

없음

## Notes

- 항목 필드 타입은 예시 JSON에서 정규화했다(별도 필드 선언 표는 명세에 없음).
- 개발자 확인(2026-09-16, 명세에 없음): 법정지정분류는 전체 공용 목록이며, 기본 3개 항목(지정관리 야생동물·멸종위기 야생생물 I급·천연기념물)은 서버가 내려주지 않는다.
- staging 실측 GET 200 — 명세 성공 status와 일치.

## Backend Questions

없음
