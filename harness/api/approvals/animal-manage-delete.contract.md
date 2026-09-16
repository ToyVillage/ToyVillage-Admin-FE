# API Contract — ANIMAL_MANAGE_DELETE

## Source

- API ID 검색 결과: exact match 1건 (data source SQL COUNT + view 모드 전체 행
  조회(2026-09-16 23:43 KST) 교차 확인)
- Notion database/data source: https://app.notion.com/p/3dd7a4d6147480feb564ce3b172329f5 / `collection://4817a4d6-1474-820e-ace3-072e3d0100a7`
- Resolved page: https://app.notion.com/p/cd07a4d61474828f9bf60134fb33e36d
- Requested page: https://app.notion.com/p/cd07a4d61474828f9bf60134fb33e36d
- Checked at: 2026-09-16T23:45:00+09:00
- Exact match count: 1

## Basic Information

| API ID                 | Name           | Description                         | Method | Full Path                         | Content-Type     |
| ---------------------- | -------------- | ----------------------------------- | ------ | --------------------------------- | ---------------- |
| `ANIMAL_MANAGE_DELETE` | 개체 삭제 기능 | 개체 ID로 동물 개체를 삭제하는 기능 | DELETE | `/animal-manage/{animalManageId}` | application/json |

## Authentication and Authorization

| Required | Type   | Roles |
| -------- | ------ | ----- |
| true     | Bearer | ADMIN |

## Request Headers

| Name          | Type   | Required | Nullable | Description                                              |
| ------------- | ------ | -------- | -------- | -------------------------------------------------------- |
| Authorization | string | true     | false    | JWT 액세스 토큰. ADMIN만 허용. `Bearer {accessToken}` |

## Path Parameters

| Name           | Type           | Required | Nullable | Description      |
| -------------- | -------------- | -------- | -------- | ---------------- |
| animalManageId | integer (LONG) | true     | false    | 삭제할 개체의 id |

## Query Parameters

없음

## Request Body

없음

## Request Example

`DELETE /animal-manage/12`

## Success Responses

- **200** — `{ "message": "개체 삭제 성공" }` (`message`: string). 204 No Content가 아니라 200 + 메시지 바디.

## Error Responses

공통 오류 바디: `message`(string), `status`(integer), `timestamp`(string), `description`(string)

| Status | Message                         | Description                     |
| ------ | ------------------------------- | ------------------------------- |
| 401    | 만료된 토큰입니다.              | 만료된 토큰입니다.              |
| 403    | 접근할 수 있는 권한이 없습니다. | 직원(USER) 토큰으로 호출한 경우 |
| 404    | 존재하지 않는 개체입니다.       | ANIMAL_MANAGE_NOT_FOUND         |
| 500    | 내부 서버 오류가 발생했습니다.  | 내부 서버 오류                  |

## Validation and Constraints

- `animalManageId`는 LONG

## Notes

- 개체 삭제 시 해당 개체의 관찰 기록까지 함께 삭제됨(개발자 확인 2026-09-16) — Notion 명세에는 기재 없음, 명세 보강 필요.

## Backend Questions

- 관찰 기록 연쇄 삭제 동작을 Notion 명세에 명시해 달라는 요청
