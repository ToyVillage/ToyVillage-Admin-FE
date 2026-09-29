# API Contract — ANIMAL_OBSERVATION_UPDATE

## Source

- API ID 검색 결과: exact match 1건 (view 모드 전체 행 조회, 2026-09-16 23:43 KST)
- Notion database/data source: https://app.notion.com/p/3dd7a4d6147480feb564ce3b172329f5 / `collection://4817a4d6-1474-820e-ace3-072e3d0100a7`
- Resolved page: https://app.notion.com/p/1c47a4d6147482448fa501311aa58cc0
- Requested page: https://app.notion.com/p/1c47a4d6147482448fa501311aa58cc0
- Checked at: 2026-09-16T23:45:35+09:00
- Exact match count: 1

## Basic Information

| API ID                      | Name                       | Description                                          | Method | Full Path                                                      | Content-Type     |
| --------------------------- | -------------------------- | ---------------------------------------------------- | ------ | -------------------------------------------------------------- | ---------------- |
| `ANIMAL_OBSERVATION_UPDATE` | 관찰 및 특이사항 수정 기능 | 관리자가 관찰 및 특이사항과 첨부파일을 수정하는 기능 | PATCH  | `/animal-manage/{animalManageId}/observations/{observationId}` | application/json |

## Authentication and Authorization

| Required | Type   | Roles |
| -------- | ------ | ----- |
| true     | Bearer | ADMIN |

## Request Headers

| Name          | Type   | Required | Nullable | Description                                                 |
| ------------- | ------ | -------- | -------- | ----------------------------------------------------------- |
| Authorization | string | true     | false    | JWT 액세스 토큰. ADMIN만 허용. `Bearer {accessToken}`       |

## Path Parameters

| Name           | Type           | Required | Nullable | Description                       |
| -------------- | -------------- | -------- | -------- | --------------------------------- |
| animalManageId | integer (LONG) | true     | false    | 관찰 및 특이사항이 속한 개체의 id |
| observationId  | integer (LONG) | true     | false    | 수정할 관찰 및 특이사항의 id      |

## Query Parameters

없음

## Request Body

| Name     | Type           | Required | Nullable | Description                                                                                           |
| -------- | -------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------- |
| title    | string         | true     | false    | 제목. 최대 100자                                                                                       |
| content  | string         | true     | false    | 본문. 최대 2000자                                                                                      |
| fileKeys | array\<string\> | false    | true     | 첨부파일 key 목록. POST /file(FILE_CREATE)로 업로드한 key. 통째로 교체되며 null·빈 배열이면 전부 제거 |

부분 수정이 아니므로 제목과 본문을 모두 보내야 한다.

## Request Example

```json
{
  "title": "식욕 저하 관찰",
  "content": "오전 급여 시 평소보다 섭취량이 적었습니다.",
  "fileKeys": [
    "animal-observation/photo-1.png",
    "animal-observation/photo-2.png"
  ]
}
```

## Success Responses

- **200** — 관찰 및 특이사항 수정 성공
  - `message`(string) — 예시 `관찰 및 특이사항 수정 성공`

## Error Responses

공통 오류 바디: `message`(string), `status`(integer), `timestamp`(string), `description`(string)

| Status | Message                              | Description                                     |
| ------ | ------------------------------------ | ----------------------------------------------- |
| 400    | 요청이 유효하지 않습니다.            | 제목·본문 누락 또는 허용 길이 초과              |
| 401    | 만료된 토큰입니다.                   | 만료되었거나 유효하지 않은 토큰                 |
| 403    | 접근할 수 있는 권한이 없습니다.      | 직원(USER) 토큰으로 호출한 경우                 |
| 404    | 존재하지 않는 관찰 및 특이사항입니다. | 개체와 관찰 및 특이사항의 조합이 존재하지 않는 경우 |
| 404    | 파일을 찾을 수 없습니다.             | fileKeys 중 존재하지 않는 key가 있는 경우       |
| 500    | 내부 서버 오류가 발생했습니다.       | 내부 서버 오류가 발생했습니다.                  |

## Validation and Constraints

- `title` 최대 100자, `content` 최대 2000자 (초과·누락 시 400)
- `fileKeys`는 null 또는 빈 배열 허용
- `animalManageId`·`observationId`는 LONG

## Notes

- `fileKeys`는 받은 목록으로 통째로 교체된다(백엔드 확인 2026-09-16) — 명세 참고 문구와 일치. 프론트는 남은 첨부 + 새 업로드 key 전체를 보낸다.
- 첨부 업로드는 `FILE_CREATE`(POST /file → fileKey), 표시는 파일 서버 base URL + `fileKey` 규약.
- PATCH이지만 명세가 전체 필드 전송을 요구한다(부분 수정 아님).
- staging 실측은 GET 200·POST 201만 확인됨 — PATCH 실측 status는 미확인(명세는 200).
- 404가 두 종류(관찰 조합 없음 / fileKeys의 파일 없음)로 구분된다.

## Backend Questions

- `fileKeys` 최대 개수·업로드 파일 크기 제한 여부 (명세 미기재)
