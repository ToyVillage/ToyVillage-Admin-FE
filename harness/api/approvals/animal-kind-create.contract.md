# API Contract — ANIMAL_KIND_CREATE

## Source

- API ID 검색 결과: `ANIMAL_KIND_CREATE` exact match 1건 (data source SQL
  COUNT + view 모드 전체 행 조회(2026-09-16 23:43 KST) 교차 확인)
- Notion database/data source: https://app.notion.com/p/3dd7a4d6147480feb564ce3b172329f5 / `collection://4817a4d6-1474-820e-ace3-072e3d0100a7`
- Resolved page: https://app.notion.com/p/04d7a4d61474821284e2818f5792f501
- Requested page: https://app.notion.com/04d7a4d61474821284e2818f5792f501 (같은 페이지)
- Checked at: 2026-09-16T23:45:00+09:00
- Exact match count: 1

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| ------ | ---- | ----------- | ------ | --------- | ------------ |
| `ANIMAL_KIND_CREATE` | 종 생성 기능 | 관리자가 동물 종을 등록하는 기능 | `POST` | `/animal-manage/kind` | `application/json` |

## Authentication and Authorization

| Required | Type | Roles |
| -------- | ---- | ----- |
| true | Bearer | `ADMIN` |

## Request Headers

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `Authorization` | string | true | false | `"Bearer <access-token>"` | JWT 액세스 토큰. ADMIN 토큰만 허용 |

## Path Parameters

없음

## Query Parameters

없음

## Request Body

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `animalName` | string | true | false | `"카피바라"` | 국명 |
| `animalEngName` | string | true | false | `"Capybara"` | 영문명 |
| `animalScientificName` | string | true | false | `"Hydrochoerus hydrochaeris"` | 학명 |
| `animalTaxonomic` | enum | true | false | `"MAMMALS"` | 분류군 — 허용값 `MAMMALS`, `REPTILES`, `FISH`, `BIRDS` |
| `animalDetailKind` | string | false | true | `"설치목 · 천축서과"` | 세부 분류. 미선택 시 `null`·빈 문자열 허용 |
| `fileKey` | string | true | false | `"animal/capybara.png"` | 종 대표 사진. `POST /file` 업로드 후 돌려받은 key |
| `animalLegalDesignation` | array\<integer\> (LONG[]) | false | true | `[1, 3]` | 법정지정분류 id 목록. `GET /animal-manage/legal-status`의 `animalLegalStatusId`. 미선택 시 `null`·빈 배열 허용 |

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

### `201`

종 생성 성공

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `message` | string | true | false | `"종 생성 성공"` | 성공 메시지 |

## Error Responses

| Status | Message | Body |
| ------ | ------- | ---- |
| `400` | 요청이 유효하지 않습니다. (필수 항목 누락) | `{ message, status, timestamp, description }` |
| `401` | 만료된 토큰입니다. | `{ message, status, timestamp, description }` |
| `403` | 접근할 수 있는 권한이 없습니다. (직원 USER 토큰으로 호출) | `{ message, status, timestamp, description }` |
| `404` | 파일을 찾을 수 없습니다. (존재하지 않는 fileKey) | `{ message, status, timestamp, description }` |
| `404` | 존재하지 않는 법정지정분류입니다. (존재하지 않는 `animalLegalStatusId`) | `{ message, status, timestamp, description }` |
| `500` | 내부 서버 오류가 발생했습니다. | `{ message, status, timestamp, description }` |

## Validation and Constraints

- Body 필드는 5개 required, `animalDetailKind`·`animalLegalDesignation`은
  optional이다. 명세에 문자열 길이 제한은 없다.
- optional 두 필드는 명세가 `null`·빈 값 허용을 명시해 nullable로 두었고,
  나머지는 required 특성과 예시 관측에 근거해 non-nullable로 두었다.

## Notes

- 성공 status는 명세·staging 실측 모두 `201`이다(2026-09-16 개발자 확인:
  POST 201). Swagger가 전부 200으로 표기된 것과 다르며 명세가 실측과 맞다.
- `fileKey`는 `POST /file`(FILE_CREATE) 선행 업로드가 전제다.
- `animalLegalDesignation`은 `GET /animal-manage/legal-status` 응답의
  `animalLegalStatusId`에 의존한다.
- 새 DB 사본(2026-09-16 23:45 재조회)에서 `animalDetailKind`·
  `animalLegalDesignation`이 required → optional(`null`·빈 값 허용)로 바뀌었고,
  404에 "존재하지 않는 법정지정분류입니다."가 추가되었다.

## Backend Questions

1. 문자열 필드(`animalName` 등)의 최대 길이 제한을 명세에 표기해 달라
   (화면 결정은 maxLength만 적용하기로 되어 있어 서버 제한 값이 필요하다).
