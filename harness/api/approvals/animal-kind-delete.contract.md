# API Contract — ANIMAL_KIND_DELETE

## Source

- API ID 검색 결과: exact match 1건 (view 모드 전체 행 조회, has_more=false, 2026-09-16 23:43 KST)
- Notion database/data source: https://app.notion.com/p/3dd7a4d6147480feb564ce3b172329f5 / `collection://4817a4d6-1474-820e-ace3-072e3d0100a7`
- Resolved page: https://app.notion.com/p/6e27a4d6147483359570010bec6659a4
- Requested page: https://app.notion.com/p/6e27a4d6147483359570010bec6659a4
- Checked at: 2026-09-16T23:45:00+09:00
- Exact match count: 1

## Basic Information

| API ID             | Name         | Description                                          | Method | Full Path                            | Content-Type     |
| ------------------ | ------------ | ---------------------------------------------------- | ------ | ------------------------------------ | ---------------- |
| ANIMAL_KIND_DELETE | 종 삭제 기능 | 종 ID로 동물 종과 해당 종에 속한 개체를 삭제하는 기능 | DELETE | /animal-manage/kind/{animalKindId}   | application/json |

## Authentication and Authorization

| Required | Type   | Roles |
| -------- | ------ | ----- |
| true     | Bearer | ADMIN |

## Request Headers

| Name          | Type   | Required | Nullable | Default | Example                | Description                                    | Constraints |
| ------------- | ------ | -------- | -------- | ------- | ---------------------- | ---------------------------------------------- | ----------- |
| Authorization | string | true     | false    | 없음    | Bearer <access-token>  | JWT 액세스 토큰. 관리자(ADMIN) 액세스 토큰만 허용 | Bearer 스킴 |

## Path Parameters

| Name         | Type    | Required | Nullable | Default | Example | Description     | Constraints |
| ------------ | ------- | -------- | -------- | ------- | ------- | --------------- | ----------- |
| animalKindId | integer | true     | false    | 없음    | 1       | 삭제할 종의 id  | LONG        |

## Query Parameters

없음

## Request Body

없음

## Request Example

없음

## Success Responses

- `200` — 종 삭제 성공

```json
{
  "message": "종 삭제 성공"
}
```

## Error Responses

공통 오류 바디: `message`(string), `status`(integer), `timestamp`(string), `description`(string)

| Status | Description                        | message                          |
| ------ | ---------------------------------- | -------------------------------- |
| 401    | 만료되었거나 유효하지 않은 토큰    | 만료된 토큰입니다.               |
| 403    | 직원(USER) 토큰으로 호출한 경우    | 접근할 수 있는 권한이 없습니다.  |
| 404    | ANIMAL_KIND_NOT_FOUND              | 존재하지 않는 종입니다.          |
| 500    | 내부 서버 오류가 발생했습니다.     | 내부 서버 오류가 발생했습니다.   |

## Validation and Constraints

- `animalKindId`는 LONG(정수) path 변수이며 필수다.

## Notes

- 명세 Response 비고: 종을 삭제하면 해당 종의 법정지정분류 연결 정보와 소속 개체가 함께 삭제되고, 소속 개체의 관찰 및 특이사항·첨부파일 연결 정보도 함께 삭제된다. 법정지정분류 원본 데이터는 삭제되지 않는다.
- 개발자 확인(2026-09-16): 종 삭제 시 개체·관찰 기록까지 연쇄 삭제 — 명세 비고와 일치.
- 성공 응답은 204가 아니라 200 + message 바디.

## Backend Questions

없음
