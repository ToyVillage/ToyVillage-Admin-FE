# API Contract — APP_ALL_ACTIVITIES_ANIMAL_OBSERVATION_QUERY_ALL

## Source

- Notion 검색(`전체 활동`·`ALL_ACTIVITIES`) 0건 → 개발자가 준 staging Swagger만 기준(개발자 지시 2026-10-29). API ID는 제안값.
- Swagger: `https://api-stag.toyvillage.kr/v3/api-docs`(App) `GET /all-activities/animal-observation`, operationId `getAnimalObservations_1`, tag `all-activities-controller`
- 원본: `app-all-activities-animal-observation-query-all.swagger-source.json` (checkedAt 2026-10-29)
- `source.apiIdMatchCount: 0` + `source.swagger`

## Basic Information

| API ID | Name | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- |
| APP_ALL_ACTIVITIES_ANIMAL_OBSERVATION_QUERY_ALL | 전체 활동 날짜별 관찰일지 조회 | GET | /all-activities/animal-observation | application/json |

## Authentication and Authorization

| Required | Type | Roles |
| --- | --- | --- |
| true | Bearer | ADMIN |

- 역할은 Swagger에 없어 다른 관리자 조회와 맞췄다.

## Request Headers

| Name | Required | Example |
| --- | --- | --- |
| Authorization | true | `Bearer <access-token>` |

## Path Parameters

없음

## Query Parameters

| Name | Type | Required | Example | Description |
| --- | --- | --- | --- | --- |
| date | string(date) | true | 2026-10-20 | 조회 날짜 |

## Request Body

없음

## Request Example

`GET /all-activities/animal-observation?date=2026-10-20`

## Success Responses

`200` — 배열

| Name | Type | Required | Nullable | Example | Description |
| --- | --- | --- | --- | --- | --- |
| [].animalObservationId | integer(int64) | true | false | 1 | 행 key |
| [].animalManageId | integer(int64) | true | false | 1 | 쓰지 않음 |
| [].animalKind | string | true | false | 이구아나 | 일반명 |
| [].animalName | string | true | false | 초록 | 개체명 |
| [].animalDeleted | boolean | true | false | false | 구분 없이 표시 |
| [].createdAt | string(date-time) | true | false | 2026-10-20T09:10:00 | 작성시간 `HH:mm` |
| [].title | string | true | false | 탈피 진행 상황 | 제목 |
| [].authorName | string | true | false | 이승현 | 관찰자 |
| [].fileCount | integer(int64) | true | false | 1 | 첨부 수 |

## Error Responses

| Status | Description |
| --- | --- |
| 403 | 토큰 없음/만료/권한 없음(공통 인터셉터) |
| 405 | 지원하지 않는 메서드 형식입니다. |
| 500 | 내부 서버 오류가 발생했습니다. |

## Validation and Constraints

- `date`는 `YYYY-MM-DD`. 아니면 요청하지 않고 실패로 본다.

## Notes

- Swagger와 차이 없음. 페이지 파라미터 없이 배열 전체가 온다.

## Backend Questions

1. Notion 명세 DB에 이 API를 추가해 달라(제안 ID `APP_ALL_ACTIVITIES_ANIMAL_OBSERVATION_QUERY_ALL`).
2. 접근 역할, 필드 nullable, 정렬 기준 명시 요청.
