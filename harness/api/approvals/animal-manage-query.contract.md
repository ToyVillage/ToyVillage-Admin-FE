# API Contract — ANIMAL_MANAGE_QUERY

## Source

- API ID 검색 결과: exact match 1건 (data source SQL COUNT + view 모드 전체 행
  조회(2026-09-16 23:43 KST) 교차 확인)
- Notion database/data source: https://app.notion.com/p/3dd7a4d6147480feb564ce3b172329f5 / `collection://4817a4d6-1474-820e-ace3-072e3d0100a7`
- Resolved page: https://app.notion.com/p/43c7a4d6147482188dee018e670d2f8f
- Requested page: https://app.notion.com/p/43c7a4d6147482188dee018e670d2f8f
- Checked at: 2026-09-16T23:45:00+09:00
- Exact match count: 1

## Basic Information

| API ID                | Name          | Description                                     | Method | Full Path                         | Content-Type     |
| --------------------- | ------------- | ----------------------------------------------- | ------ | --------------------------------- | ---------------- |
| `ANIMAL_MANAGE_QUERY` | 개체 상세조회 | 개체 ID로 동물 개체의 상세 정보를 조회하는 기능 | GET    | `/animal-manage/{animalManageId}` | application/json |

## Authentication and Authorization

| Required | Type   | Roles       |
| -------- | ------ | ----------- |
| true     | Bearer | USER, ADMIN |

## Request Headers

| Name          | Type   | Required | Nullable | Description                                                    |
| ------------- | ------ | -------- | -------- | -------------------------------------------------------------- |
| Authorization | string | true     | false    | JWT 액세스 토큰. ADMIN·USER 모두 허용. `Bearer {accessToken}` |

## Path Parameters

| Name           | Type           | Required | Nullable | Description     |
| -------------- | -------------- | -------- | -------- | --------------- |
| animalManageId | integer (LONG) | true     | false    | 조회할 개체의 id |

## Query Parameters

없음

## Request Body

없음

## Request Example

`GET /animal-manage/12`

## Success Responses

- **200** — 개체 기본 정보 + 해당 종 정보 + 법정지정분류 이름 목록
  - `animalManageId`(integer), `animalName`(string), `animalGender`(enum: MAN·WOMAN·UNKNOWN), `birthYear`(integer), `otherInfo`(string)
  - `animalImage`: object — `fileName`(string), `fileKey`(string)
  - `animalKindId`(integer), `kindName`(string), `scientificName`(string), `animalTaxonomic`(string, 예시 MAMMALS), `detailKind`(string)
  - `legalStatuses`: array\<string\> — 법정지정분류 이름 목록

## Error Responses

공통 오류 바디: `message`(string), `status`(integer), `timestamp`(string), `description`(string)

| Status | Message                         | Description             |
| ------ | ------------------------------- | ----------------------- |
| 401    | 만료된 토큰입니다.              | 만료된 토큰입니다.      |
| 403    | 접근할 수 있는 권한이 없습니다. | 접근 권한 없음          |
| 404    | 존재하지 않는 개체입니다.       | ANIMAL_MANAGE_NOT_FOUND |
| 500    | 내부 서버 오류가 발생했습니다.  | 내부 서버 오류          |

## Validation and Constraints

- `animalManageId`는 LONG

## Notes

- staging 실측 GET 200 — 명세와 일치(개발자 확인 2026-09-16).
- `animalImage.fileKey`는 `FILE_CREATE` 명세의 파일 조회 base URL 방식과 연동.
- `animalGender` 허용값은 `ANIMAL_MANAGE_CREATE` 명세의 ENUM(MAN, WOMAN, UNKNOWN) 정의를 준용.
- `animalTaxonomic`은 예시(`MAMMALS`)만 있고 허용값 선언이 없어 string으로 기록.

## Backend Questions

- `otherInfo` 미입력 개체의 응답 값이 null인지 빈 문자열인지 (생성 시 optional)
- `animalTaxonomic` 허용값 목록(enum 여부) 확인
