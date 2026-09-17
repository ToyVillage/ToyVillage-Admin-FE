# API Contract — ANIMAL_KIND_QUERY

## Source

- API ID 검색 결과: `ANIMAL_KIND_QUERY` exact match 1건 (data source SQL
  COUNT + view 모드 전체 행 조회(2026-09-16 23:43 KST) 교차 확인)
- Notion database/data source: https://app.notion.com/p/3dd7a4d6147480feb564ce3b172329f5 / `collection://4817a4d6-1474-820e-ace3-072e3d0100a7`
- Resolved page: https://app.notion.com/p/bf77a4d6147482b680128107c8e3dfd5
- Requested page: https://app.notion.com/bf77a4d6147482b680128107c8e3dfd5 (같은 페이지)
- Checked at: 2026-09-16T23:45:00+09:00
- Exact match count: 1

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| ------ | ---- | ----------- | ------ | --------- | ------------ |
| `ANIMAL_KIND_QUERY` | 종 상세조회 | 동물 종의 상세 정보를 조회하는 기능 | `GET` | `/animal-manage/kind/{animalKindId}` | `application/json` |

## Authentication and Authorization

| Required | Type | Roles |
| -------- | ---- | ----- |
| true | Bearer | `USER`, `ADMIN` |

## Request Headers

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `Authorization` | string | true | false | `"Bearer <access-token>"` | JWT 액세스 토큰. ADMIN·USER 토큰 모두 허용 |

## Path Parameters

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `animalKindId` | integer (LONG) | true | false | `1` | 조회할 종의 id |

## Query Parameters

없음

## Request Body

없음

## Request Example

`GET /animal-manage/kind/1`

## Success Responses

### `200`

종 상세 화면 상단의 종 정보와 마리수. 개체 목록은 종별 개체 목록 조회 API로
따로 조회한다.

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `animalKindId` | integer | true | false | `1` | 종 id |
| `kindName` | string | true | false | `"카피바라"` | 국명 |
| `engName` | string | true | false | `"Capybara"` | 영문명 |
| `scientificName` | string | true | false | `"Hydrochoerus hydrochaeris"` | 학명 |
| `animalTaxonomic` | enum | true | false | `"MAMMALS"` | 분류군 — 허용값 `MAMMALS`, `REPTILES`, `FISH`, `BIRDS` |
| `detailKind` | string | true | true | `"설치목 · 천축서과"` | 세부 분류. 미등록 시 `null` |
| `legalStatuses` | array\<object\> | true | false | `[{"animalLegalStatusId":1,"kind":"지정관리 야생동물"}]` | 법정지정분류 목록. 지정된 값이 없으면 빈 배열 |
| `legalStatuses[].animalLegalStatusId` | integer | true | true | `1` | 공용 목록에서 이름으로 찾은 id. 공용 목록에서 삭제된 분류는 `null` |
| `legalStatuses[].kind` | string | true | false | `"지정관리 야생동물"` | 법정지정분류 이름 |
| `animalCount` | integer | true | false | `3` | 개체 수(마리수) |
| `kindImage` | object | true | false | — | 종 대표 사진 |
| `kindImage.fileName` | string | true | false | `"capybara.png"` | 원본 파일명 |
| `kindImage.fileKey` | string | true | false | `"animal/capybara.png"` | 저장소 파일 키 |

## Error Responses

| Status | Message | Body |
| ------ | ------- | ---- |
| `401` | 만료된 토큰입니다. | `{ message, status, timestamp, description }` |
| `403` | 접근할 수 있는 권한이 없습니다. | `{ message, status, timestamp, description }` |
| `404` | 존재하지 않는 종입니다. (`ANIMAL_KIND_NOT_FOUND`) | `{ message, status, timestamp, description }` |
| `500` | 내부 서버 오류가 발생했습니다. | `{ message, status, timestamp, description }` |

## Validation and Constraints

`detailKind`는 명세가 "미등록 시 `null`"을 명시해 nullable로 두었고,
`legalStatuses`는 BE PR #162(2026-09-17, 개발자 요청, 머지 전)로 `string[]`에서
`[{ animalLegalStatusId, kind }]`로 바뀐다. 종에는 이름이 저장되고 조회 시 공용 목록과
이름으로 맞춰 id를 붙이므로 삭제된 분류는 id가 `null`이다. 스테이징 Swagger는 아직
`string[]`이다(2026-09-17 확인). `legalStatuses`는 빈 배열 가능이 명시되어 있다. 나머지 응답 필드는 Nullable
표기가 없어 200 예시 관측에 근거해 non-nullable로 두었다. `animalKindId`는
명세의 LONG을 contract 기본 타입 표기 `integer`로 정규화하고 constraints에
`LONG`을 남겼다.

## Notes

- `animalTaxonomic` 허용값은 이 페이지에 나열돼 있지 않으나 같은 DB의
  `ANIMAL_KIND_QUERY_ALL` · `ANIMAL_KIND_CREATE` 명세에 나열된
  `MAMMALS` / `REPTILES` / `FISH` / `BIRDS`로 확정했다.
- GET 성공 200은 staging 실측(2026-09-16 개발자 확인: GET 200)과 일치한다.
- 새 DB 사본(2026-09-16 23:45 재조회)에서 `detailKind` null 가능과
  `legalStatuses` 빈 배열 가능이 명시되었다. 나머지 내용은 구 사본과 같다.

## Backend Questions

1. 응답 필드의 Required·Nullable을 명세에 표기해 달라. `detailKind`(null
   가능)·`legalStatuses`(빈 배열)는 새 명세에 명시되었으나, `kindImage`가
   사진 미등록 시 `null` 가능한지는 여전히 명세에 없다.
