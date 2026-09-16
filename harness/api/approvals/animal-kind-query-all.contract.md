# API Contract — ANIMAL_KIND_QUERY_ALL

## Source

- API ID 검색 결과: `ANIMAL_KIND_QUERY_ALL` exact match 1건 (data source SQL
  COUNT + view 모드 전체 행 조회(2026-09-16 23:43 KST) 교차 확인)
- Notion database/data source: https://app.notion.com/p/3dd7a4d6147480feb564ce3b172329f5 / `collection://4817a4d6-1474-820e-ace3-072e3d0100a7`
- Resolved page: https://app.notion.com/p/3d17a4d6147482a3ad6781fe3bcb67cb
- Requested page: https://app.notion.com/3d17a4d6147482a3ad6781fe3bcb67cb (같은 페이지)
- Checked at: 2026-09-16T23:45:00+09:00
- Exact match count: 1

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| ------ | ---- | ----------- | ------ | --------- | ------------ |
| `ANIMAL_KIND_QUERY_ALL` | 종 목록 조회 | 등록된 동물 종 목록을 분류군과 국명·소속 개체명 검색어로 조회하는 기능 | `GET` | `/animal-manage/kind` | `application/json` |

## Authentication and Authorization

| Required | Type | Roles |
| -------- | ---- | ----- |
| true | Bearer | `USER`, `ADMIN` |

## Request Headers

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `Authorization` | string | true | false | `"Bearer <access-token>"` | JWT 액세스 토큰. ADMIN·USER 토큰 모두 허용 |

## Path Parameters

없음

## Query Parameters

| Field | Type | Required | Nullable | Default | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ------- | ----------- |
| `animalTaxonomic` | enum | false | false | — | `"MAMMALS"` | 분류군 탭 — 허용값 `MAMMALS`, `REPTILES`, `FISH`, `BIRDS`. 미전송 시 전체 조회 |
| `keyword` | string | false | false | — | `"무궁"` | 국명 또는 소속 개체명 부분 일치 검색. 미전송·빈 문자열이면 미적용 |
| `page` | integer | false | false | `0` | `0` | 페이지 번호. 명세 기준 0부터 시작 (Notes 참고) |
| `size` | integer | false | false | `10` | `10` | 한 페이지 데이터 개수 |
| `sort` | string | false | false | `"id,desc"` | `"id,desc"` | 정렬 기준. 기본 최신 등록 순 |

## Request Body

없음

## Request Example

`GET /animal-manage/kind?animalTaxonomic=MAMMALS&keyword=무궁&page=0&size=10`

## Success Responses

### `200`

종 목록 응답. `animalCount`는 해당 종에 등록된 개체 수(마리수)이다.

| Field | Type | Required | Nullable | Example | Description |
| ----- | ---- | -------- | -------- | ------- | ----------- |
| `animalKinds` | array\<object\> | true | false | — | 종 목록 |
| `animalKinds[].animalKindId` | integer | true | false | `1` | 종 id |
| `animalKinds[].animalTaxonomic` | enum | true | false | `"MAMMALS"` | 분류군 — 허용값 `MAMMALS`, `REPTILES`, `FISH`, `BIRDS` |
| `animalKinds[].kindName` | string | true | false | `"카피바라"` | 국명 |
| `animalKinds[].scientificName` | string | true | false | `"Hydrochoerus hydrochaeris"` | 학명 |
| `animalKinds[].animalCount` | integer | true | false | `4` | 개체 수(마리수) |
| `animalKinds[].kindImage` | object | true | false | — | 종 대표 사진 |
| `animalKinds[].kindImage.fileName` | string | true | false | `"capybara.png"` | 원본 파일명 |
| `animalKinds[].kindImage.fileKey` | string | true | false | `"animal/capybara.png"` | 저장소 파일 키 |
| `totalPageSize` | integer | true | false | `1` | 전체 페이지 수 — 명세에 필드 설명 없음(이름·예시 관측, Notes 참고) |

## Error Responses

| Status | Message | Body |
| ------ | ------- | ---- |
| `400` | 요청이 유효하지 않습니다. (animalTaxonomic에 정의되지 않은 값) | `{ message, status, timestamp, description }` |
| `401` | 만료된 토큰입니다. | `{ message, status, timestamp, description }` |
| `403` | 접근할 수 있는 권한이 없습니다. | `{ message, status, timestamp, description }` |
| `500` | 내부 서버 오류가 발생했습니다. | `{ message, status, timestamp, description }` |

## Validation and Constraints

명세에 응답 필드별 Required·Nullable 표기가 없다. 200 예시 관측에 근거해 모두
non-nullable로 두었다. Query parameter의 optional 표기는 명세 그대로 반영했다.

## Notes

- `keyword`는 백엔드가 추가 예정인 검색 파라미터로 **Swagger 미반영(2026-09-16)**
  상태다. 명세에 있으므로 Contract에 포함했다.
- `page`는 명세에 "0부터 시작, 기본값 0"으로 적혀 있으나 개발자 확인(2026-09-16)
  으로는 목록 조회 `page`가 1부터 시작한다. Contract는 명세 값을 기록했고
  Backend Questions로 남겼다.
- GET 성공 200은 staging 실측(2026-09-16 개발자 확인: GET 200)과 일치한다.
- 404는 이 명세에 없다. staging은 미배포 경로에 404가 아니라 500을 반환한다는
  기존 관찰이 있어, 오류 목록은 명세 그대로 400/401/403/500만 기록했다.
- 새 DB 사본(2026-09-16 23:45 재조회)에서 200 응답이 Spring Page 구조에서
  `{ animalKinds, totalPageSize }` 구조로 변경되었다. Query parameter와 오류
  응답은 구 사본과 같다.

## Backend Questions

1. `page` 시작값이 명세(0부터, 기본값 0)와 개발자 확인(1부터 시작)이 다르다.
   실제 서버 기준을 확정하고 명세를 맞춰 달라.
2. `keyword`가 Swagger에 아직 없다(2026-09-16). 배포 시점과 최종 파라미터명을
   확인해 달라.
3. 200 응답의 `totalPageSize` 의미(전체 페이지 수인지 전체 데이터 수인지)를
   명세에 설명해 달라. 구조가 Spring Page에서 바뀌면서 `totalElements`에
   해당하는 값이 사라졌다.
