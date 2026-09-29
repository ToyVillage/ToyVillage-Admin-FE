# API Contract — ANIMAL_MANAGE_QUERY_ALL

## Source

- API ID 검색 결과: exact match 1건 (data source SQL COUNT + view 모드 전체 행
  조회(2026-09-16 23:43 KST) 교차 확인)
- Notion database/data source: https://app.notion.com/p/3dd7a4d6147480feb564ce3b172329f5 / `collection://4817a4d6-1474-820e-ace3-072e3d0100a7`
- Resolved page: https://app.notion.com/p/70c7a4d614748382844b017390e9b69d
- Requested page: https://app.notion.com/p/70c7a4d614748382844b017390e9b69d
- Checked at: 2026-09-16T23:45:00+09:00
- Exact match count: 1

## Basic Information

| API ID                    | Name           | Description                                                  | Method | Full Path                                   | Content-Type     |
| ------------------------- | -------------- | ------------------------------------------------------------ | ------ | ------------------------------------------- | ---------------- |
| `ANIMAL_MANAGE_QUERY_ALL` | 개체 목록 조회 | 선택한 종에 등록된 개체 목록을 개체명 검색어로 조회하는 기능 | GET    | `/animal-manage/kind/{animalKindId}/animal` | application/json |

## Authentication and Authorization

| Required | Type   | Roles       |
| -------- | ------ | ----------- |
| true     | Bearer | USER, ADMIN |

## Request Headers

| Name          | Type   | Required | Nullable | Description                                                    |
| ------------- | ------ | -------- | -------- | -------------------------------------------------------------- |
| Authorization | string | true     | false    | JWT 액세스 토큰. ADMIN·USER 모두 허용. `Bearer {accessToken}` |

## Path Parameters

| Name         | Type           | Required | Nullable | Description    |
| ------------ | -------------- | -------- | -------- | -------------- |
| animalKindId | integer (LONG) | true     | false    | 조회할 종의 id |

## Query Parameters

| Name    | Type    | Required | Nullable | Default   | Description                                                            |
| ------- | ------- | -------- | -------- | --------- | ---------------------------------------------------------------------- |
| keyword | string  | false    | false    | 없음      | 개체명 부분 일치 검색어. 미전송·빈 문자열이면 해당 종의 전체 개체 조회 |
| page    | integer | false    | false    | 0         | 페이지 번호. 명세 기준 0부터 시작                                      |
| size    | integer | false    | false    | 10        | 한 페이지 데이터 개수                                                  |
| sort    | string  | false    | false    | `id,desc` | 정렬 기준. 기본 최신 등록 순                                           |

## Request Body

없음

## Request Example

`GET /animal-manage/kind/1/animal?keyword=무궁&page=0&size=10`

## Success Responses

- **200** — Spring Pageable 형식의 개체 목록
  - `content`: array\<object\> — `animalManageId`(integer), `animalName`(string), `animalGender`(enum: MAN·WOMAN·UNKNOWN), `birthYear`(integer)
  - `pageable`: object — `pageNumber`, `pageSize`, `offset`(integer), `paged`, `unpaged`(boolean)
  - `totalPages`, `totalElements`, `size`, `number`, `numberOfElements`: integer
  - `first`, `last`, `empty`: boolean

## Error Responses

공통 오류 바디: `message`(string), `status`(integer), `timestamp`(string), `description`(string)

| Status | Message                          | Description           |
| ------ | -------------------------------- | --------------------- |
| 401    | 만료된 토큰입니다.               | 만료된 토큰입니다.    |
| 403    | 접근할 수 있는 권한이 없습니다.  | 접근 권한 없음        |
| 404    | 존재하지 않는 종입니다.          | ANIMAL_KIND_NOT_FOUND |
| 500    | 내부 서버 오류가 발생했습니다.   | 내부 서버 오류        |

## Validation and Constraints

- `page`, `size`는 INT, `animalKindId`는 LONG
- `keyword` 미전송·빈 문자열 시 전체 조회

## Notes

- `page` 시작값: Notion 명세는 "0부터 시작, 기본값 0"이나 개발자 확인(2026-09-16)으로는 실제 1부터 시작(업무 API 0-base와 다름). Contract는 명세대로 0-base로 기록 — 명세·서버 정합 확인 필요.
- `keyword` 파라미터는 백엔드 추가 예정으로 Swagger 미반영(2026-09-16).
- staging 실측 GET 200 — 명세와 일치(개발자 확인 2026-09-16).
- `animalGender` 허용값(MAN, WOMAN, UNKNOWN)은 이 페이지에 선언이 없어 `ANIMAL_MANAGE_CREATE` 명세의 ENUM 정의를 준용.

## Backend Questions

- `page` 파라미터 실제 시작값(0 vs 1) 확정 및 Notion 명세 수정 여부
- 목록 응답 `animalGender`의 허용값이 CREATE 명세 ENUM과 동일한지 확인
