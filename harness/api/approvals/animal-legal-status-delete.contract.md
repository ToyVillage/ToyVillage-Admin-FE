# API Contract — ANIMAL_LEGAL_STATUS_DELETE

## Source

- API ID 검색 결과: exact match 1건 (view 모드 전체 행 조회, has_more=false, 2026-09-16 23:43 KST)
- Notion database/data source: https://app.notion.com/p/3dd7a4d6147480feb564ce3b172329f5 / `collection://4817a4d6-1474-820e-ace3-072e3d0100a7`
- Resolved page: https://app.notion.com/p/d5e7a4d6147483f2803d8159fa9dcd75
- Requested page: https://app.notion.com/p/d5e7a4d6147483f2803d8159fa9dcd75
- Checked at: 2026-09-16T23:45:00+09:00
- Exact match count: 1

## Basic Information

| API ID                     | Name                   | Description                                    | Method | Full Path                                           | Content-Type     |
| -------------------------- | ---------------------- | ---------------------------------------------- | ------ | --------------------------------------------------- | ---------------- |
| ANIMAL_LEGAL_STATUS_DELETE | 법정지정분류 삭제 기능 | 법정지정분류 ID로 법정지정분류를 삭제하는 기능 | DELETE | /animal-manage/legal-status/{animalLegalStatusId}   | application/json |

## Authentication and Authorization

| Required | Type   | Roles |
| -------- | ------ | ----- |
| true     | Bearer | ADMIN |

## Request Headers

| Name          | Type   | Required | Nullable | Default | Example               | Description                                    | Constraints |
| ------------- | ------ | -------- | -------- | ------- | --------------------- | ---------------------------------------------- | ----------- |
| Authorization | string | true     | false    | 없음    | Bearer <access-token> | JWT 액세스 토큰. 관리자(ADMIN) 액세스 토큰만 허용 | Bearer 스킴 |

## Path Parameters

| Name                | Type    | Required | Nullable | Default | Example | Description               | Constraints |
| ------------------- | ------- | -------- | -------- | ------- | ------- | ------------------------- | ----------- |
| animalLegalStatusId | integer | true     | false    | 없음    | 1       | 삭제할 법정지정분류의 id  | LONG        |

## Query Parameters

없음

## Request Body

없음

## Request Example

없음

## Success Responses

- `200` — 법정지정분류 삭제 성공

```json
{
  "message": "법정지정분류 삭제 성공"
}
```

## Error Responses

공통 오류 바디: `message`(string), `status`(integer), `timestamp`(string), `description`(string)

| Status | Description                       | message                            |
| ------ | --------------------------------- | ---------------------------------- |
| 401    | 만료되었거나 유효하지 않은 토큰   | 만료된 토큰입니다.                 |
| 403    | 직원(USER) 토큰으로 호출한 경우   | 접근할 수 있는 권한이 없습니다.    |
| 404    | ANIMAL_LEGAL_STATUS_NOT_FOUND     | 존재하지 않는 법정지정분류입니다.  |
| 500    | 내부 서버 오류가 발생했습니다.    | 내부 서버 오류가 발생했습니다.     |

## Validation and Constraints

- `animalLegalStatusId`는 LONG(정수) path 변수이며 필수다.

## Notes

- 명세 Response 비고: "종에 이미 저장된 법정지정분류 이름은 문자열로 유지되며 함께 삭제되지 않습니다."
- 개발자 확인(2026-09-16, 명세와 불일치): 법정지정분류는 전체 공용 목록이며, DELETE 하면 그 항목을 선택했던 모든 종에서 함께 빠진다(오류 아님). 명세 비고(문자열로 유지)와 반대 설명이라 Contract에는 명세 값만 반영하고 아래 Backend Questions로 남긴다.
- 성공 응답은 204가 아니라 200 + message 바디.

## Backend Questions

1. 법정지정분류 삭제 시 그 항목을 선택했던 종에서의 실제 동작은 무엇인가? 명세 비고는 "종에 저장된 이름은 문자열로 유지"라 하고, 개발자 확인(2026-09-16)은 "모든 종에서 함께 빠진다"라 하여 서로 반대다. 정확한 파급 동작과 명세 수정 여부 확인 필요.
