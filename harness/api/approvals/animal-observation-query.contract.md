# API Contract — ANIMAL_OBSERVATION_QUERY

## Source

- API ID 검색 결과: exact match 1건 (view 모드 전체 행 조회, 2026-09-16 23:43 KST)
- Notion database/data source: https://app.notion.com/p/3dd7a4d6147480feb564ce3b172329f5 / `collection://4817a4d6-1474-820e-ace3-072e3d0100a7`
- Resolved page: https://app.notion.com/p/f177a4d61474828cbe7c0178e71ad94c
- Requested page: https://app.notion.com/p/f177a4d61474828cbe7c0178e71ad94c
- Checked at: 2026-09-16T23:45:35+09:00
- Exact match count: 1

## Basic Information

| API ID                     | Name                      | Description                                                     | Method | Full Path                                                      | Content-Type     |
| -------------------------- | ------------------------- | --------------------------------------------------------------- | ------ | -------------------------------------------------------------- | ---------------- |
| `ANIMAL_OBSERVATION_QUERY` | 관찰 및 특이사항 상세조회 | 관찰 및 특이사항의 제목·본문·작성 정보·첨부파일을 조회하는 기능 | GET    | `/animal-manage/{animalManageId}/observations/{observationId}` | application/json |

## Authentication and Authorization

| Required | Type   | Roles       |
| -------- | ------ | ----------- |
| true     | Bearer | USER, ADMIN |

## Request Headers

| Name          | Type   | Required | Nullable | Description                                                   |
| ------------- | ------ | -------- | -------- | ------------------------------------------------------------- |
| Authorization | string | true     | false    | JWT 액세스 토큰. ADMIN·USER 모두 허용. `Bearer {accessToken}` |

## Path Parameters

| Name           | Type           | Required | Nullable | Description                       |
| -------------- | -------------- | -------- | -------- | --------------------------------- |
| animalManageId | integer (LONG) | true     | false    | 관찰 및 특이사항이 속한 개체의 id |
| observationId  | integer (LONG) | true     | false    | 조회할 관찰 및 특이사항의 id      |

## Query Parameters

없음

## Request Body

없음

## Request Example

`GET /animal-manage/12/observations/7`

## Success Responses

- **200** — 관찰 및 특이사항 상세(제목·본문·작성 정보·첨부파일)
  - `animalObservationId`(integer), `title`(string), `content`(string), `createdAt`(string, 예시 `2026-09-16`), `authorName`(string)
  - `files`: array\<object\> — `fileName`(string), `fileKey`(string)

## Error Responses

공통 오류 바디: `message`(string), `status`(integer), `timestamp`(string), `description`(string)

| Status | Message                              | Description                                     |
| ------ | ------------------------------------ | ----------------------------------------------- |
| 401    | 만료된 토큰입니다.                   | 만료되었거나 유효하지 않은 토큰                 |
| 403    | 접근할 수 있는 권한이 없습니다.      | 접근할 수 있는 권한이 없습니다.                 |
| 404    | 존재하지 않는 관찰 및 특이사항입니다. | 개체와 관찰 및 특이사항의 조합이 존재하지 않는 경우 |
| 500    | 내부 서버 오류가 발생했습니다.       | 내부 서버 오류가 발생했습니다.                  |

## Validation and Constraints

- `animalManageId`·`observationId`는 LONG

## Notes

- staging 실측 GET 200 — 명세와 일치(개발자 확인 2026-09-16).
- 개체 삭제·종 삭제 시 관찰이 연쇄 삭제된다(개발자 확인 2026-09-16, 명세에 없음).
- 첨부파일 표시는 파일 서버 base URL + `fileKey` 규약(`FILE_CREATE` 명세 연동).
- 관찰 시각 필드(observedAt 유사)는 명세에 없고 `createdAt`(작성일)만 있다. 작성자는 `authorName`(이름 문자열)만 제공된다.
- 404는 개체 없음/관찰 없음 구분 없이 "조합이 존재하지 않는 경우" 하나다.

## Backend Questions

- `createdAt`이 날짜(YYYY-MM-DD)만인지 시간 포함인지 (예시는 날짜만)
