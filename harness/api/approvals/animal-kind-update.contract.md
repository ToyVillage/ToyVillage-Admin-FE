# API Contract — ANIMAL_KIND_UPDATE

## Source

- API ID 검색 결과: `ANIMAL_KIND_UPDATE` exact match 1건 (data source SQL
  COUNT + view 모드 전체 행 조회(2026-09-16 23:43 KST) 교차 확인)
- Notion database/data source: https://app.notion.com/p/3dd7a4d6147480feb564ce3b172329f5 / `collection://4817a4d6-1474-820e-ace3-072e3d0100a7`
- Resolved page: https://app.notion.com/p/d307a4d61474834e994c01cd7f33fa02
- Requested page: https://app.notion.com/d307a4d61474834e994c01cd7f33fa02 (같은 페이지)
- Checked at: 2026-09-16T23:45:00+09:00
- Exact match count: 1

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| ------ | ---- | ----------- | ------ | --------- | ------------ |
| `ANIMAL_KIND_UPDATE` | 종 수정 기능 | 관리자가 동물 종 정보를 수정하는 기능 | `PATCH` | `/animal-manage/kind/{animalKindId}` | `application/json` |

## Authentication and Authorization

| Required | Type | Roles |
| -------- | ---- | ----- |
| true | Bearer | `ADMIN` |

## Request Headers

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `Authorization` | string | true | false | `"Bearer <access-token>"` | JWT 액세스 토큰. ADMIN 토큰만 허용 |

## Path Parameters

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `animalKindId` | integer (LONG) | true | false | `1` | 수정할 종의 id |

## Query Parameters

없음

## Request Body

생성(`ANIMAL_KIND_CREATE`)과 동일한 형식이며, **부분 수정이 아니므로 필수
항목을 다시 보내야 한다.** `animalDetailKind`와 `animalLegalDesignation`은
선택값이다.

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `animalName` | string | true | false | `"카피바라"` | 국명 |
| `animalEngName` | string | true | false | `"Capybara"` | 영문명 |
| `animalScientificName` | string | true | false | `"Hydrochoerus hydrochaeris"` | 학명 |
| `animalTaxonomic` | enum | true | false | `"MAMMALS"` | 분류군 — 허용값 `MAMMALS`, `REPTILES`, `FISH`, `BIRDS` |
| `animalDetailKind` | string | false | true | `"설치목 · 천축서과"` | 세부 분류. 미선택 시 `null`·빈 문자열 허용 |
| `fileKey` | string | true | false | `"animal/capybara.png"` | 종 대표 사진. `POST /file` 업로드 후 돌려받은 key |
| `animalLegalDesignation` | array\<integer\> (LONG[]) | false | true | `[1, 3]` | 법정지정분류 id 목록. **통째로 교체됨** — `null`·빈 배열이면 기존 지정 모두 제거 |

## Request Example

```json
{
  "animalName": "카피바라",
  "animalEngName": "Capybara",
  "animalScientificName": "Hydrochoerus hydrochaeris",
  "animalTaxonomic": "MAMMALS",
  "animalDetailKind": "설치목 · 천축서과",
  "fileKey": "animal/capybara.png",
  "animalLegalDesignation": [1, 3]
}
```

## Success Responses

### `200`

종 수정 성공

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `message` | string | true | false | `"종 수정 성공"` | 성공 메시지 |

## Error Responses

| Status | Message | Body |
| ------ | ------- | ---- |
| `400` | 요청이 유효하지 않습니다. (필수 항목 누락) | `{ message, status, timestamp, description }` |
| `401` | 만료된 토큰입니다. | `{ message, status, timestamp, description }` |
| `403` | 접근할 수 있는 권한이 없습니다. (직원 USER 토큰으로 호출) | `{ message, status, timestamp, description }` |
| `404` | 존재하지 않는 종입니다. (`ANIMAL_KIND_NOT_FOUND`) | `{ message, status, timestamp, description }` |
| `404` | 파일을 찾을 수 없습니다. (존재하지 않는 fileKey) | `{ message, status, timestamp, description }` |
| `404` | 존재하지 않는 법정지정분류입니다. (존재하지 않는 `animalLegalStatusId`) | `{ message, status, timestamp, description }` |
| `500` | 내부 서버 오류가 발생했습니다. | `{ message, status, timestamp, description }` |

## Validation and Constraints

- 필수 항목(5개 필드)은 전체 재전송한다. `animalDetailKind`·
  `animalLegalDesignation`은 optional이다. 명세에 문자열 길이 제한은 없다.
- optional 두 필드는 명세가 `null`·빈 값 허용을 명시해 nullable로 두었고,
  나머지는 required 특성과 예시 관측에 근거해 non-nullable로 두었다.

## Notes

- 법정지정분류는 **통째로 교체**된다. `null` 또는 빈 배열을 보내면 기존
  지정이 모두 제거된다(화면 결정: 법정지정분류 ✕ = 서버 삭제와 일관).
- 이 종에 속한 개체들은 수정 후에도 그대로 유지된다.
- Method는 PATCH지만 부분 수정이 아니라 필수 항목 전체 재전송 방식이다(명세
  명시).
- 404가 3종(종 없음 / fileKey 없음 / 법정지정분류 없음)으로, `message`·
  `description` 값으로 구분한다.
- 새 DB 사본(2026-09-16 23:45 재조회)에서 `animalDetailKind`·
  `animalLegalDesignation`이 선택값으로 명시되었고, 404 법정지정분류가
  추가되었다.

## Backend Questions

1. 문자열 필드의 최대 길이 제한을 명세에 표기해 달라.
2. PATCH인데 전체 재전송 방식이다. PUT 의미론과의 차이(누락 필드 처리)가
   실제 서버에서 어떻게 동작하는지 확인해 달라 — 명세상 누락 시 400이다.
