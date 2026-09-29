# API Contract — ANIMAL_OBSERVATION_QUERY_ALL

## Source

- API ID 검색 결과: exact match 1건 (view 모드 전체 행 조회, 2026-09-16 23:43 KST)
- Notion database/data source: https://app.notion.com/p/3dd7a4d6147480feb564ce3b172329f5 / `collection://4817a4d6-1474-820e-ace3-072e3d0100a7`
- Resolved page: https://app.notion.com/p/25c7a4d614748245be8d01f850a24b9f
- Requested page: https://app.notion.com/p/25c7a4d614748245be8d01f850a24b9f
- Checked at: 2026-09-16T23:45:35+09:00
- Exact match count: 1

## Basic Information

| API ID                         | Name                       | Description                                  | Method | Full Path                                      | Content-Type     |
| ------------------------------ | -------------------------- | -------------------------------------------- | ------ | ---------------------------------------------- | ---------------- |
| `ANIMAL_OBSERVATION_QUERY_ALL` | 관찰 및 특이사항 목록 조회 | 개체의 관찰 및 특이사항 목록을 조회하는 기능 | GET    | `/animal-manage/{animalManageId}/observations` | application/json |

## Authentication and Authorization

| Required | Type   | Roles       |
| -------- | ------ | ----------- |
| true     | Bearer | USER, ADMIN |

## Request Headers

| Name          | Type   | Required | Nullable | Description                                                   |
| ------------- | ------ | -------- | -------- | ------------------------------------------------------------- |
| Authorization | string | true     | false    | JWT 액세스 토큰. ADMIN·USER 모두 허용. `Bearer {accessToken}` |

## Path Parameters

| Name           | Type           | Required | Nullable | Description                              |
| -------------- | -------------- | -------- | -------- | ---------------------------------------- |
| animalManageId | integer (LONG) | true     | false    | 관찰 및 특이사항 목록을 조회할 개체의 id |

## Query Parameters

| Name | Type          | Required | Nullable | Default   | Description                          |
| ---- | ------------- | -------- | -------- | --------- | ------------------------------------ |
| page | integer (INT) | false    | false    | 0         | 페이지 번호. 0부터 시작              |
| size | integer (INT) | false    | false    | 10        | 한 페이지에 포함할 데이터 개수       |
| sort | string        | false    | false    | `id,desc` | 정렬 기준. 기본값 최신 등록 순       |

## Request Body

없음

## Request Example

`GET /animal-manage/12/observations?page=0&size=10`

## Success Responses

- **200** — 관찰 및 특이사항 목록 페이지 응답. 목록에는 제목·작성일·작성자·첨부파일 전체가 포함되며 본문은 상세 조회에서 반환.
  - `content`: array\<object\> — `animalObservationId`(integer), `title`(string), `createdAt`(string, 예시 `2026-09-16`), `authorName`(string), `files`: array\<object\> — `fileName`(string), `fileKey`(string)
  - `pageable`: object — `pageNumber`(integer), `pageSize`(integer), `offset`(integer), `paged`(boolean), `unpaged`(boolean)
  - `totalPages`(integer), `totalElements`(integer), `size`(integer), `number`(integer), `first`(boolean), `last`(boolean), `numberOfElements`(integer), `empty`(boolean)

## Error Responses

공통 오류 바디: `message`(string), `status`(integer), `timestamp`(string), `description`(string)

| Status | Message                         | Description                        |
| ------ | ------------------------------- | ---------------------------------- |
| 401    | 만료된 토큰입니다.              | 만료되었거나 유효하지 않은 토큰    |
| 403    | 접근할 수 있는 권한이 없습니다. | 접근할 수 있는 권한이 없습니다.    |
| 404    | 존재하지 않는 개체입니다.       | ANIMAL_MANAGE_NOT_FOUND            |
| 500    | 내부 서버 오류가 발생했습니다.  | 내부 서버 오류가 발생했습니다.     |

## Validation and Constraints

- `animalManageId`는 LONG, `page`·`size`는 INT
- `page`는 명세 기준 0부터 시작 (기본값 0)

## Notes

- staging 실측 GET 200 — 명세와 일치(개발자 확인 2026-09-16).
- 개체 삭제·종 삭제 시 관찰이 연쇄 삭제된다(개발자 확인 2026-09-16, 명세에 없음).
- 첨부파일 표시는 파일 서버 base URL + `fileKey` 규약(`FILE_CREATE` 명세 연동).
- 관찰 시각 필드(observedAt 유사)는 명세에 없고 `createdAt`(작성일)만 있다. 작성자는 `authorName`(이름 문자열)만 제공된다.
- Query parameter의 Nullable은 명세 표기가 없어 기존 contract 관례(false)로 정규화.

## Backend Questions

- `createdAt`이 날짜(YYYY-MM-DD)만인지 시간 포함인지 (예시는 날짜만)
- `sort`가 `id` 외 다른 정렬 키를 지원하는지 (허용 목록 미기재)
