# API Contract — ANIMAL_MANAGE_CREATE

## Source

- API ID 검색 결과: exact match 1건 (data source SQL COUNT + view 모드 전체 행
  조회(2026-09-16 23:43 KST) 교차 확인)
- Notion database/data source: https://app.notion.com/p/3dd7a4d6147480feb564ce3b172329f5 / `collection://4817a4d6-1474-820e-ace3-072e3d0100a7`
- Resolved page: https://app.notion.com/p/5b77a4d6147483ae8ef081680ceade71
- Requested page: https://app.notion.com/p/5b77a4d6147483ae8ef081680ceade71
- Checked at: 2026-09-16T23:45:00+09:00
- Exact match count: 1

## Basic Information

| API ID                 | Name           | Description                      | Method | Full Path        | Content-Type     |
| ---------------------- | -------------- | -------------------------------- | ------ | ---------------- | ---------------- |
| `ANIMAL_MANAGE_CREATE` | 개체 생성 기능 | 새로운 동물 개체를 등록하는 기능 | POST   | `/animal-manage` | application/json |

## Authentication and Authorization

| Required | Type   | Roles |
| -------- | ------ | ----- |
| true     | Bearer | ADMIN |

## Request Headers

| Name          | Type   | Required | Nullable | Description                                              |
| ------------- | ------ | -------- | -------- | -------------------------------------------------------- |
| Authorization | string | true     | false    | JWT 액세스 토큰. ADMIN만 허용. `Bearer {accessToken}` |

## Path Parameters

없음

## Query Parameters

없음

## Request Body

required: true

| Name         | Type           | Required | Nullable | Description                                        | Constraints |
| ------------ | -------------- | -------- | -------- | -------------------------------------------------- | ----------- |
| animalKindId | integer (LONG) | true     | false    | 등록할 개체의 종 ID                                | LONG        |
| animalName   | string         | true     | false    | 개체명                                             |             |
| animalGender | enum           | true     | false    | MAN(수컷), WOMAN(암컷), UNKNOWN(미상)              |             |
| birthYear    | integer (INT)  | true     | false    | 출생 연도                                          | INT         |
| otherInfo    | string         | false    | false    | 기타 정보                                          | 최대 255자  |
| fileKey      | string         | true     | false    | 개체 사진. POST /file 업로드 후 돌려받은 key       |             |

## Request Example

```json
{
  "animalKindId": 1,
  "animalName": "무궁이",
  "animalGender": "WOMAN",
  "birthYear": 2021,
  "otherInfo": "온순한 성격",
  "fileKey": "animal/mugung.png"
}
```

## Success Responses

- **201** — `{ "message": "개체 생성 성공" }` (`message`: string)

## Error Responses

공통 오류 바디: `message`(string), `status`(integer), `timestamp`(string), `description`(string)

| Status | Message                         | Description                                                               |
| ------ | ------------------------------- | ------------------------------------------------------------------------- |
| 400    | 요청이 유효하지 않습니다.       | 종/개체명/성별/출생연도/사진 누락, otherInfo 255자 초과 등 검증 실패 사유 |
| 401    | 만료된 토큰입니다.              | 만료되었거나 유효하지 않은 토큰                                            |
| 403    | 접근할 수 있는 권한이 없습니다. | ADMIN 권한이 없는 경우                                                     |
| 404    | 존재하지 않는 종입니다.         | animalKindId 또는 fileKey에 해당하는 데이터가 없는 경우                    |
| 500    | 내부 서버 오류가 발생했습니다.  | 내부 서버 오류                                                             |

## Validation and Constraints

- 400 검증 메시지(명세 원문): 종을 선택해주세요. / 개제명을 입력해주세요. / 성별을 선택해주세요. / 출생년도를 입력해주세요. / 기타정보는 255자 이하여야 합니다. / 동물 사진을 포함해주세요.
- `otherInfo` 최대 255자

## Notes

- Notion 명세 성공 status 201 = staging 실측 201 (개발자 확인 2026-09-16) — 일치.
- `fileKey`는 `FILE_CREATE` 명세의 POST /file 업로드·파일 조회 base URL 방식과 연동. 이 contract에는 명세에 적힌 `fileKey` 필드만 기록.

## Backend Questions

- `otherInfo` nullable 여부(미기재, optional만 명시)
