# API Contract — ANIMAL_OBSERVATION_DELETE

## Source

- API ID 검색 결과: exact match 1건 (view 모드 전체 행 조회, 2026-09-16 23:43 KST)
- Notion database/data source: https://app.notion.com/p/3dd7a4d6147480feb564ce3b172329f5 / `collection://4817a4d6-1474-820e-ace3-072e3d0100a7`
- Resolved page: https://app.notion.com/p/c887a4d6147483fa8de40199c552efe2
- Requested page: https://app.notion.com/p/c887a4d6147483fa8de40199c552efe2
- Checked at: 2026-09-16T23:45:35+09:00
- Exact match count: 1

## Basic Information

| API ID                      | Name                       | Description                               | Method | Full Path                                                      | Content-Type     |
| --------------------------- | -------------------------- | ----------------------------------------- | ------ | -------------------------------------------------------------- | ---------------- |
| `ANIMAL_OBSERVATION_DELETE` | 관찰 및 특이사항 삭제 기능 | 관리자가 관찰 및 특이사항을 삭제하는 기능 | DELETE | `/animal-manage/{animalManageId}/observations/{observationId}` | application/json |

## Authentication and Authorization

| Required | Type   | Roles |
| -------- | ------ | ----- |
| true     | Bearer | ADMIN |

## Request Headers

| Name          | Type   | Required | Nullable | Description                                           |
| ------------- | ------ | -------- | -------- | ----------------------------------------------------- |
| Authorization | string | true     | false    | JWT 액세스 토큰. ADMIN만 허용. `Bearer {accessToken}` |

## Path Parameters

| Name           | Type           | Required | Nullable | Description                       |
| -------------- | -------------- | -------- | -------- | --------------------------------- |
| animalManageId | integer (LONG) | true     | false    | 관찰 및 특이사항이 속한 개체의 id |
| observationId  | integer (LONG) | true     | false    | 삭제할 관찰 및 특이사항의 id      |

## Query Parameters

없음

## Request Body

없음

## Request Example

`DELETE /animal-manage/12/observations/7`

## Success Responses

- **200** — 관찰 및 특이사항 삭제 성공. 삭제 시 첨부파일 연결 정보도 함께 삭제됨.
  - `message`(string) — 예시 `관찰 및 특이사항 삭제 성공`

## Error Responses

공통 오류 바디: `message`(string), `status`(integer), `timestamp`(string), `description`(string)

| Status | Message                              | Description                                     |
| ------ | ------------------------------------ | ----------------------------------------------- |
| 401    | 만료된 토큰입니다.                   | 만료되었거나 유효하지 않은 토큰                 |
| 403    | 접근할 수 있는 권한이 없습니다.      | 직원(USER) 토큰으로 호출한 경우                 |
| 404    | 존재하지 않는 관찰 및 특이사항입니다. | 개체와 관찰 및 특이사항의 조합이 존재하지 않는 경우 |
| 500    | 내부 서버 오류가 발생했습니다.       | 내부 서버 오류가 발생했습니다.                  |

## Validation and Constraints

- `animalManageId`·`observationId`는 LONG

## Notes

- 성공이 204 No Content가 아니라 200 + `{message}` 본문이다(명세 그대로).
- 개체 삭제·종 삭제 시 관찰이 연쇄 삭제된다(개발자 확인 2026-09-16, 명세에 없음 — 이 API를 거치지 않는 삭제 경로).
- staging 실측은 GET 200·POST 201만 확인됨 — DELETE 실측 status는 미확인(명세는 200).

## Backend Questions

- 삭제 시 첨부파일 "연결 정보"만 삭제로 명시 — 파일 서버의 파일 실체 삭제 여부 (명세 미기재)
