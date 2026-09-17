# API Contract — DASHBOARD_ANIMAL_OBSERVATION_QUERY_ALL

## Source

- Notion 데이터베이스 `API 명세서 토이빌리지` (`https://app.notion.com/p/3de7a4d6147480e18466e66547493b25`, `collection://9717a4d6-1474-822a-8703-074d4cfad636`, 2026-09-17 개발자가 새로 옮긴 DB)
- Resolved page: https://app.notion.com/p/9ea7a4d6147483dcb67a812c7f97b041
- Requested page: 없음
- Checked at: 2026-09-17
- Exact match count: 1 (카테고리 `대시보드` 4건 중 API ID 정확 일치 1건)
- staging Swagger(`/v3/api-docs`, `dash-board-controller`)의 Method·Path·응답 필드와 일치함을 확인했다.

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- | --- |
| DASHBOARD_ANIMAL_OBSERVATION_QUERY_ALL | 대시보드 주간 관찰 및 특이사항 목록 조회 | 이번 주 개체 관찰 및 특이사항을 최신순으로 페이지 조회하는 기능 | GET | /dashboard/animal-observations | application/json |

## Authentication and Authorization

| Required | Type | Roles |
| --- | --- | --- |
| true | Bearer | ADMIN |

- Notion `접근권한` ADMIN, `토큰 여부` 체크. 관리자 액세스 토큰만 허용.

## Request Headers

| Name | Type | Required | Nullable | Default | Example | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `Authorization` | string | true | false | 없음 | `Bearer {accessToken}` | JWT 액세스 토큰. 관리자(ADMIN) 토큰만 허용 — Bearer scheme |

## Path Parameters

없음

## Query Parameters

| Name | Type | Required | Nullable | Default | Example | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `page` | integer | false | false | 1 | `1` | 조회할 페이지 번호. 1부터 시작 |
| `size` | integer | false | false | 10 | `10` | 페이지당 데이터 개수 |
| `sort` | string | false | false | createdAt,desc | `createdAt,desc` | 정렬. 기본 정렬 `createdAt,desc` 이후 `id,desc` |

## Request Body

없음

## Request Example

`GET /dashboard/animal-observations?page=1&size=10`

## Success Responses

### HTTP 200 — 관찰 및 특이사항 페이지 (이번 주 일요일 00:00 이상 ~ 다음 주 일요일 00:00 미만)

| Name | Type | Required | Nullable | Default | Example | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `content` | array<object> | true | false | 없음 | `[{"animalObservationId":12,"animalId":5,"title":"식욕 저하 관찰","createdAt":"2026-09-17T14:20:00"}]` | 관찰 및 특이사항 목록 |
| `content[].animalObservationId` | integer | true | false | 없음 | `12` | 관찰 및 특이사항 ID |
| `content[].animalId` | integer | true | false | 없음 | `5` | 관찰 대상 개체 ID(animalManageId) |
| `content[].title` | string | true | false | 없음 | `식욕 저하 관찰` | 관찰 및 특이사항 제목 |
| `content[].createdAt` | datetime | true | false | 없음 | `2026-09-17T14:20:00` | 작성 일시 |
| `pageable` | object | true | false | 없음 | `{"pageNumber":0,"pageSize":10,"sort":{"empty":false,"sorted":true,"unsorted":false},"offset":0,"paged":true,"unpaged":false}` | 페이지 정보. `pageNumber`는 0부터 |
| `last` | boolean | true | false | 없음 | `true` | 마지막 페이지 여부 |
| `totalPages` | integer | true | false | 없음 | `1` | 전체 페이지 수 |
| `totalElements` | integer | true | false | 없음 | `2` | 전체 건수 |
| `size` | integer | true | false | 없음 | `10` | 페이지 크기 |
| `number` | integer | true | false | 없음 | `0` | 현재 페이지 번호. 0부터 시작 |
| `sort` | object | true | false | 없음 | `{"empty":false,"sorted":true,"unsorted":false}` | 정렬 정보 |
| `first` | boolean | true | false | 없음 | `true` | 첫 페이지 여부 |
| `numberOfElements` | integer | true | false | 없음 | `2` | 현재 페이지 건수 |
| `empty` | boolean | true | false | 없음 | `false` | 빈 페이지 여부 |

- 명세에 필드별 required·nullable 표기가 없어 200 예시에 모든 필드가 값으로 존재하는 것을 근거로 required·non-null로 기록했다.

## Error Responses

| Status | 설명 | Body |
| --- | --- | --- |
| 400 | 잘못된 요청 — 요청 값의 형식 또는 정렬 조건 오류 | `{ message, status, timestamp, description }` |
| 401 | 만료된 토큰 | `{ message, status, timestamp, description }` |
| 403 | 인증 토큰이 없거나 유효하지 않거나 관리자 권한 없음 — 본문 없이 반환될 수 있음 | 없음(본문 없이 반환될 수 있음) |
| 405 | 지원하지 않는 메서드 | `{ message, status, timestamp, description }` |
| 500 | 내부 서버 오류 | `{ message, status, timestamp, description }` |


## Validation and Constraints

- 명세에 별도 제약 없음.

## Notes

- 이번 주 일요일 00:00 이상부터 다음 주 일요일 00:00 미만까지 작성된 관찰 및 특이사항을 조회한다.
- 요청 `page`는 1부터, 응답 `number`·`pageable.pageNumber`는 0부터 시작한다.
- 데이터베이스 엔드포인트 값 `/dashboard/animal-observations?page=1&size=10`의 Query String은 Path에서 분리했다.
- `content[].animalObservationId`·`animalId`는 Notion 명세에 아직 없다. 백엔드 develop `1247f43`(hotfix :: 대시보드 개체관리에 id 추가)의 `DashBoardQueryAnimalManageResponse`를 근거로 추가했다(2026-09-17, 개발자 결정).
- 응답에 종 ID(`animalKindId`)는 없다.
