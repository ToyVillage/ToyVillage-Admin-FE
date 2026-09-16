# API Contract — ANIMAL_MANAGE_UPDATE

## Source

- API ID 검색 결과: exact match 1건 (data source SQL COUNT + view 모드 전체 행
  조회(2026-09-16 23:43 KST) 교차 확인)
- Notion database/data source: https://app.notion.com/p/3dd7a4d6147480feb564ce3b172329f5 / `collection://4817a4d6-1474-820e-ace3-072e3d0100a7`
- Resolved page: https://app.notion.com/p/ad57a4d61474831c88b5819d6f63710e
- Requested page: https://app.notion.com/p/ad57a4d61474831c88b5819d6f63710e
- Checked at: 2026-09-16T23:45:00+09:00
- Exact match count: 1

## Basic Information

| API ID                 | Name           | Description                              | Method | Full Path                         | Content-Type     |
| ---------------------- | -------------- | ---------------------------------------- | ------ | --------------------------------- | ---------------- |
| `ANIMAL_MANAGE_UPDATE` | 개체 수정 기능 | 개체 ID로 동물 개체 정보를 수정하는 기능 | PATCH  | `/animal-manage/{animalManageId}` | application/json |

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
| animalManageId | integer (LONG) | true     | false    | 수정할 개체의 id |

## Query Parameters

없음

## Request Body

required: true — 생성과 동일한 형식. **부분 수정이 아니므로 모든 필수 항목을 다시 보내야 함.**

| Name         | Type           | Required | Nullable | Description                                  | Constraints |
| ------------ | -------------- | -------- | -------- | -------------------------------------------- | ----------- |
| animalKindId | integer (LONG) | true     | false    | 변경할 종의 id                               | LONG        |
| animalName   | string         | true     | false    | 개체명                                       |             |
| animalGender | enum           | true     | false    | MAN(수컷) · WOMAN(암컷) · UNKNOWN(미상)      |             |
| birthYear    | integer (INT)  | true     | false    | 출생 연도                                    | INT         |
| otherInfo    | string         | false    | false    | 기타 정보                                    | 최대 255자  |
| fileKey      | string         | true     | false    | 개체 사진. POST /file 업로드 후 돌려받은 key |             |

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

- **200** — `{ "message": "개체 수정 성공" }` (`message`: string)

## Error Responses

공통 오류 바디: `message`(string), `status`(integer), `timestamp`(string), `description`(string)

| Status | Message                         | Description                                    |
| ------ | ------------------------------- | ---------------------------------------------- |
| 400    | 요청이 유효하지 않습니다.       | 필수 항목 누락 또는 otherInfo 255자 초과       |
| 401    | 만료된 토큰입니다.              | 만료된 토큰입니다.                             |
| 403    | 접근할 수 있는 권한이 없습니다. | 직원(USER) 토큰으로 호출한 경우                |
| 404    | (3종)                           | 개체(ANIMAL_MANAGE_NOT_FOUND) · 종(ANIMAL_KIND_NOT_FOUND) · 파일(fileKey) 없음 |
| 500    | 내부 서버 오류가 발생했습니다.  | 내부 서버 오류                                 |

404 메시지 3종(명세 원문): 존재하지 않는 개체입니다. / 존재하지 않는 종입니다. / 파일을 찾을 수 없습니다.

## Validation and Constraints

- `otherInfo` 최대 255자
- PATCH이지만 부분 수정 아님 — 전체 필수 항목 재전송

## Notes

- 개발자 실측 확인은 GET 200·POST 201만 있고 PATCH는 미확인 — 명세대로 200 기록.
- `fileKey`는 `FILE_CREATE` 명세의 POST /file 업로드·파일 조회 base URL 방식과 연동.
- contract.json의 404는 대표 1건으로 기록(3종 메시지는 본 문서와 notion-source에 보존).

## Backend Questions

- `otherInfo` nullable 여부(미기재, optional만 명시)
- PATCH 성공 실측 status(200) 확인
